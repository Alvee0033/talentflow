import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChecklistDto {
  @IsNotEmpty()
  @IsUUID()
  applicationId: string;

  @IsNotEmpty()
  @IsUUID()
  candidateId: string;

  @IsNotEmpty()
  @IsDateString()
  joiningDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
