import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { InterviewPanelist } from './entities/interview-panelist.entity';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationForm } from './entities/evaluation-form.entity';
import { EvaluationCriteria } from './entities/evaluation-criteria.entity';
import { InterviewRescheduleHistory } from './entities/interview-reschedule-history.entity';
import { InterviewsService } from './interviews.service';
import { EvaluationsService } from './evaluations.service';
import { EvaluationFormsService } from './evaluation-forms.service';
import { InterviewsController } from './interviews.controller';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationFormsController } from './evaluation-forms.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Interview,
      InterviewPanelist,
      Evaluation,
      EvaluationForm,
      EvaluationCriteria,
      InterviewRescheduleHistory,
    ]),
  ],
  controllers: [
    InterviewsController,
    EvaluationsController,
    EvaluationFormsController,
  ],
  providers: [
    InterviewsService,
    EvaluationsService,
    EvaluationFormsService,
  ],
  exports: [
    InterviewsService,
    EvaluationsService,
    EvaluationFormsService,
    TypeOrmModule,
  ],
})
export class InterviewModule {}
