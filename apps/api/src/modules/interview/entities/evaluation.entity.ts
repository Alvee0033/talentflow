import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { EvaluationRecommendation } from '@talentflow/shared';
import { Interview } from './interview.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('evaluations')
export class Evaluation extends BaseEntity {
  @Index()
  @Column({ name: 'interview_id', type: 'uuid' })
  interviewId: string;

  @ManyToOne(() => Interview, (interview) => interview.evaluations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @Index()
  @Column({ name: 'panelist_id', type: 'uuid' })
  panelistId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'panelist_id' })
  panelist: User;

  @Column({
    type: 'varchar',
    length: 50,
    default: EvaluationRecommendation.NEUTRAL,
  })
  recommendation: EvaluationRecommendation;

  @Column({ name: 'overall_score', type: 'decimal', precision: 4, scale: 2, default: 0 })
  overallScore: number;

  @Column({ name: 'criteria_ratings', type: 'jsonb', nullable: true })
  criteriaRatings: Record<string, { score: number; comment?: string }> | null;

  @Column({ type: 'text', nullable: true })
  strengths: string | null;

  @Column({ name: 'areas_of_improvement', type: 'text', nullable: true })
  areasOfImprovement: string | null;

  @Column({ name: 'general_notes', type: 'text', nullable: true })
  generalNotes: string | null;

  @Column({ name: 'is_submitted', type: 'boolean', default: false })
  isSubmitted: boolean;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;
}
