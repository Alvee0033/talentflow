import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApprovalActionDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessageStatus, MessageChannel } from '@talentflow/shared';

@Controller('messages')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Permissions('message:create')
  async create(@Body() dto: CreateMessageDto, @CurrentUser() user: any) {
    return this.messagesService.create(dto, user?.id);
  }

  @Get()
  @Permissions('message:read')
  async findAll(
    @Query('candidateId') candidateId?: string,
    @Query('applicationId') applicationId?: string,
    @Query('status') status?: MessageStatus,
    @Query('channel') channel?: MessageChannel,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.findAll({
      candidateId,
      applicationId,
      status,
      channel,
      page,
      limit,
    });
  }

  @Get(':id')
  @Permissions('message:read')
  async findOne(@Param('id') id: string) {
    return this.messagesService.findById(id);
  }

  @Post(':id/request-approval')
  @Permissions('message:update')
  async requestApproval(@Param('id') id: string) {
    return this.messagesService.requestApproval(id);
  }

  @Post(':id/approve')
  @Permissions('message:approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.messagesService.approve(id, user.id, dto);
  }

  @Post(':id/reject')
  @Permissions('message:approve')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.messagesService.reject(id, user.id, dto);
  }

  @Post(':id/send')
  @Permissions('message:update')
  async send(@Param('id') id: string) {
    return this.messagesService.send(id);
  }
}
