import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageChannel, MessageType } from '@talentflow/shared';

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @IsNotEmpty()
  @IsEnum(MessageType)
  type: MessageType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsNotEmpty()
  @IsString()
  bodyTemplate: string;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  @IsOptional()
  isActive?: boolean;
}

export class ApprovalActionDto {
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
