import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { TaskStatus, TaskType, TaskPriority } from '@talentflow/shared';
import { User } from '../../iam/entities/user.entity';
import { Reminder } from './reminder.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: TaskType.CUSTOM,
  })
  type: TaskType;

  @Column({
    type: 'varchar',
    length: 50,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    default: TaskStatus.OPEN,
  })
  status: TaskStatus;

  @Index()
  @Column({ name: 'assignee_id', type: 'uuid' })
  assigneeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Index()
  @Column({ name: 'creator_id', type: 'uuid', nullable: true })
  creatorId: string | null;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'varchar', length: 255, nullable: true })
  entityId: string | null;

  @OneToMany(() => Reminder, (reminder) => reminder.task, { cascade: true })
  reminders: Reminder[];
}
