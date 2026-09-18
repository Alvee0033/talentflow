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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskStatus, TaskPriority, TaskType } from '@talentflow/shared';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Permissions('task:create')
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(dto, user?.id);
  }

  @Get()
  @Permissions('task:read')
  async findAll(
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('type') type?: TaskType,
    @Query('overdue') overdue?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tasksService.findAll({
      assigneeId,
      status,
      priority,
      type,
      overdue: overdue === 'true',
      page,
      limit,
    });
  }

  @Get(':id')
  @Permissions('task:read')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch(':id')
  @Permissions('task:update')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Post(':id/complete')
  @Permissions('task:update')
  async complete(@Param('id') id: string) {
    return this.tasksService.complete(id);
  }

  @Delete(':id')
  @Permissions('task:delete')
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
