import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { MessageChannel } from '@talentflow/shared';
import { Task } from './task.entity';

@Entity('reminders')
export class Reminder extends BaseEntity {
  @Index()
  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.reminders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'remind_at', type: 'timestamp' })
  remindAt: Date;

  @Column({ type: 'boolean', default: false })
  sent: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    default: MessageChannel.EMAIL,
  })
  channel: MessageChannel;
}
