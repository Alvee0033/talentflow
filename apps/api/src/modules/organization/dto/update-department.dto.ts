import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Business Unit ID must be a valid UUID' })
  businessUnitId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Head User ID must be a valid UUID' })
  headUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
