import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CandidateSourceType } from '@talentflow/shared';

export class CreateCandidateDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  currentCompany?: string | null;

  @IsOptional()
  @IsString()
  currentTitle?: string | null;

  @IsOptional()
  @IsNumber()
  totalExperienceYears?: number | null;

  @IsOptional()
  @IsEnum(CandidateSourceType)
  source?: CandidateSourceType;

  @IsOptional()
  @IsString()
  sourceDetails?: string | null;

  @IsOptional()
  @IsString()
  resumeUrl?: string | null;

  @IsOptional()
  skills?: string[] | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  tags?: string[] | null;
}
