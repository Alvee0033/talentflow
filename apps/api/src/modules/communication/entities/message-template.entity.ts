import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { MessageChannel, MessageType } from '@talentflow/shared';

@Entity('message_templates')
export class MessageTemplate extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

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

  @Column({ name: 'body_template', type: 'text' })
  bodyTemplate: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
