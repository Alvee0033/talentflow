import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { JoiningItemStatus, JoiningItemType } from '@talentflow/shared';
import { JoiningChecklist } from './joining-checklist.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('joining_checklist_items')
export class JoiningChecklistItem extends BaseEntity {
  @Index()
  @Column({ name: 'checklist_id', type: 'uuid' })
  checklistId: string;

  @ManyToOne(() => JoiningChecklist, (cl) => cl.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklist_id' })
  checklist: JoiningChecklist;

  @Column({
    name: 'item_type',
    type: 'varchar',
    length: 50,
  })
  itemType: JoiningItemType;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: JoiningItemStatus.PENDING,
  })
  status: JoiningItemStatus;

  @Index()
  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User | null;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Index()
  @Column({ name: 'verified_by_id', type: 'uuid', nullable: true })
  verifiedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by_id' })
  verifiedBy: User | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;
}
