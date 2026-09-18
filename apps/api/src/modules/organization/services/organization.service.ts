import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessUnit } from '../entities/business-unit.entity';
import { Department } from '../entities/department.entity';
import { Position } from '../entities/position.entity';
import { CreateBusinessUnitDto } from '../dto/create-business-unit.dto';
import { UpdateBusinessUnitDto } from '../dto/update-business-unit.dto';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { CreatePositionDto } from '../dto/create-position.dto';
import { UpdatePositionDto } from '../dto/update-position.dto';
import {
  PaginationParams,
  getPaginationOptions,
  buildPaginatedResponse,
} from '../../../common/utils/pagination.util';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(BusinessUnit)
    private readonly businessUnitRepository: Repository<BusinessUnit>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
  ) {}

  // ----------------------------------------------------
  // BUSINESS UNITS
  // ----------------------------------------------------

  async createBusinessUnit(dto: CreateBusinessUnitDto): Promise<BusinessUnit> {
    const existingCode = await this.businessUnitRepository.findOne({
      where: { code: dto.code.toUpperCase().trim() },
    });
    if (existingCode) {
      throw new ConflictException(`Business unit with code '${dto.code}' already exists`);
    }

    const existingName = await this.businessUnitRepository.findOne({
      where: { name: dto.name.trim() },
    });
    if (existingName) {
      throw new ConflictException(`Business unit with name '${dto.name}' already exists`);
    }

    const bu = this.businessUnitRepository.create({
      name: dto.name.trim(),
      code: dto.code.toUpperCase().trim(),
      description: dto.description || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.businessUnitRepository.save(bu);
  }

  async findAllBusinessUnits(params?: PaginationParams & { search?: string; isActive?: boolean }) {
    if (!params) {
      return this.businessUnitRepository.find({
        order: { name: 'ASC' },
        relations: ['departments'],
      });
    }

    const { skip, take } = getPaginationOptions(params);
    const qb = this.businessUnitRepository
      .createQueryBuilder('bu')
      .leftJoinAndSelect('bu.departments', 'departments')
      .skip(skip)
      .take(take);

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      qb.andWhere('(LOWER(bu.name) LIKE :search OR LOWER(bu.code) LIKE :search)', { search });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('bu.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.sortBy) {
      const order = params.sortOrder || 'ASC';
      qb.orderBy(`bu.${params.sortBy}`, order);
    } else {
      qb.orderBy('bu.name', 'ASC');
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(items, total, params);
  }

  async findBusinessUnitById(id: string): Promise<BusinessUnit> {
    const bu = await this.businessUnitRepository.findOne({
      where: { id },
      relations: ['departments', 'departments.positions'],
    });
    if (!bu) {
      throw new NotFoundException(`Business Unit with ID '${id}' not found`);
    }
    return bu;
  }

  async updateBusinessUnit(id: string, dto: UpdateBusinessUnitDto): Promise<BusinessUnit> {
    const bu = await this.findBusinessUnitById(id);

    if (dto.code && dto.code.toUpperCase().trim() !== bu.code) {
      const existing = await this.businessUnitRepository.findOne({
        where: { code: dto.code.toUpperCase().trim() },
      });
      if (existing) {
        throw new ConflictException(`Business unit with code '${dto.code}' already exists`);
      }
      bu.code = dto.code.toUpperCase().trim();
    }

    if (dto.name && dto.name.trim() !== bu.name) {
      const existing = await this.businessUnitRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing) {
        throw new ConflictException(`Business unit with name '${dto.name}' already exists`);
      }
      bu.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      bu.description = dto.description || null;
    }

    if (dto.isActive !== undefined) {
      bu.isActive = dto.isActive;
    }

    return this.businessUnitRepository.save(bu);
  }

  async deleteBusinessUnit(id: string): Promise<void> {
    const bu = await this.findBusinessUnitById(id);
    await this.businessUnitRepository.softRemove(bu);
  }

  // ----------------------------------------------------
  // DEPARTMENTS
  // ----------------------------------------------------

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    const bu = await this.businessUnitRepository.findOne({
      where: { id: dto.businessUnitId },
    });
    if (!bu) {
      throw new BadRequestException(`Business Unit with ID '${dto.businessUnitId}' does not exist`);
    }

    const existingCode = await this.departmentRepository.findOne({
      where: { code: dto.code.toUpperCase().trim() },
    });
    if (existingCode) {
      throw new ConflictException(`Department with code '${dto.code}' already exists`);
    }

    const existingName = await this.departmentRepository.findOne({
      where: { name: dto.name.trim() },
    });
    if (existingName) {
      throw new ConflictException(`Department with name '${dto.name}' already exists`);
    }

    const dept = this.departmentRepository.create({
      name: dto.name.trim(),
      code: dto.code.toUpperCase().trim(),
      businessUnitId: dto.businessUnitId,
      headUserId: dto.headUserId || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.departmentRepository.save(dept);
  }

  async findAllDepartments(params?: PaginationParams & { businessUnitId?: string; search?: string; isActive?: boolean }) {
    if (!params) {
      return this.departmentRepository.find({
        relations: ['businessUnit', 'positions'],
        order: { name: 'ASC' },
      });
    }

    const { skip, take } = getPaginationOptions(params);
    const qb = this.departmentRepository
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.businessUnit', 'businessUnit')
      .leftJoinAndSelect('dept.positions', 'positions')
      .skip(skip)
      .take(take);

    if (params.businessUnitId) {
      qb.andWhere('dept.businessUnitId = :businessUnitId', { businessUnitId: params.businessUnitId });
    }

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      qb.andWhere('(LOWER(dept.name) LIKE :search OR LOWER(dept.code) LIKE :search)', { search });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('dept.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.sortBy) {
      const order = params.sortOrder || 'ASC';
      qb.orderBy(`dept.${params.sortBy}`, order);
    } else {
      qb.orderBy('dept.name', 'ASC');
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(items, total, params);
  }

  async findDepartmentById(id: string): Promise<Department> {
    const dept = await this.departmentRepository.findOne({
      where: { id },
      relations: ['businessUnit', 'positions'],
    });
    if (!dept) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }
    return dept;
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.findDepartmentById(id);

    if (dto.businessUnitId) {
      const bu = await this.businessUnitRepository.findOne({
        where: { id: dto.businessUnitId },
      });
      if (!bu) {
        throw new BadRequestException(`Business Unit with ID '${dto.businessUnitId}' does not exist`);
      }
      dept.businessUnitId = dto.businessUnitId;
    }

    if (dto.code && dto.code.toUpperCase().trim() !== dept.code) {
      const existing = await this.departmentRepository.findOne({
        where: { code: dto.code.toUpperCase().trim() },
      });
      if (existing) {
        throw new ConflictException(`Department with code '${dto.code}' already exists`);
      }
      dept.code = dto.code.toUpperCase().trim();
    }

    if (dto.name && dto.name.trim() !== dept.name) {
      const existing = await this.departmentRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing) {
        throw new ConflictException(`Department with name '${dto.name}' already exists`);
      }
      dept.name = dto.name.trim();
    }

    if (dto.headUserId !== undefined) {
      dept.headUserId = dto.headUserId || null;
    }

    if (dto.isActive !== undefined) {
      dept.isActive = dto.isActive;
    }

    return this.departmentRepository.save(dept);
  }

  async deleteDepartment(id: string): Promise<void> {
    const dept = await this.findDepartmentById(id);
    await this.departmentRepository.softRemove(dept);
  }

  // ----------------------------------------------------
  // POSITIONS
  // ----------------------------------------------------

  async createPosition(dto: CreatePositionDto): Promise<Position> {
    const dept = await this.departmentRepository.findOne({
      where: { id: dto.departmentId },
    });
    if (!dept) {
      throw new BadRequestException(`Department with ID '${dto.departmentId}' does not exist`);
    }

    const position = this.positionRepository.create({
      title: dto.title.trim(),
      departmentId: dto.departmentId,
      level: dto.level || 'Mid',
      description: dto.description || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.positionRepository.save(position);
  }

  async findAllPositions(params?: PaginationParams & { departmentId?: string; search?: string; isActive?: boolean }) {
    if (!params) {
      return this.positionRepository.find({
        relations: ['department', 'department.businessUnit'],
        order: { title: 'ASC' },
      });
    }

    const { skip, take } = getPaginationOptions(params);
    const qb = this.positionRepository
      .createQueryBuilder('pos')
      .leftJoinAndSelect('pos.department', 'department')
      .leftJoinAndSelect('department.businessUnit', 'businessUnit')
      .skip(skip)
      .take(take);

    if (params.departmentId) {
      qb.andWhere('pos.departmentId = :departmentId', { departmentId: params.departmentId });
    }

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      qb.andWhere('LOWER(pos.title) LIKE :search', { search });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('pos.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.sortBy) {
      const order = params.sortOrder || 'ASC';
      qb.orderBy(`pos.${params.sortBy}`, order);
    } else {
      qb.orderBy('pos.title', 'ASC');
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(items, total, params);
  }

  async findPositionById(id: string): Promise<Position> {
    const pos = await this.positionRepository.findOne({
      where: { id },
      relations: ['department', 'department.businessUnit'],
    });
    if (!pos) {
      throw new NotFoundException(`Position with ID '${id}' not found`);
    }
    return pos;
  }

  async updatePosition(id: string, dto: UpdatePositionDto): Promise<Position> {
    const pos = await this.findPositionById(id);

    if (dto.departmentId) {
      const dept = await this.departmentRepository.findOne({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException(`Department with ID '${dto.departmentId}' does not exist`);
      }
      pos.departmentId = dto.departmentId;
    }

    if (dto.title) pos.title = dto.title.trim();
    if (dto.level) pos.level = dto.level;
    if (dto.description !== undefined) pos.description = dto.description || null;
    if (dto.isActive !== undefined) pos.isActive = dto.isActive;

    return this.positionRepository.save(pos);
  }

  async deletePosition(id: string): Promise<void> {
    const pos = await this.findPositionById(id);
    await this.positionRepository.softRemove(pos);
  }
}
