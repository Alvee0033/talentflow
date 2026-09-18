import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { CandidateSourceType } from '@talentflow/shared';
import { Application } from './application.entity';

@Entity('candidates')
export class Candidate extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ name: 'current_company', type: 'varchar', length: 150, nullable: true })
  currentCompany: string | null;

  @Column({ name: 'current_title', type: 'varchar', length: 150, nullable: true })
  currentTitle: string | null;

  @Column({ name: 'total_experience_years', type: 'decimal', precision: 4, scale: 1, nullable: true })
  totalExperienceYears: number | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: CandidateSourceType.MANUAL,
  })
  source: CandidateSourceType;

  @Column({ name: 'source_details', type: 'varchar', length: 255, nullable: true })
  sourceDetails: string | null;

  @Column({ name: 'resume_url', type: 'varchar', length: 1000, nullable: true })
  resumeUrl: string | null;

  @Column({ type: 'simple-array', nullable: true })
  skills: string[] | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[] | null;

  @Column({ name: 'is_anonymized', type: 'boolean', default: false })
  isAnonymized: boolean;

  @OneToMany(() => Application, (app) => app.candidate)
  applications: Application[];
}
