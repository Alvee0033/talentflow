import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { ApplicationStageHistory } from './entities/application-stage-history.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import {
  ApplicationStage,
  ApplicationOutcome,
  VALID_STAGE_TRANSITIONS,
} from '@talentflow/shared';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(ApplicationStageHistory)
    private readonly stageHistoryRepo: Repository<ApplicationStageHistory>,
  ) {}

  async create(dto: CreateApplicationDto, creatorId?: string): Promise<Application> {
    const existing = await this.applicationRepo.findOne({
      where: { candidateId: dto.candidateId, requisitionId: dto.requisitionId },
    });
    if (existing) {
      throw new BadRequestException('Candidate already has an application for this requisition');
    }

    const application = this.applicationRepo.create({
      candidateId: dto.candidateId,
      requisitionId: dto.requisitionId,
      stage: ApplicationStage.NEW,
      notes: dto.notes,
      rating: dto.rating,
      nextAction: dto.nextAction || 'Screen resume and basic qualifications',
      nextActionOwnerId: dto.nextActionOwnerId || creatorId || null,
      nextActionDueDate: dto.nextActionDueDate ? new Date(dto.nextActionDueDate) : null,
      appliedDate: new Date(),
    });

    const saved = await this.applicationRepo.save(application);

    // Record initial stage history
    const history = this.stageHistoryRepo.create({
      applicationId: saved.id,
      fromStage: null,
      toStage: ApplicationStage.NEW,
      changedById: creatorId || null,
      reason: 'Application created',
      notes: dto.notes || null,
    });
    await this.stageHistoryRepo.save(history);

    return this.findById(saved.id);
  }

  async findAll(params: {
    requisitionId?: string;
    candidateId?: string;
    stage?: ApplicationStage;
    outcome?: ApplicationOutcome;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.applicationRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.candidate', 'candidate')
      .leftJoinAndSelect('app.requisition', 'requisition')
      .orderBy('app.appliedDate', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.requisitionId) {
      qb.andWhere('app.requisitionId = :requisitionId', { requisitionId: params.requisitionId });
    }
    if (params.candidateId) {
      qb.andWhere('app.candidateId = :candidateId', { candidateId: params.candidateId });
    }
    if (params.stage) {
      qb.andWhere('app.stage = :stage', { stage: params.stage });
    }
    if (params.outcome) {
      qb.andWhere('app.outcome = :outcome', { outcome: params.outcome });
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

  async findById(id: string): Promise<Application> {
    const application = await this.applicationRepo.findOne({
      where: { id },
      relations: ['candidate', 'requisition', 'stageHistories', 'screenings'],
      order: {
        stageHistories: {
          createdAt: 'DESC',
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async updateStage(
    id: string,
    dto: UpdateStageDto,
    changedById?: string,
  ): Promise<Application> {
    const application = await this.findById(id);

    // Business rule: Validate stage transitions
    const validTransitions = VALID_STAGE_TRANSITIONS[application.stage];
    if (!validTransitions || !validTransitions.includes(dto.stage)) {
      throw new BadRequestException(
        `Invalid stage transition from '${application.stage}' to '${dto.stage}'. Valid transitions: [${(validTransitions || []).join(', ')}]`,
      );
    }

    const previousStage = application.stage;
    application.stage = dto.stage;

    // Update next action attributes
    application.nextAction = dto.nextAction || this.getDefaultNextAction(dto.stage);
    if (dto.nextActionOwnerId !== undefined) {
      application.nextActionOwnerId = dto.nextActionOwnerId;
    }
    if (dto.nextActionDueDate !== undefined) {
      application.nextActionDueDate = dto.nextActionDueDate ? new Date(dto.nextActionDueDate) : null;
    }

    // If transitioned to JOINED, set outcome to SELECTED
    if (dto.stage === ApplicationStage.JOINED) {
      application.outcome = ApplicationOutcome.SELECTED;
    }

    const saved = await this.applicationRepo.save(application);

    // Record stage history
    const history = this.stageHistoryRepo.create({
      applicationId: application.id,
      fromStage: previousStage,
      toStage: dto.stage,
      changedById: changedById || null,
      reason: dto.reason || null,
      notes: dto.notes || null,
    });
    await this.stageHistoryRepo.save(history);

    return saved;
  }

  async rejectApplication(
    id: string,
    dto: RejectApplicationDto,
    changedById?: string,
  ): Promise<Application> {
    const application = await this.findById(id);

    application.outcome = ApplicationOutcome.REJECTED;
    application.rejectionReason = dto.reason;
    application.rejectionNotes = dto.notes || null;
    application.nextAction = 'Application Rejected';
    application.nextActionDueDate = null;

    const saved = await this.applicationRepo.save(application);

    const history = this.stageHistoryRepo.create({
      applicationId: application.id,
      fromStage: application.stage,
      toStage: application.stage,
      changedById: changedById || null,
      reason: `REJECTED: ${dto.reason}`,
      notes: dto.notes || null,
    });
    await this.stageHistoryRepo.save(history);

    return saved;
  }

  async getStageHistory(id: string): Promise<ApplicationStageHistory[]> {
    return await this.stageHistoryRepo.find({
      where: { applicationId: id },
      order: { createdAt: 'DESC' },
    });
  }

  private getDefaultNextAction(stage: ApplicationStage): string {
    switch (stage) {
      case ApplicationStage.NEW:
        return 'Review candidate CV';
      case ApplicationStage.SCREENING:
        return 'Conduct screening call';
      case ApplicationStage.ASSESSMENT:
        return 'Review assessment results';
      case ApplicationStage.INTERVIEW:
        return 'Schedule panel interview';
      case ApplicationStage.FEEDBACK_PENDING:
        return 'Submit interview feedback';
      case ApplicationStage.APPROVAL:
        return 'Obtain offer approval';
      case ApplicationStage.SELECTED:
        return 'Issue offer letter';
      case ApplicationStage.JOINING:
        return 'Complete pre-joining checklist';
      case ApplicationStage.JOINED:
        return 'Department induction & onboarding';
      default:
        return 'Pending next action';
    }
  }
}
