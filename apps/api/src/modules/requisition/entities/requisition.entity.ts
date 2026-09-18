import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { RequisitionStatus } from '@talentflow/shared';
import { BaseEntity } from '../../../database/base.entity';
import { BusinessUnit } from '../../organization/entities/business-unit.entity';
import { Department } from '../../organization/entities/department.entity';
import { Position } from '../../organization/entities/position.entity';
import { User } from '../../iam/entities/user.entity';
import { RequisitionApproval } from './requisition-approval.entity';

@Entity('requisitions')
export class Requisition extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'requisition_number', type: 'varchar', length: 50, unique: true })
  requisitionNumber: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Index()
  @Column({ name: 'business_unit_id', type: 'uuid' })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit, { eager: true })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit: BusinessUnit;

  @Index()
  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'position_id', type: 'uuid', nullable: true })
  positionId: string | null;

  @ManyToOne(() => Position, { nullable: true, eager: true })
  @JoinColumn({ name: 'position_id' })
  position: Position | null;

  @Column({ type: 'int', default: 1 })
  headcount: number;

  @Column({ name: 'employment_type', type: 'varchar', length: 50, default: 'FULL_TIME' })
  employmentType: string;

  @Column({ name: 'experience_level', type: 'varchar', length: 50, default: 'Mid' })
  experienceLevel: string;

  @Column({ name: 'min_salary', type: 'numeric', precision: 12, scale: 2, nullable: true })
  minSalary: number | null;

  @Column({ name: 'max_salary', type: 'numeric', precision: 12, scale: 2, nullable: true })
  maxSalary: number | null;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'varchar', length: 150, default: 'Dhaka, Bangladesh' })
  location: string;

  @Column({ name: 'is_remote', type: 'boolean', default: false })
  isRemote: boolean;

  @Column({ name: 'job_description', type: 'text' })
  jobDescription: string;

  @Column({ type: 'text', nullable: true })
  requirements: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: RequisitionStatus,
    default: RequisitionStatus.DRAFT,
  })
  status: RequisitionStatus;

  @Index()
  @Column({ name: 'hiring_manager_id', type: 'uuid' })
  hiringManagerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'hiring_manager_id' })
  hiringManager: User;

  @Index()
  @Column({ name: 'assigned_recruiter_id', type: 'uuid', nullable: true })
  assignedRecruiterId: string | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_recruiter_id' })
  assignedRecruiter: User | null;

  @Column({ name: 'target_hire_date', type: 'date', nullable: true })
  targetHireDate: Date | null;

  @Column({ name: 'opened_at', type: 'timestamp', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => RequisitionApproval, (approval) => approval.requisition, {
    cascade: true,
  })
  approvals: RequisitionApproval[];
}
