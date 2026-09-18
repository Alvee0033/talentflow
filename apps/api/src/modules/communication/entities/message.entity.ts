import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { MessageChannel, MessageStatus, MessageType } from '@talentflow/shared';
import { MessageApproval } from './message-approval.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @Index()
  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: MessageChannel.EMAIL,
  })
  channel: MessageChannel;

  @Column({
    type: 'varchar',
    length: 50,
    default: MessageType.INTERVIEW_INVITATION,
  })
  type: MessageType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'recipient_email', type: 'varchar', length: 255, nullable: true })
  recipientEmail: string | null;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 50, nullable: true })
  recipientPhone: string | null;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    default: MessageStatus.DRAFTED,
  })
  status: MessageStatus;

  @Index()
  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @OneToMany(() => MessageApproval, (approval) => approval.message, { cascade: true })
  approvals: MessageApproval[];
}
