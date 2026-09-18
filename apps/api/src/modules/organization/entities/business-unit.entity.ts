import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { Department } from './department.entity';

@Entity('business_units')
export class BusinessUnit extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Department, (dept) => dept.businessUnit)
  departments: Department[];
}
