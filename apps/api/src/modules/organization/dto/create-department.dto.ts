import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Department code is required' })
  @MaxLength(50)
  code: string;

  @IsUUID('4', { message: 'Business Unit ID must be a valid UUID' })
  businessUnitId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Head User ID must be a valid UUID' })
  headUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
