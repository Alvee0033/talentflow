import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBusinessUnitDto {
  @IsString()
  @IsNotEmpty({ message: 'Business Unit name is required' })
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Business Unit code is required' })
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
