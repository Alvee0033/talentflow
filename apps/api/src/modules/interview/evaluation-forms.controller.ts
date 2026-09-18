import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EvaluationFormsService } from './evaluation-forms.service';
import { CreateEvaluationFormDto } from './dto/create-evaluation-form.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('evaluation-forms')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EvaluationFormsController {
  constructor(private readonly formsService: EvaluationFormsService) {}

  @Post()
  @Permissions('evaluation-form:create')
  async create(@Body() dto: CreateEvaluationFormDto) {
    return this.formsService.create(dto);
  }

  @Get()
  @Permissions('evaluation-form:read')
  async findAll(@Query('departmentId') departmentId?: string) {
    return this.formsService.findAll(departmentId);
  }

  @Get(':id')
  @Permissions('evaluation-form:read')
  async findOne(@Param('id') id: string) {
    return this.formsService.findById(id);
  }

  @Patch(':id')
  @Permissions('evaluation-form:update')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateEvaluationFormDto>) {
    return this.formsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('evaluation-form:delete')
  async remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }
}
