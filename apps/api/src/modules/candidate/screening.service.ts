import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Screening } from './entities/screening.entity';
import { Application } from './entities/application.entity';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { ApplicationStage } from '@talentflow/shared';

@Injectable()
export class ScreeningService {
  constructor(
    @InjectRepository(Screening)
    private readonly screeningRepo: Repository<Screening>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async create(applicationId: string, dto: CreateScreeningDto, screenedById?: string): Promise<Screening> {
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    const screening = this.screeningRepo.create({
      applicationId,
      screenedById: screenedById || null,
      passed: dto.passed,
      feedback: dto.feedback || null,
      score: dto.score !== undefined ? dto.score : null,
      answers: dto.answers || null,
    });

    const saved = await this.screeningRepo.save(screening);

    // If application is in NEW or SCREENING stage, update rating/notes
    if (dto.score !== undefined) {
      application.rating = dto.score;
    }
    if (application.stage === ApplicationStage.NEW) {
      application.stage = ApplicationStage.SCREENING;
      application.nextAction = dto.passed ? 'Proceed to Assessment / Interview' : 'Screening Unsuccessful';
      await this.applicationRepo.save(application);
    }

    return saved;
  }

  async findByApplication(applicationId: string): Promise<Screening[]> {
    return await this.screeningRepo.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });
  }
}
