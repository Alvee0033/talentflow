import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RESOURCES, ACTIONS, SystemRole } from '@talentflow/shared';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async createRole(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(`Role '${dto.name}' already exists`);
    }

    let permissions: Permission[] = [];
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });
      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const role = this.roleRepository.create({
      name: dto.name.trim(),
      description: dto.description || null,
      isSystemRole: false,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }
    return role;
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findRoleById(id);

    if (dto.name && dto.name.trim() !== role.name) {
      if (role.isSystemRole) {
        throw new BadRequestException('Cannot rename system role');
      }
      const existing = await this.roleRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing) {
        throw new ConflictException(`Role '${dto.name}' already exists`);
      }
      role.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      role.description = dto.description || null;
    }

    if (dto.permissionIds !== undefined) {
      if (dto.permissionIds.length > 0) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(dto.permissionIds) },
        });
        if (permissions.length !== dto.permissionIds.length) {
          throw new BadRequestException('One or more permission IDs are invalid');
        }
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete system role');
    }
    await this.roleRepository.softRemove(role);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async seedDefaultRolesAndPermissions(): Promise<{ permissionsCount: number; rolesCount: number }> {
    // 1. Seed all permissions from RESOURCES x ACTIONS
    const allPermissions: Permission[] = [];
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const name = `${resource}:${action}`;
        let permission = await this.permissionRepository.findOne({ where: { name } });
        if (!permission) {
          permission = this.permissionRepository.create({
            resource,
            action,
            name,
            description: `Permission to ${action} ${resource}`,
          });
          permission = await this.permissionRepository.save(permission);
        }
        allPermissions.push(permission);
      }
    }

    const permMap = new Map<string, Permission>();
    for (const p of allPermissions) {
      permMap.set(p.name, p);
    }

    const getPerms = (names: string[]): Permission[] =>
      names.map((n) => permMap.get(n)).filter((p): p is Permission => !!p);

    const getResourcePerms = (resources: string[], actions = ACTIONS as readonly string[]): Permission[] => {
      const result: Permission[] = [];
      for (const r of resources) {
        for (const a of actions) {
          const p = permMap.get(`${r}:${a}`);
          if (p) result.push(p);
        }
      }
      return result;
    };

    // 2. Define System Roles with their permission assignments
    const roleDefinitions: {
      name: SystemRole;
      description: string;
      permissions: Permission[];
    }[] = [
      {
        name: SystemRole.TA_ADMIN,
        description: 'Full Talent Acquisition Administrator with all permissions',
        permissions: allPermissions,
      },
      {
        name: SystemRole.TECH_ADMIN,
        description: 'Technical Administrator for user management, system roles, organization & audit logs',
        permissions: getResourcePerms(
          ['user', 'role', 'organization', 'audit-log', 'dashboard'],
        ),
      },
      {
        name: SystemRole.RECRUITER,
        description: 'Recruiter managing requisitions, candidates, interviews, messages and onboarding',
        permissions: [
          ...getResourcePerms(['requisition', 'candidate', 'application', 'interview', 'evaluation', 'message', 'task', 'joining', 'document', 'dashboard']),
          ...getPerms(['report:read', 'report:export', 'template:read', 'evaluation-form:read']),
        ],
      },
      {
        name: SystemRole.DEPT_HEAD,
        description: 'Department Head approving requisitions and reviewing interviews',
        permissions: [
          ...getPerms([
            'requisition:create',
            'requisition:read',
            'requisition:update',
            'requisition:approve',
            'candidate:read',
            'interview:read',
            'evaluation:read',
            'report:read',
            'dashboard:read',
          ]),
        ],
      },
      {
        name: SystemRole.HIRING_MANAGER,
        description: 'Hiring Manager creating requisitions, interviewing candidates and submitting evaluations',
        permissions: [
          ...getPerms([
            'requisition:create',
            'requisition:read',
            'requisition:update',
            'candidate:read',
            'application:read',
            'interview:read',
            'interview:create',
            'evaluation:create',
            'evaluation:read',
            'evaluation:update',
            'dashboard:read',
          ]),
        ],
      },
      {
        name: SystemRole.PANEL_MEMBER,
        description: 'Interview Panel Member conducting interviews and evaluating candidates',
        permissions: [
          ...getPerms([
            'interview:read',
            'candidate:read',
            'application:read',
            'evaluation:create',
            'evaluation:read',
            'evaluation:update',
          ]),
        ],
      },
      {
        name: SystemRole.HR_LEADERSHIP,
        description: 'HR Leadership with executive approval and reporting visibility',
        permissions: [
          ...getResourcePerms(
            ['requisition', 'candidate', 'application', 'interview', 'joining', 'report', 'dashboard', 'audit-log'],
            ['read', 'export', 'approve'],
          ),
        ],
      },
      {
        name: SystemRole.AUDIT_USER,
        description: 'Auditor with read-only visibility into system records and audit logs',
        permissions: [
          ...getResourcePerms(
            ['audit-log', 'report', 'requisition', 'candidate', 'user', 'role', 'organization', 'dashboard'],
            ['read', 'export'],
          ),
        ],
      },
    ];

    let rolesCount = 0;
    for (const def of roleDefinitions) {
      let role = await this.roleRepository.findOne({
        where: { name: def.name },
        relations: ['permissions'],
      });

      if (!role) {
        role = this.roleRepository.create({
          name: def.name,
          description: def.description,
          isSystemRole: true,
          permissions: def.permissions,
        });
      } else {
        role.description = def.description;
        role.isSystemRole = true;
        role.permissions = def.permissions;
      }
      await this.roleRepository.save(role);
      rolesCount++;
    }

    return {
      permissionsCount: allPermissions.length,
      rolesCount,
    };
  }
}
