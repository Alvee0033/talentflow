import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { BusinessUnit } from './business-unit.entity';
import { Position } from './position.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Index()
  @Column({ name: 'business_unit_id', type: 'uuid' })
  businessUnitId: string;

  @ManyToOne(() => BusinessUnit, (bu) => bu.departments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_unit_id' })
  businessUnit: BusinessUnit;

  @Column({ name: 'head_user_id', type: 'uuid', nullable: true })
  headUserId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Position, (pos) => pos.department)
  positions: Position[];
}
