import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RescheduleInterviewDto {
  @IsNotEmpty()
  @IsDateString()
  newStartTime: string;

  @IsNotEmpty()
  @IsDateString()
  newEndTime: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
