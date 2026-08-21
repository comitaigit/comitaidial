import { IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  personId!: string;
}
