import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApplicationStage } from '@talentflow/shared';

export class UpdateStageDto {
  @IsNotEmpty()
  @IsEnum(ApplicationStage)
  stage: ApplicationStage;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;

  @IsOptional()
  @IsUUID()
  nextActionOwnerId?: string;

  @IsOptional()
  @IsDateString()
  nextActionDueDate?: string;
}
