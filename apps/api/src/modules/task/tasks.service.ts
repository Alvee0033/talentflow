import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Task } from './entities/task.entity';
import { Reminder } from './entities/reminder.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/create-task.dto';
import { TaskStatus, TaskPriority, TaskType } from '@talentflow/shared';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectQueue('tasks')
    private readonly tasksQueue: Queue,
  ) {}

  async create(dto: CreateTaskDto, creatorId?: string): Promise<Task> {
    const targetAssignee = dto.assigneeId || creatorId;
    if (!targetAssignee) {
      throw new NotFoundException('Assignee is required to create a task');
    }

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description || undefined,
      type: dto.type || TaskType.CUSTOM,
      priority: dto.priority || TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
      assigneeId: targetAssignee,
      creatorId: creatorId || undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      entityType: dto.entityType || undefined,
      entityId: dto.entityId || undefined,
    });

    const saved = await this.taskRepo.save(task);

    // If due date is set, schedule Bull reminder job 1 hour before due date
    if (saved.dueDate) {
      const delay = saved.dueDate.getTime() - Date.now() - 3600000;
      if (delay > 0) {
        await this.tasksQueue.add(
          'task-reminder',
          { taskId: saved.id, title: saved.title, assigneeId: saved.assigneeId },
          { delay },
        );
      }
    }

    return this.findById(saved.id);
  }

  async findAll(params: {
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    overdue?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .orderBy('task.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params.assigneeId) {
      qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: params.assigneeId });
    }
    if (params.status) {
      qb.andWhere('task.status = :status', { status: params.status });
    }
    if (params.priority) {
      qb.andWhere('task.priority = :priority', { priority: params.priority });
    }
    if (params.type) {
      qb.andWhere('task.type = :type', { type: params.type });
    }
    if (params.overdue) {
      qb.andWhere('task.dueDate < :now AND task.status != :completed', {
        now: new Date(),
        completed: TaskStatus.COMPLETED,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    // Mark any overdue tasks
    const now = new Date();
    for (const item of items) {
      if (item.dueDate && item.dueDate < now && item.status !== TaskStatus.COMPLETED && item.status !== TaskStatus.OVERDUE) {
        item.status = TaskStatus.OVERDUE;
        await this.taskRepo.save(item);
      }
    }

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignee', 'reminders'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);

    if (dto.title) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority) task.priority = dto.priority;
    if (dto.assigneeId) task.assigneeId = dto.assigneeId;
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    return await this.taskRepo.save(task);
  }

  async complete(id: string): Promise<Task> {
    const task = await this.findById(id);
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    return await this.taskRepo.save(task);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const task = await this.findById(id);
    await this.taskRepo.softDelete(task.id);
    return { success: true, message: 'Task deleted successfully' };
  }
}
