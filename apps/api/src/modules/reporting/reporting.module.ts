import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Application } from '../candidate/entities/application.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Requisition } from '../requisition/entities/requisition.entity';
import { Department } from '../organization/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Candidate,
      Requisition,
      Department,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportingModule {}
