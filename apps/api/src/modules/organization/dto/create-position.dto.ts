import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty({ message: 'Position title is required' })
  @MaxLength(150)
  title: string;

  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  departmentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  level?: string; // Junior, Mid, Senior, Lead, Head

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
