import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('templates')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Permissions('template:create')
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get()
  @Permissions('template:read')
  async findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @Permissions('template:read')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Patch(':id')
  @Permissions('template:update')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('template:delete')
  async remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/render')
  @Permissions('template:read')
  async render(@Param('id') id: string, @Body() context: Record<string, any>) {
    return this.templatesService.render(id, context);
  }
}
