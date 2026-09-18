import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { ApprovalStatus } from '@talentflow/shared';
import { Message } from './message.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('message_approvals')
export class MessageApproval extends BaseEntity {
  @Index()
  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => Message, (msg) => msg.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Index()
  @Column({ name: 'approver_id', type: 'uuid', nullable: true })
  approverId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approver_id' })
  approver: User | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
  decidedAt: Date | null;
}
