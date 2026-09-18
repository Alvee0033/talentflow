import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationForm } from './entities/evaluation-form.entity';
import { EvaluationCriteria } from './entities/evaluation-criteria.entity';
import { CreateEvaluationFormDto } from './dto/create-evaluation-form.dto';

@Injectable()
export class EvaluationFormsService {
  constructor(
    @InjectRepository(EvaluationForm)
    private readonly formRepo: Repository<EvaluationForm>,
    @InjectRepository(EvaluationCriteria)
    private readonly criteriaRepo: Repository<EvaluationCriteria>,
  ) {}

  async create(dto: CreateEvaluationFormDto): Promise<EvaluationForm> {
    const form = this.formRepo.create({
      title: dto.title,
      description: dto.description || null,
      departmentId: dto.departmentId || null,
      isActive: true,
    });

    const saved = await this.formRepo.save(form);

    if (dto.criteria && dto.criteria.length > 0) {
      const criteriaEntities = dto.criteria.map((c, index) =>
        this.criteriaRepo.create({
          formId: saved.id,
          name: c.name,
          description: c.description || null,
          weight: c.weight !== undefined ? c.weight : 1.0,
          maxScore: c.maxScore || 5,
          orderIndex: c.orderIndex !== undefined ? c.orderIndex : index,
        }),
      );
      await this.criteriaRepo.save(criteriaEntities);
    }

    return this.findById(saved.id);
  }

  async findAll(departmentId?: string): Promise<EvaluationForm[]> {
    const qb = this.formRepo.createQueryBuilder('form')
      .leftJoinAndSelect('form.criteria', 'criteria')
      .where('form.isActive = true')
      .orderBy('criteria.orderIndex', 'ASC');

    if (departmentId) {
      qb.andWhere('(form.departmentId = :departmentId OR form.departmentId IS NULL)', { departmentId });
    }

    return await qb.getMany();
  }

  async findById(id: string): Promise<EvaluationForm> {
    const form = await this.formRepo.findOne({
      where: { id },
      relations: ['criteria'],
      order: {
        criteria: {
          orderIndex: 'ASC',
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Evaluation form with ID ${id} not found`);
    }
    return form;
  }

  async update(id: string, dto: Partial<CreateEvaluationFormDto>): Promise<EvaluationForm> {
    const form = await this.findById(id);

    if (dto.title) form.title = dto.title;
    if (dto.description !== undefined) form.description = dto.description;
    if (dto.departmentId !== undefined) form.departmentId = dto.departmentId;

    await this.formRepo.save(form);

    if (dto.criteria) {
      // Replace criteria
      await this.criteriaRepo.delete({ formId: id });
      const criteriaEntities = dto.criteria.map((c, index) =>
        this.criteriaRepo.create({
          formId: id,
          name: c.name,
          description: c.description || null,
          weight: c.weight !== undefined ? c.weight : 1.0,
          maxScore: c.maxScore || 5,
          orderIndex: c.orderIndex !== undefined ? c.orderIndex : index,
        }),
      );
      await this.criteriaRepo.save(criteriaEntities);
    }

    return this.findById(id);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const form = await this.findById(id);
    form.isActive = false;
    await this.formRepo.save(form);
    return { success: true, message: 'Evaluation form deactivated successfully' };
  }
}
