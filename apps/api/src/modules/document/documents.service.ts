import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  async create(dto: CreateDocumentDto): Promise<Document> {
    const doc = this.documentRepo.create({
      ...dto,
      category: dto.category || 'OTHER',
    });
    return await this.documentRepo.save(doc);
  }

  async findById(id: string): Promise<Document> {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return doc;
  }

  async findAll(params: { entityType?: string; entityId?: string; page: number; limit: number }) {
    const { entityType, entityId, page, limit } = params;
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    const [items, total] = await this.documentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByEntity(entityType: string, entityId: string): Promise<Document[]> {
    return await this.documentRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const doc = await this.findById(id);
    await this.documentRepo.softDelete(doc.id);
    return { success: true, message: 'Document deleted successfully' };
  }
}
