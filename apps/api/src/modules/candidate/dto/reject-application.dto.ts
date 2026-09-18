import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectApplicationDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
