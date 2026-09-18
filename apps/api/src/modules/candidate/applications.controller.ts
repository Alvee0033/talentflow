import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ScreeningService } from './screening.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApplicationStage, ApplicationOutcome } from '@talentflow/shared';

@Controller('applications')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly screeningService: ScreeningService,
  ) {}

  @Post()
  @Permissions('application:create')
  async create(@Body() dto: CreateApplicationDto, @CurrentUser() user: any) {
    return this.applicationsService.create(dto, user?.id);
  }

  @Get()
  @Permissions('application:read')
  async findAll(
    @Query('requisitionId') requisitionId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('stage') stage?: ApplicationStage,
    @Query('outcome') outcome?: ApplicationOutcome,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.applicationsService.findAll({
      requisitionId,
      candidateId,
      stage,
      outcome,
      page,
      limit,
    });
  }

  @Get(':id')
  @Permissions('application:read')
  async findOne(@Param('id') id: string) {
    return this.applicationsService.findById(id);
  }

  @Post(':id/stage')
  @Permissions('application:update')
  async updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.updateStage(id, dto, user?.id);
  }

  @Post(':id/reject')
  @Permissions('application:update')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.rejectApplication(id, dto, user?.id);
  }

  @Get(':id/history')
  @Permissions('application:read')
  async getStageHistory(@Param('id') id: string) {
    return this.applicationsService.getStageHistory(id);
  }

  @Post(':id/screening')
  @Permissions('candidate:update')
  async createScreening(
    @Param('id') id: string,
    @Body() dto: CreateScreeningDto,
    @CurrentUser() user: any,
  ) {
    return this.screeningService.create(id, dto, user?.id);
  }

  @Get(':id/screening')
  @Permissions('candidate:read')
  async getScreenings(@Param('id') id: string) {
    return this.screeningService.findByApplication(id);
  }
}
