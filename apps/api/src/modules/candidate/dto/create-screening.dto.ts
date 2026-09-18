import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateScreeningDto {
  @IsNotEmpty()
  @IsBoolean()
  passed: boolean;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  answers?: Record<string, any>;
}
