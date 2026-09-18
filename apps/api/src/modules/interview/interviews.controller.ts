import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { RescheduleInterviewDto } from './dto/reschedule-interview.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InterviewStatus } from '@talentflow/shared';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RbacGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @Permissions('interview:create')
  async schedule(@Body() dto: CreateInterviewDto) {
    return this.interviewsService.schedule(dto);
  }

  @Get()
  @Permissions('interview:read')
  async findAll(
    @Query('applicationId') applicationId?: string,
    @Query('panelistId') panelistId?: string,
    @Query('status') status?: InterviewStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.interviewsService.findAll({
      applicationId,
      panelistId,
      status,
      from,
      to,
      page,
      limit,
    });
  }

  @Get(':id')
  @Permissions('interview:read')
  async findOne(@Param('id') id: string) {
    return this.interviewsService.findById(id);
  }

  @Post(':id/reschedule')
  @Permissions('interview:update')
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleInterviewDto,
    @CurrentUser() user: any,
  ) {
    return this.interviewsService.reschedule(id, dto, user?.id);
  }

  @Post(':id/cancel')
  @Permissions('interview:update')
  async cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.interviewsService.cancel(id, reason);
  }

  @Post(':id/complete')
  @Permissions('interview:update')
  async complete(@Param('id') id: string) {
    return this.interviewsService.complete(id);
  }
}
