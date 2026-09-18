import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requisition } from './entities/requisition.entity';
import { RequisitionApproval } from './entities/requisition-approval.entity';
import { RequisitionsService } from './services/requisitions.service';
import { RequisitionApprovalService } from './services/requisition-approval.service';
import { RequisitionsController } from './controllers/requisitions.controller';
import { User } from '../iam/entities/user.entity';
import { BusinessUnit } from '../organization/entities/business-unit.entity';
import { Department } from '../organization/entities/department.entity';
import { Position } from '../organization/entities/position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requisition,
      RequisitionApproval,
      User,
      BusinessUnit,
      Department,
      Position,
    ]),
  ],
  controllers: [RequisitionsController],
  providers: [RequisitionsService, RequisitionApprovalService],
  exports: [RequisitionsService, RequisitionApprovalService, TypeOrmModule],
})
export class RequisitionModule {}
