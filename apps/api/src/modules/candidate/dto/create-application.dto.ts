import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsDateString } from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty()
  @IsUUID()
  candidateId: string;

  @IsNotEmpty()
  @IsUUID()
  requisitionId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

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
