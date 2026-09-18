import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterviewPanelistDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  isLead?: boolean;
}

export class CreateInterviewDto {
  @IsNotEmpty()
  @IsUUID()
  applicationId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  roundNumber?: number;

  @IsNotEmpty()
  @IsDateString()
  scheduledStartTime: string;

  @IsNotEmpty()
  @IsDateString()
  scheduledEndTime: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  evaluationFormId?: string;

  @IsOptional()
  @IsArray()
  panelists?: CreateInterviewPanelistDto[];
}
