import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { ApplicationStage } from '@talentflow/shared';
import { Application } from './application.entity';

@Entity('application_stage_histories')
export class ApplicationStageHistory extends BaseEntity {
  @Index()
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, (app) => app.stageHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({
    name: 'from_stage',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  fromStage: ApplicationStage | null;

  @Column({
    name: 'to_stage',
    type: 'varchar',
    length: 50,
  })
  toStage: ApplicationStage;

  @Index()
  @Column({ name: 'changed_by_id', type: 'uuid', nullable: true })
  changedById: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
