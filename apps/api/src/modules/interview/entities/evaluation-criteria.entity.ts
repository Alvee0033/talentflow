import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { EvaluationForm } from './evaluation-form.entity';

@Entity('evaluation_criteria')
export class EvaluationCriteria extends BaseEntity {
  @Index()
  @Column({ name: 'form_id', type: 'uuid' })
  formId: string;

  @ManyToOne(() => EvaluationForm, (form) => form.criteria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'form_id' })
  form: EvaluationForm;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.0 })
  weight: number;

  @Column({ name: 'max_score', type: 'int', default: 5 })
  maxScore: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;
}
