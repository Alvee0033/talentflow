import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { EvaluationCriteria } from './evaluation-criteria.entity';

@Entity('evaluation_forms')
export class EvaluationForm extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => EvaluationCriteria, (criteria) => criteria.form, { cascade: true })
  criteria: EvaluationCriteria[];
}
