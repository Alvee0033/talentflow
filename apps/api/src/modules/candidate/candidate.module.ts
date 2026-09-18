import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { Application } from './entities/application.entity';
import { ApplicationStageHistory } from './entities/application-stage-history.entity';
import { Screening } from './entities/screening.entity';
import { CandidatesService } from './candidates.service';
import { ApplicationsService } from './applications.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { ScreeningService } from './screening.service';
import { CandidateImportService } from './candidate-import.service';
import { CandidatesController } from './candidates.controller';
import { ApplicationsController } from './applications.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      Application,
      ApplicationStageHistory,
      Screening,
    ]),
    forwardRef(() => AuditModule),
  ],
  controllers: [CandidatesController, ApplicationsController],
  providers: [
    CandidatesService,
    ApplicationsService,
    DuplicateDetectionService,
    ScreeningService,
    CandidateImportService,
  ],
  exports: [
    CandidatesService,
    ApplicationsService,
    DuplicateDetectionService,
    ScreeningService,
    CandidateImportService,
    TypeOrmModule,
  ],
})
export class CandidateModule {}
