import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('tasks')
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  @Process('task-reminder')
  async handleTaskReminder(job: Job<{ taskId: string; title: string; assigneeId: string }>) {
    this.logger.log(`Processing task reminder job for task ID ${job.data.taskId}: "${job.data.title}"`);
    // Stub: here we would send push/email notifications for the reminder
    return { processed: true, taskId: job.data.taskId };
  }

  @Process('overdue-checker')
  async handleOverdueChecker(job: Job) {
    this.logger.log('Processing overdue tasks check');
    return { checked: true };
  }
}
