import { Controller, Get, Post, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Permissions('document:create')
  async create(@Body() dto: CreateDocumentDto, @CurrentUser() user: any) {
    if (!dto.uploadedById && user?.id) {
      dto.uploadedById = user.id;
    }
    return this.documentsService.create(dto);
  }

  @Get()
  @Permissions('document:read')
  async findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.documentsService.findAll({ entityType, entityId, page: +page, limit: +limit });
  }

  @Get('entity/:entityType/:entityId')
  @Permissions('document:read')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.documentsService.findByEntity(entityType, entityId);
  }

  @Get(':id')
  @Permissions('document:read')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Delete(':id')
  @Permissions('document:delete')
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
