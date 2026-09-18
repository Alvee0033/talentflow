import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { Interview } from './interview.entity';
import { User } from '../../iam/entities/user.entity';

@Entity('interview_reschedule_histories')
export class InterviewRescheduleHistory extends BaseEntity {
  @Index()
  @Column({ name: 'interview_id', type: 'uuid' })
  interviewId: string;

  @ManyToOne(() => Interview, (interview) => interview.rescheduleHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @Index()
  @Column({ name: 'rescheduled_by_id', type: 'uuid' })
  rescheduledById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rescheduled_by_id' })
  rescheduledBy: User;

  @Column({ name: 'previous_start_time', type: 'timestamp' })
  previousStartTime: Date;

  @Column({ name: 'previous_end_time', type: 'timestamp' })
  previousEndTime: Date;

  @Column({ name: 'new_start_time', type: 'timestamp' })
  newStartTime: Date;

  @Column({ name: 'new_end_time', type: 'timestamp' })
  newEndTime: Date;

  @Column({ type: 'text' })
  reason: string;
}
