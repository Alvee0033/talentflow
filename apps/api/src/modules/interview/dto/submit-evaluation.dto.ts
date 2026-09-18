import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { EvaluationRecommendation } from '@talentflow/shared';

export class SubmitEvaluationDto {
  @IsNotEmpty()
  @IsUUID()
  interviewId: string;

  @IsNotEmpty()
  @IsEnum(EvaluationRecommendation)
  recommendation: EvaluationRecommendation;

  @IsNotEmpty()
  @IsNumber()
  overallScore: number;

  @IsOptional()
  criteriaRatings?: Record<string, { score: number; comment?: string }>;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  areasOfImprovement?: string;

  @IsOptional()
  @IsString()
  generalNotes?: string;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean;
}
