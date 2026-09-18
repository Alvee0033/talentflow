import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RequisitionStatus } from '@talentflow/shared';
import { Requisition } from '../entities/requisition.entity';
import { CreateRequisitionDto } from '../dto/create-requisition.dto';
import { UpdateRequisitionDto } from '../dto/update-requisition.dto';
import { ChangeStatusDto } from '../dto/change-status.dto';
import { User } from '../../iam/entities/user.entity';
import { BusinessUnit } from '../../organization/entities/business-unit.entity';
import { Department } from '../../organization/entities/department.entity';
import { Position } from '../../organization/entities/position.entity';
import {
  PaginationParams,
  getPaginationOptions,
  buildPaginatedResponse,
} from '../../../common/utils/pagination.util';

export interface RequisitionFilterParams extends PaginationParams {
  search?: string;
  status?: RequisitionStatus;
  businessUnitId?: string;
  departmentId?: string;
  positionId?: string;
  hiringManagerId?: string;
  assignedRecruiterId?: string;
}

const ALLOWED_TRANSITIONS: Record<RequisitionStatus, RequisitionStatus[]> = {
  [RequisitionStatus.DRAFT]: [
    RequisitionStatus.AWAITING_APPROVAL,
    RequisitionStatus.CLOSED,
  ],
  [RequisitionStatus.AWAITING_APPROVAL]: [
    RequisitionStatus.APPROVED,
    RequisitionStatus.DRAFT,
    RequisitionStatus.CLOSED,
  ],
  [RequisitionStatus.APPROVED]: [
    RequisitionStatus.OPEN,
    RequisitionStatus.ON_HOLD,
    RequisitionStatus.CLOSED,
  ],
  [RequisitionStatus.OPEN]: [
    RequisitionStatus.ON_HOLD,
    RequisitionStatus.FILLED,
    RequisitionStatus.CLOSED,
  ],
  [RequisitionStatus.ON_HOLD]: [
    RequisitionStatus.OPEN,
    RequisitionStatus.CLOSED,
  ],
  [RequisitionStatus.FILLED]: [
    RequisitionStatus.CLOSED,
  ],
  [RequisitionStatus.CLOSED]: [
    RequisitionStatus.DRAFT,
  ],
};

@Injectable()
export class RequisitionsService {
  constructor(
    @InjectRepository(Requisition)
    private readonly requisitionRepository: Repository<Requisition>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BusinessUnit)
    private readonly businessUnitRepository: Repository<BusinessUnit>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
  ) {}

  async generateRequisitionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;

    const latest = await this.requisitionRepository
      .createQueryBuilder('req')
      .where('req.requisitionNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('req.requisitionNumber', 'DESC')
      .getOne();

    let seq = 1;
    if (latest && latest.requisitionNumber) {
      const parts = latest.requisitionNumber.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          seq = parsed + 1;
        }
      }
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async create(dto: CreateRequisitionDto, defaultHiringManagerId?: string): Promise<Requisition> {
    const bu = await this.businessUnitRepository.findOne({
      where: { id: dto.businessUnitId },
    });
    if (!bu) {
      throw new BadRequestException(`Business Unit with ID '${dto.businessUnitId}' not found`);
    }

    const dept = await this.departmentRepository.findOne({
      where: { id: dto.departmentId },
    });
    if (!dept) {
      throw new BadRequestException(`Department with ID '${dto.departmentId}' not found`);
    }

    if (dto.positionId) {
      const pos = await this.positionRepository.findOne({
        where: { id: dto.positionId },
      });
      if (!pos) {
        throw new BadRequestException(`Position with ID '${dto.positionId}' not found`);
      }
    }

    const hiringManagerId = dto.hiringManagerId || defaultHiringManagerId;
    if (!hiringManagerId) {
      throw new BadRequestException('Hiring manager must be specified');
    }

    const hiringManager = await this.userRepository.findOne({
      where: { id: hiringManagerId },
    });
    if (!hiringManager) {
      throw new BadRequestException(`Hiring Manager with ID '${hiringManagerId}' not found`);
    }

    if (dto.assignedRecruiterId) {
      const recruiter = await this.userRepository.findOne({
        where: { id: dto.assignedRecruiterId },
      });
      if (!recruiter) {
        throw new BadRequestException(`Recruiter with ID '${dto.assignedRecruiterId}' not found`);
      }
    }

    const requisitionNumber = await this.generateRequisitionNumber();

    const requisition = this.requisitionRepository.create({
      requisitionNumber,
      title: dto.title.trim(),
      businessUnitId: dto.businessUnitId,
      departmentId: dto.departmentId,
      positionId: dto.positionId || null,
      headcount: dto.headcount || 1,
      employmentType: dto.employmentType || 'FULL_TIME',
      experienceLevel: dto.experienceLevel || 'Mid',
      minSalary: dto.minSalary || null,
      maxSalary: dto.maxSalary || null,
      currency: dto.currency || 'BDT',
      location: dto.location || 'Dhaka, Bangladesh',
      isRemote: dto.isRemote || false,
      jobDescription: dto.jobDescription,
      requirements: dto.requirements || null,
      status: dto.status || RequisitionStatus.DRAFT,
      hiringManagerId,
      assignedRecruiterId: dto.assignedRecruiterId || null,
      targetHireDate: dto.targetHireDate ? new Date(dto.targetHireDate) : null,
      notes: dto.notes || null,
      openedAt: dto.status === RequisitionStatus.OPEN ? new Date() : null,
    });

    return this.requisitionRepository.save(requisition);
  }

  async findAll(params: RequisitionFilterParams) {
    const { skip, take } = getPaginationOptions(params);

    const qb = this.requisitionRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.businessUnit', 'bu')
      .leftJoinAndSelect('req.department', 'dept')
      .leftJoinAndSelect('req.position', 'position')
      .leftJoinAndSelect('req.hiringManager', 'hiringManager')
      .leftJoinAndSelect('req.assignedRecruiter', 'assignedRecruiter')
      .leftJoinAndSelect('req.approvals', 'approvals')
      .leftJoinAndSelect('approvals.approver', 'approver')
      .skip(skip)
      .take(take);

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(req.title) LIKE :search OR LOWER(req.requisitionNumber) LIKE :search OR LOWER(req.location) LIKE :search)',
        { search },
      );
    }

    if (params.status) {
      qb.andWhere('req.status = :status', { status: params.status });
    }

    if (params.businessUnitId) {
      qb.andWhere('req.businessUnitId = :businessUnitId', {
        businessUnitId: params.businessUnitId,
      });
    }

    if (params.departmentId) {
      qb.andWhere('req.departmentId = :departmentId', {
        departmentId: params.departmentId,
      });
    }

    if (params.positionId) {
      qb.andWhere('req.positionId = :positionId', {
        positionId: params.positionId,
      });
    }

    if (params.hiringManagerId) {
      qb.andWhere('req.hiringManagerId = :hiringManagerId', {
        hiringManagerId: params.hiringManagerId,
      });
    }

    if (params.assignedRecruiterId) {
      qb.andWhere('req.assignedRecruiterId = :assignedRecruiterId', {
        assignedRecruiterId: params.assignedRecruiterId,
      });
    }

    if (params.sortBy) {
      const order = params.sortOrder || 'ASC';
      qb.orderBy(`req.${params.sortBy}`, order);
    } else {
      qb.orderBy('req.createdAt', 'DESC');
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(items, total, params);
  }

  async findById(id: string): Promise<Requisition> {
    const requisition = await this.requisitionRepository.findOne({
      where: { id },
      relations: [
        'businessUnit',
        'department',
        'position',
        'hiringManager',
        'assignedRecruiter',
        'approvals',
        'approvals.approver',
      ],
      order: {
        approvals: {
          step: 'ASC',
        },
      },
    });

    if (!requisition) {
      throw new NotFoundException(`Requisition with ID '${id}' not found`);
    }

    return requisition;
  }

  async findByNumber(requisitionNumber: string): Promise<Requisition> {
    const requisition = await this.requisitionRepository.findOne({
      where: { requisitionNumber },
      relations: [
        'businessUnit',
        'department',
        'position',
        'hiringManager',
        'assignedRecruiter',
        'approvals',
        'approvals.approver',
      ],
    });

    if (!requisition) {
      throw new NotFoundException(`Requisition '${requisitionNumber}' not found`);
    }

    return requisition;
  }

  async update(id: string, dto: UpdateRequisitionDto): Promise<Requisition> {
    const requisition = await this.findById(id);

    if (dto.businessUnitId) {
      const bu = await this.businessUnitRepository.findOne({
        where: { id: dto.businessUnitId },
      });
      if (!bu) {
        throw new BadRequestException(`Business Unit with ID '${dto.businessUnitId}' not found`);
      }
      requisition.businessUnitId = dto.businessUnitId;
    }

    if (dto.departmentId) {
      const dept = await this.departmentRepository.findOne({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException(`Department with ID '${dto.departmentId}' not found`);
      }
      requisition.departmentId = dto.departmentId;
    }

    if (dto.positionId) {
      const pos = await this.positionRepository.findOne({
        where: { id: dto.positionId },
      });
      if (!pos) {
        throw new BadRequestException(`Position with ID '${dto.positionId}' not found`);
      }
      requisition.positionId = dto.positionId;
    }

    if (dto.hiringManagerId) {
      const hm = await this.userRepository.findOne({
        where: { id: dto.hiringManagerId },
      });
      if (!hm) {
        throw new BadRequestException(`Hiring manager with ID '${dto.hiringManagerId}' not found`);
      }
      requisition.hiringManagerId = dto.hiringManagerId;
    }

    if (dto.assignedRecruiterId) {
      const recruiter = await this.userRepository.findOne({
        where: { id: dto.assignedRecruiterId },
      });
      if (!recruiter) {
        throw new BadRequestException(`Recruiter with ID '${dto.assignedRecruiterId}' not found`);
      }
      requisition.assignedRecruiterId = dto.assignedRecruiterId;
    }

    if (dto.title) requisition.title = dto.title.trim();
    if (dto.headcount) requisition.headcount = dto.headcount;
    if (dto.employmentType) requisition.employmentType = dto.employmentType;
    if (dto.experienceLevel) requisition.experienceLevel = dto.experienceLevel;
    if (dto.minSalary !== undefined) requisition.minSalary = dto.minSalary;
    if (dto.maxSalary !== undefined) requisition.maxSalary = dto.maxSalary;
    if (dto.currency) requisition.currency = dto.currency;
    if (dto.location) requisition.location = dto.location;
    if (dto.isRemote !== undefined) requisition.isRemote = dto.isRemote;
    if (dto.jobDescription) requisition.jobDescription = dto.jobDescription;
    if (dto.requirements !== undefined) requisition.requirements = dto.requirements;
    if (dto.targetHireDate) requisition.targetHireDate = new Date(dto.targetHireDate);
    if (dto.notes !== undefined) requisition.notes = dto.notes;
    if (dto.rejectionReason !== undefined) requisition.rejectionReason = dto.rejectionReason;

    // Handle status change through update if provided
    if (dto.status && dto.status !== requisition.status) {
      this.validateStatusTransition(requisition.status, dto.status);
      requisition.status = dto.status;
      if (dto.status === RequisitionStatus.OPEN && !requisition.openedAt) {
        requisition.openedAt = new Date();
      }
      if (dto.status === RequisitionStatus.CLOSED || dto.status === RequisitionStatus.FILLED) {
        requisition.closedAt = new Date();
      }
    }

    return this.requisitionRepository.save(requisition);
  }

  validateStatusTransition(currentStatus: RequisitionStatus, targetStatus: RequisitionStatus): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: ${allowed ? allowed.join(', ') : 'none'}`,
      );
    }
  }

  async changeStatus(id: string, dto: ChangeStatusDto): Promise<Requisition> {
    const requisition = await this.findById(id);

    this.validateStatusTransition(requisition.status, dto.status);

    requisition.status = dto.status;

    if (dto.notes) {
      requisition.notes = dto.notes;
    }

    if (dto.reason) {
      requisition.rejectionReason = dto.reason;
    }

    if (dto.status === RequisitionStatus.OPEN && !requisition.openedAt) {
      requisition.openedAt = new Date();
    }

    if (dto.status === RequisitionStatus.CLOSED || dto.status === RequisitionStatus.FILLED) {
      requisition.closedAt = new Date();
    }

    return this.requisitionRepository.save(requisition);
  }

  async assignRecruiter(id: string, recruiterId: string): Promise<Requisition> {
    const requisition = await this.findById(id);

    const recruiter = await this.userRepository.findOne({
      where: { id: recruiterId },
    });
    if (!recruiter) {
      throw new NotFoundException(`Recruiter with ID '${recruiterId}' not found`);
    }

    requisition.assignedRecruiterId = recruiterId;
    requisition.assignedRecruiter = recruiter;

    return this.requisitionRepository.save(requisition);
  }

  async delete(id: string): Promise<void> {
    const requisition = await this.findById(id);
    await this.requisitionRepository.softRemove(requisition);
  }
}
