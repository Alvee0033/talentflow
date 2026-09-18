import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { InterviewStatus } from '@talentflow/shared';
import { Application } from '../../candidate/entities/application.entity';
import { InterviewPanelist } from './interview-panelist.entity';
import { Evaluation } from './evaluation.entity';
import { InterviewRescheduleHistory } from './interview-reschedule-history.entity';
import { EvaluationForm } from './evaluation-form.entity';

@Entity('interviews')
export class Interview extends BaseEntity {
  @Index()
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ name: 'round_number', type: 'int', default: 1 })
  roundNumber: number;

  @Column({ name: 'scheduled_start_time', type: 'timestamp' })
  scheduledStartTime: Date;

  @Column({ name: 'scheduled_end_time', type: 'timestamp' })
  scheduledEndTime: Date;

  @Index()
  @Column({
    type: 'varchar',
    length: 50,
    default: InterviewStatus.SCHEDULED,
  })
  status: InterviewStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ name: 'meeting_link', type: 'varchar', length: 500, nullable: true })
  meetingLink: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index()
  @Column({ name: 'evaluation_form_id', type: 'uuid', nullable: true })
  evaluationFormId: string | null;

  @ManyToOne(() => EvaluationForm, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'evaluation_form_id' })
  evaluationForm: EvaluationForm | null;

  @OneToMany(() => InterviewPanelist, (panelist) => panelist.interview, { cascade: true })
  panelists: InterviewPanelist[];

  @OneToMany(() => Evaluation, (evaln) => evaln.interview)
  evaluations: Evaluation[];

  @OneToMany(() => InterviewRescheduleHistory, (history) => history.interview)
  rescheduleHistories: InterviewRescheduleHistory[];
}
