import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Requisition } from '../requisition/entities/requisition.entity';
import { Application } from '../candidate/entities/application.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Interview } from '../interview/entities/interview.entity';
import { Evaluation } from '../interview/entities/evaluation.entity';
import { Task } from '../task/entities/task.entity';
import { JoiningChecklist } from '../joining/entities/joining-checklist.entity';
import { Department } from '../organization/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requisition,
      Application,
      Candidate,
      Interview,
      Evaluation,
      Task,
      JoiningChecklist,
      Department,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
