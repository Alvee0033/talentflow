import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { Application } from './application.entity';

@Entity('screenings')
export class Screening extends BaseEntity {
  @Index()
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, (app) => app.screenings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Index()
  @Column({ name: 'screened_by_id', type: 'uuid', nullable: true })
  screenedById: string | null;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  score: number | null;

  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, any> | null;
}
