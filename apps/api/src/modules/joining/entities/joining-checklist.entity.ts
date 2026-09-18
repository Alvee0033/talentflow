import { Entity, Column, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { JoiningChecklistStatus } from '@talentflow/shared';
import { JoiningChecklistItem } from './joining-checklist-item.entity';
import { Application } from '../../candidate/entities/application.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';

@Entity('joining_checklists')
export class JoiningChecklist extends BaseEntity {
  @Index()
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column({ name: 'joining_date', type: 'timestamp' })
  joiningDate: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: JoiningChecklistStatus.IN_PROGRESS,
  })
  status: JoiningChecklistStatus;

  @Column({ name: 'readiness_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  readinessPercentage: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => JoiningChecklistItem, (item) => item.checklist, { cascade: true })
  items: JoiningChecklistItem[];
}
