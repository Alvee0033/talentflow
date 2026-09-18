import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCandidateDto, allowDuplicate = false): Promise<Candidate> {
    if (!allowDuplicate) {
      const dupCheck = await this.duplicateDetectionService.checkDuplicates({
        email: dto.email,
        phone: dto.phone || undefined,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      if (dupCheck.hardMatch) {
        throw new ConflictException(`Candidate with email ${dto.email} already exists`);
      }
    }

    const candidate = this.candidateRepo.create(dto);
    return await this.candidateRepo.save(candidate);
  }

  async findAll(params: {
    search?: string;
    source?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.candidateRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.applications', 'apps')
      .where('c.isAnonymized = false')
      .orderBy('c.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.search) {
      qb.andWhere(
        '(LOWER(c.firstName) LIKE LOWER(:search) OR LOWER(c.lastName) LIKE LOWER(:search) OR LOWER(c.email) LIKE LOWER(:search) OR LOWER(c.currentCompany) LIKE LOWER(:search))',
        { search: `%${params.search}%` },
      );
    }

    if (params.source) {
      qb.andWhere('c.source = :source', { source: params.source });
    }

    if (params.tag) {
      qb.andWhere('c.tags LIKE :tag', { tag: `%${params.tag}%` });
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

  async findById(id: string): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({
      where: { id },
      relations: ['applications', 'applications.stageHistories'],
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }
    return candidate;
  }

  async update(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
    const candidate = await this.findById(id);
    Object.assign(candidate, dto);
    return await this.candidateRepo.save(candidate);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const candidate = await this.findById(id);
    await this.candidateRepo.softDelete(candidate.id);
    return { success: true, message: 'Candidate deleted successfully' };
  }

  async anonymizeCandidate(id: string): Promise<Candidate> {
    const candidate = await this.findById(id);

    candidate.firstName = 'Anonymized';
    candidate.lastName = 'Candidate';
    candidate.email = `anonymized_${candidate.id.substring(0, 8)}@talentflow.local`;
    candidate.phone = null;
    candidate.resumeUrl = null;
    candidate.notes = null;
    candidate.currentCompany = null;
    candidate.currentTitle = null;
    candidate.skills = null;
    candidate.tags = null;
    candidate.isAnonymized = true;

    const saved = await this.candidateRepo.save(candidate);
    await this.auditService.anonymizeCandidateAudit(id);

    return saved;
  }
}
