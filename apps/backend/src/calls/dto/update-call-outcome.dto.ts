import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CallOutcome } from '@prisma/client';

export class UpdateCallOutcomeDto {
  @IsEnum(CallOutcome)
  outcome!: CallOutcome;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationSeconds?: number;
}
