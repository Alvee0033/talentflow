import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRecruiterDto {
  @IsUUID('4', { message: 'Recruiter ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Recruiter ID is required' })
  recruiterId: string;
}
