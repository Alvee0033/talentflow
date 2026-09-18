import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { RequisitionStatus } from '@talentflow/shared';

export class CreateRequisitionDto {
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  title: string;

  @IsUUID('4', { message: 'Business Unit ID must be a valid UUID' })
  businessUnitId: string;

  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  departmentId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Position ID must be a valid UUID' })
  positionId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @IsOptional()
  @IsString()
  employmentType?: string; // FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP

  @IsOptional()
  @IsString()
  experienceLevel?: string; // Entry, Mid, Senior, Lead

  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsString()
  @IsNotEmpty({ message: 'Job description is required' })
  jobDescription: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Hiring Manager ID must be a valid UUID' })
  hiringManagerId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Assigned Recruiter ID must be a valid UUID' })
  assignedRecruiterId?: string;

  @IsOptional()
  @IsDateString()
  targetHireDate?: string;

  @IsOptional()
  @IsEnum(RequisitionStatus)
  status?: RequisitionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
