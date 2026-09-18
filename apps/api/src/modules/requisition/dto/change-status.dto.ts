import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequisitionStatus } from '@talentflow/shared';

export class ChangeStatusDto {
  @IsEnum(RequisitionStatus, {
    message: `Status must be one of: ${Object.values(RequisitionStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: RequisitionStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
