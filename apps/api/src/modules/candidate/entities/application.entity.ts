import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { ApplicationStage, ApplicationOutcome } from '@talentflow/shared';
import { Candidate } from './candidate.entity';
import { ApplicationStageHistory } from './application-stage-history.entity';
import { Screening } from './screening.entity';
import { Requisition } from '../../requisition/entities/requisition.entity';

@Entity('applications')
export class Application extends BaseEntity {
  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => Candidate, (c) => c.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Index()
  @Column({ name: 'requisition_id', type: 'uuid' })
  requisitionId: string;

  @ManyToOne(() => Requisition, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'requisition_id' })
  requisition: Requisition;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    default: ApplicationStage.NEW,
  })
  stage: ApplicationStage;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  outcome: ApplicationOutcome | null;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 255, nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'rejection_notes', type: 'text', nullable: true })
  rejectionNotes: string | null;

  @Column({ name: 'next_action', type: 'varchar', length: 255, nullable: true })
  nextAction: string | null;

  @Index()
  @Column({ name: 'next_action_owner_id', type: 'uuid', nullable: true })
  nextActionOwnerId: string | null;

  @Column({ name: 'next_action_due_date', type: 'timestamp', nullable: true })
  nextActionDueDate: Date | null;

  @Column({ name: 'applied_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  appliedDate: Date;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => ApplicationStageHistory, (history) => history.application)
  stageHistories: ApplicationStageHistory[];

  @OneToMany(() => Screening, (screening) => screening.application)
  screenings: Screening[];
}
