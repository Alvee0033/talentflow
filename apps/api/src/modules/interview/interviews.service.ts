import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewPanelist } from './entities/interview-panelist.entity';
import { InterviewRescheduleHistory } from './entities/interview-reschedule-history.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { RescheduleInterviewDto } from './dto/reschedule-interview.dto';
import { InterviewStatus } from '@talentflow/shared';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(InterviewPanelist)
    private readonly panelistRepo: Repository<InterviewPanelist>,
    @InjectRepository(InterviewRescheduleHistory)
    private readonly rescheduleHistoryRepo: Repository<InterviewRescheduleHistory>,
  ) {}

  async schedule(dto: CreateInterviewDto): Promise<Interview> {
    const interview = this.interviewRepo.create({
      applicationId: dto.applicationId,
      title: dto.title,
      roundNumber: dto.roundNumber || 1,
      scheduledStartTime: new Date(dto.scheduledStartTime),
      scheduledEndTime: new Date(dto.scheduledEndTime),
      status: InterviewStatus.SCHEDULED,
      location: dto.location || null,
      meetingLink: dto.meetingLink || null,
      notes: dto.notes || null,
      evaluationFormId: dto.evaluationFormId || null,
    });

    const saved = await this.interviewRepo.save(interview);

    if (dto.panelists && dto.panelists.length > 0) {
      const panelistEntities = dto.panelists.map((p) =>
        this.panelistRepo.create({
          interviewId: saved.id,
          userId: p.userId,
          isLead: !!p.isLead,
        }),
      );
      await this.panelistRepo.save(panelistEntities);
    }

    return this.findById(saved.id);
  }

  async findAll(params: {
    applicationId?: string;
    panelistId?: string;
    status?: InterviewStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.interviewRepo.createQueryBuilder('interview')
      .leftJoinAndSelect('interview.application', 'app')
      .leftJoinAndSelect('app.candidate', 'candidate')
      .leftJoinAndSelect('interview.panelists', 'panelist')
      .leftJoinAndSelect('panelist.user', 'user')
      .orderBy('interview.scheduledStartTime', 'ASC')
      .skip(skip)
      .take(limit);

    if (params.applicationId) {
      qb.andWhere('interview.applicationId = :applicationId', { applicationId: params.applicationId });
    }
    if (params.panelistId) {
      qb.andWhere('panelist.userId = :panelistId', { panelistId: params.panelistId });
    }
    if (params.status) {
      qb.andWhere('interview.status = :status', { status: params.status });
    }
    if (params.from) {
      qb.andWhere('interview.scheduledStartTime >= :from', { from: new Date(params.from) });
    }
    if (params.to) {
      qb.andWhere('interview.scheduledEndTime <= :to', { to: new Date(params.to) });
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

  async findById(id: string): Promise<Interview> {
    const interview = await this.interviewRepo.findOne({
      where: { id },
      relations: [
        'application',
        'application.candidate',
        'panelists',
        'panelists.user',
        'evaluationForm',
        'evaluationForm.criteria',
        'rescheduleHistories',
      ],
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return interview;
  }

  async reschedule(id: string, dto: RescheduleInterviewDto, userId: string): Promise<Interview> {
    const interview = await this.findById(id);

    if (interview.status === InterviewStatus.COMPLETED || interview.status === InterviewStatus.CANCELLED) {
      throw new BadRequestException(`Cannot reschedule interview in ${interview.status} status`);
    }

    const prevStart = interview.scheduledStartTime;
    const prevEnd = interview.scheduledEndTime;
    const newStart = new Date(dto.newStartTime);
    const newEnd = new Date(dto.newEndTime);

    interview.scheduledStartTime = newStart;
    interview.scheduledEndTime = newEnd;
    interview.status = InterviewStatus.RESCHEDULED;

    await this.interviewRepo.save(interview);

    // Record reschedule history
    const history = this.rescheduleHistoryRepo.create({
      interviewId: interview.id,
      rescheduledById: userId,
      previousStartTime: prevStart,
      previousEndTime: prevEnd,
      newStartTime: newStart,
      newEndTime: newEnd,
      reason: dto.reason,
    });
    await this.rescheduleHistoryRepo.save(history);

    return this.findById(id);
  }

  async cancel(id: string, reason?: string): Promise<Interview> {
    const interview = await this.findById(id);
    interview.status = InterviewStatus.CANCELLED;
    if (reason) {
      interview.notes = interview.notes ? `${interview.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
    }
    return await this.interviewRepo.save(interview);
  }

  async complete(id: string): Promise<Interview> {
    const interview = await this.findById(id);
    interview.status = InterviewStatus.COMPLETED;
    return await this.interviewRepo.save(interview);
  }
}
