import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';

@Entity('documents')
export class Document extends BaseEntity {
  @Index()
  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: string; // 'candidate', 'application', 'requisition', 'joining', 'user'

  @Index()
  @Column({ name: 'entity_id', type: 'varchar', length: 255 })
  entityId: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_type', type: 'varchar', length: 100 })
  fileType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'file_url', type: 'varchar', length: 1000 })
  fileUrl: string;

  @Column({ type: 'varchar', length: 50, default: 'OTHER' })
  category: string; // 'RESUME', 'NID', 'ACADEMIC_CERTIFICATE', 'OFFER_LETTER', 'OTHER'

  @Index()
  @Column({ name: 'uploaded_by_id', type: 'uuid', nullable: true })
  uploadedById: string | null;
}
