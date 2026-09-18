import { IsArray, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
  roleIds: string[];
}
