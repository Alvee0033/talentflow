import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Handlebars from 'handlebars';
import { MessageTemplate } from './entities/message-template.entity';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
  ) {}

  async create(dto: CreateTemplateDto): Promise<MessageTemplate> {
    const template = this.templateRepo.create({
      name: dto.name,
      code: dto.code,
      channel: dto.channel,
      type: dto.type,
      subject: dto.subject || null,
      bodyTemplate: dto.bodyTemplate,
      isActive: true,
    });
    return await this.templateRepo.save(template);
  }

  async findAll(): Promise<MessageTemplate[]> {
    return await this.templateRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<MessageTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  async findByCode(code: string): Promise<MessageTemplate> {
    const template = await this.templateRepo.findOne({ where: { code, isActive: true } });
    if (!template) {
      throw new NotFoundException(`Template with code ${code} not found`);
    }
    return template;
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<MessageTemplate> {
    const template = await this.findById(id);
    Object.assign(template, dto);
    return await this.templateRepo.save(template);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const template = await this.findById(id);
    template.isActive = false;
    await this.templateRepo.save(template);
    return { success: true, message: 'Template deactivated successfully' };
  }

  renderString(templateString: string, context: Record<string, any>): string {
    try {
      const compiled = Handlebars.compile(templateString);
      return compiled(context);
    } catch {
      // Fallback to simple replace
      return templateString.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => context[key] || '');
    }
  }

  async render(templateId: string, context: Record<string, any>): Promise<{ subject: string | null; body: string }> {
    const template = await this.findById(templateId);
    const body = this.renderString(template.bodyTemplate, context);
    const subject = template.subject ? this.renderString(template.subject, context) : null;
    return { subject, body };
  }
}
