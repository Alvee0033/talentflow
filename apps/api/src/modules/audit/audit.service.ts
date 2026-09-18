import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const entry = this.auditLogRepo.create({
        ...dto,
        details: dto.details ? this.sanitizeDetails(dto.details) : null,
      });
      return await this.auditLogRepo.save(entry);
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err?.message}`, err?.stack);
      return {} as AuditLog;
    }
  }

  async findAll(params: {
    resource?: string;
    action?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.auditLogRepo.createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.resource) {
      qb.andWhere('audit.resource = :resource', { resource: params.resource });
    }
    if (params.action) {
      qb.andWhere('audit.action = :action', { action: params.action });
    }
    if (params.userId) {
      qb.andWhere('audit.userId = :userId', { userId: params.userId });
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

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepo.findOne({ where: { id } });
  }

  async anonymizeCandidateAudit(candidateId: string): Promise<number> {
    const logs = await this.auditLogRepo.find({
      where: [
        { resource: 'candidate', resourceId: candidateId },
        { resource: 'application', resourceId: candidateId },
      ],
    });

    let updatedCount = 0;
    for (const log of logs) {
      log.details = {
        ...(log.details || {}),
        anonymized: true,
        candidateName: '[REDACTED]',
        email: '[REDACTED]',
        phone: '[REDACTED]',
      };
      await this.auditLogRepo.save(log);
      updatedCount++;
    }

    return updatedCount;
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'refreshToken', 'secret'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeDetails(sanitized[key]);
      }
    }
    return sanitized;
  }
}
