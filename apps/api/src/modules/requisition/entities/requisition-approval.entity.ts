import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApprovalStatus } from '@talentflow/shared';
import { BaseEntity } from '../../../database/base.entity';
import { User } from '../../iam/entities/user.entity';
import { Requisition } from './requisition.entity';

@Entity('requisition_approvals')
export class RequisitionApproval extends BaseEntity {
  @Index()
  @Column({ name: 'requisition_id', type: 'uuid' })
  requisitionId: string;

  @ManyToOne(() => Requisition, (req) => req.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requisition_id' })
  requisition: Requisition;

  @Index()
  @Column({ name: 'approver_id', type: 'uuid' })
  approverId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ type: 'int', default: 1 })
  step: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'action_date', type: 'timestamp', nullable: true })
  actionDate: Date | null;
}
