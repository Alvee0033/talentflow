import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitApprovalDto {
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each approver ID must be a valid UUID' })
  approverIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ActionApprovalDto {
  @IsOptional()
  @IsString()
  comments?: string;
}
