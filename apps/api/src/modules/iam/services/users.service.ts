import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  PaginationParams,
  getPaginationOptions,
  buildPaginatedResponse,
} from '../../../common/utils/pagination.util';

export interface UserFilterParams extends PaginationParams {
  search?: string;
  departmentId?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  private readonly bcryptRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly configService: ConfigService,
  ) {
    this.bcryptRounds = this.configService.get<number>('auth.bcryptRounds') || 12;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    const passwordHash = await this.hashPassword(dto.password);

    let roles: Role[] = [];
    if (dto.roleIds && dto.roleIds.length > 0) {
      roles = await this.roleRepository.find({
        where: { id: In(dto.roleIds) },
      });
      if (roles.length !== dto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
    }

    const user = this.userRepository.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      employeeId: dto.employeeId || null,
      phone: dto.phone || null,
      departmentId: dto.departmentId || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      roles,
    });

    return this.userRepository.save(user);
  }

  async findAll(params: UserFilterParams) {
    const { skip, take } = getPaginationOptions(params);

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .skip(skip)
      .take(take);

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.employeeId) LIKE :search)',
        { search },
      );
    }

    if (params.departmentId) {
      qb.andWhere('user.departmentId = :departmentId', { departmentId: params.departmentId });
    }

    if (params.role) {
      qb.andWhere('roles.name = :roleName', { roleName: params.role });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.sortBy) {
      const order = params.sortOrder || 'ASC';
      qb.orderBy(`user.${params.sortBy}`, order);
    } else {
      qb.orderBy('user.createdAt', 'DESC');
    }

    const [items, total] = await qb.getManyAndCount();

    return buildPaginatedResponse(items, total, params);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) user.phone = dto.phone || null;
    if (dto.departmentId !== undefined) user.departmentId = dto.departmentId || null;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    if (dto.password) {
      user.passwordHash = await this.hashPassword(dto.password);
    }

    if (dto.roleIds !== undefined) {
      if (dto.roleIds.length > 0) {
        const roles = await this.roleRepository.find({
          where: { id: In(dto.roleIds) },
        });
        if (roles.length !== dto.roleIds.length) {
          throw new BadRequestException('One or more role IDs are invalid');
        }
        user.roles = roles;
      } else {
        user.roles = [];
      }
    }

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.softRemove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findById(userId);

    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    user.roles = roles;
    return this.userRepository.save(user);
  }
}
