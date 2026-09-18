import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JoiningService } from './joining.service';
import { CreateChecklistDto, UpdateChecklistItemDto } from './dto/create-checklist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JoiningChecklistStatus } from '@talentflow/shared';

@Controller('joining')
@UseGuards(JwtAuthGuard, RbacGuard)
export class JoiningController {
  constructor(private readonly joiningService: JoiningService) {}

  @Post()
  @Permissions('joining:create')
  async create(@Body() dto: CreateChecklistDto) {
    return this.joiningService.create(dto);
  }

  @Get()
  @Permissions('joining:read')
  async findAll(
    @Query('status') status?: JoiningChecklistStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.joiningService.findAll({ status, page, limit });
  }

  @Get('application/:applicationId')
  @Permissions('joining:read')
  async findByApplication(@Param('applicationId') applicationId: string) {
    return this.joiningService.findByApplication(applicationId);
  }

  @Get(':id')
  @Permissions('joining:read')
  async findOne(@Param('id') id: string) {
    return this.joiningService.findById(id);
  }

  @Patch(':id/items/:itemId')
  @Permissions('joining:update')
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: any,
  ) {
    return this.joiningService.updateItem(id, itemId, dto, user?.id);
  }

  @Post(':id/complete')
  @Permissions('joining:update')
  async complete(@Param('id') id: string) {
    return this.joiningService.completeChecklist(id);
  }
}
