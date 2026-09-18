import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string; // e.g. 'requisition:create'

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
