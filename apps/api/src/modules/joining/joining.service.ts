import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JoiningChecklist } from './entities/joining-checklist.entity';
import { JoiningChecklistItem } from './entities/joining-checklist-item.entity';
import { CreateChecklistDto, UpdateChecklistItemDto } from './dto/create-checklist.dto';
import {
  JoiningChecklistStatus,
  JoiningItemStatus,
  JoiningItemType,
} from '@talentflow/shared';

const STANDARD_13_JOINING_ITEMS: { type: JoiningItemType; title: string; description: string }[] = [
  {
    type: JoiningItemType.CANDIDATE_ACCEPTANCE,
    title: 'Candidate Offer Acceptance',
    description: 'Signed offer letter received and recorded',
  },
  {
    type: JoiningItemType.REQUIRED_DOCUMENTS,
    title: 'Required Documents Submission',
    description: 'NID, educational certificates, photos, and experience letters collected',
  },
  {
    type: JoiningItemType.REFERENCE_CHECK,
    title: 'Reference Checks Completed',
    description: 'Professional reference checks verified and documented',
  },
  {
    type: JoiningItemType.OFFER_LETTER,
    title: 'Appointment Letter Issuance',
    description: 'Formal appointment letter issued and countersigned',
  },
  {
    type: JoiningItemType.JOINING_DATE,
    title: 'Joining Date Confirmation',
    description: 'Joining date confirmed with candidate and hiring department head',
  },
  {
    type: JoiningItemType.IT_REQUEST,
    title: 'IT Assets & Credentials Provisioning',
    description: 'Laptop/workstation, corporate email, ERP & VPN credentials configured',
  },
  {
    type: JoiningItemType.WORKSPACE,
    title: 'Workspace Allocation',
    description: 'Desk, workstation, extension phone, and stationery prepared',
  },
  {
    type: JoiningItemType.ID_CARD,
    title: 'Employee ID & Biometric Access',
    description: 'Employee ID card printed and biometric factory/office access enrolled',
  },
  {
    type: JoiningItemType.TRANSPORT,
    title: 'Transportation / Bus Route Setup',
    description: 'Factory bus route or company transport facility mapped',
  },
  {
    type: JoiningItemType.INDUCTION,
    title: 'HR Induction & Orientation',
    description: 'HR orientation schedule and company policy handbook briefing arranged',
  },
  {
    type: JoiningItemType.DEPARTMENT_NOTIFICATION,
    title: 'Department Welcome Notification',
    description: 'Welcome announcement and seating plan shared with department team',
  },
  {
    type: JoiningItemType.JOINING_COMPLETION,
    title: 'Day 1 Joining Formalities',
    description: 'Physical joining report signed and employee personal file created',
  },
  {
    type: JoiningItemType.DEPARTMENTAL_HANDOVER,
    title: 'Departmental Handover',
    description: 'Handoff to line manager / department head for departmental onboarding',
  },
];

@Injectable()
export class JoiningService {
  constructor(
    @InjectRepository(JoiningChecklist)
    private readonly checklistRepo: Repository<JoiningChecklist>,
    @InjectRepository(JoiningChecklistItem)
    private readonly itemRepo: Repository<JoiningChecklistItem>,
  ) {}

  async create(dto: CreateChecklistDto): Promise<JoiningChecklist> {
    const existing = await this.checklistRepo.findOne({
      where: { applicationId: dto.applicationId },
    });
    if (existing) {
      throw new BadRequestException('A joining checklist already exists for this application');
    }

    const checklist = this.checklistRepo.create({
      applicationId: dto.applicationId,
      candidateId: dto.candidateId,
      joiningDate: new Date(dto.joiningDate),
      status: JoiningChecklistStatus.IN_PROGRESS,
      readinessPercentage: 0,
      notes: dto.notes || null,
    });

    const saved = await this.checklistRepo.save(checklist);

    // Seed the 13 required items from spec
    const items = STANDARD_13_JOINING_ITEMS.map((item) =>
      this.itemRepo.create({
        checklistId: saved.id,
        itemType: item.type,
        title: item.title,
        description: item.description,
        status: JoiningItemStatus.PENDING,
      }),
    );
    await this.itemRepo.save(items);

    return this.findById(saved.id);
  }

  async findAll(params: {
    status?: JoiningChecklistStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.checklistRepo.createQueryBuilder('cl')
      .leftJoinAndSelect('cl.candidate', 'candidate')
      .leftJoinAndSelect('cl.application', 'app')
      .leftJoinAndSelect('app.requisition', 'req')
      .orderBy('cl.joiningDate', 'ASC')
      .skip(skip)
      .take(limit);

    if (params.status) {
      qb.andWhere('cl.status = :status', { status: params.status });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<JoiningChecklist> {
    const checklist = await this.checklistRepo.findOne({
      where: { id },
      relations: [
        'candidate',
        'application',
        'application.requisition',
        'items',
        'items.assignedTo',
        'items.verifiedBy',
      ],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException(`Joining checklist with ID ${id} not found`);
    }
    return checklist;
  }

  async findByApplication(applicationId: string): Promise<JoiningChecklist> {
    const checklist = await this.checklistRepo.findOne({
      where: { applicationId },
      relations: [
        'candidate',
        'application',
        'application.requisition',
        'items',
        'items.assignedTo',
        'items.verifiedBy',
      ],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException(`No joining checklist found for application ID ${applicationId}`);
    }
    return checklist;
  }

  async updateItem(
    checklistId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
    verifierUserId?: string,
  ): Promise<JoiningChecklist> {
    const checklist = await this.findById(checklistId);
    const item = checklist.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Checklist item with ID ${itemId} not found`);
    }

    if (dto.status) {
      item.status = dto.status as JoiningItemStatus;
      if (item.status === JoiningItemStatus.COMPLETED) {
        item.completedAt = new Date();
        if (verifierUserId) {
          item.verifiedById = verifierUserId;
        }
      }
    }
    if (dto.assignedToId !== undefined) item.assignedToId = dto.assignedToId;
    if (dto.dueDate !== undefined) item.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.comments !== undefined) item.comments = dto.comments;

    await this.itemRepo.save(item);

    // Recalculate readiness percentage across all items
    const updatedItems = await this.itemRepo.find({ where: { checklistId } });
    const applicableItems = updatedItems.filter((i) => i.status !== JoiningItemStatus.NOT_APPLICABLE);
    const completedItems = applicableItems.filter((i) => i.status === JoiningItemStatus.COMPLETED);

    const percentage = applicableItems.length > 0
      ? Number(((completedItems.length / applicableItems.length) * 100).toFixed(1))
      : 100;

    checklist.readinessPercentage = percentage;
    if (percentage === 100 && checklist.status === JoiningChecklistStatus.IN_PROGRESS) {
      checklist.status = JoiningChecklistStatus.READY;
    } else if (percentage < 100 && checklist.status === JoiningChecklistStatus.READY) {
      checklist.status = JoiningChecklistStatus.IN_PROGRESS;
    }

    await this.checklistRepo.save(checklist);

    return this.findById(checklistId);
  }

  async completeChecklist(id: string): Promise<JoiningChecklist> {
    const checklist = await this.findById(id);
    checklist.status = JoiningChecklistStatus.COMPLETED;
    checklist.readinessPercentage = 100;
    await this.checklistRepo.save(checklist);
    return this.findById(id);
  }
}
