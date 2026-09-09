import { IsEnum, IsInt, Min } from 'class-validator';
import { GoalPeriod } from '@prisma/client';

export class UpsertGoalDto {
  @IsEnum(GoalPeriod)
  period!: GoalPeriod;

  @IsInt()
  @Min(0)
  callsTarget!: number;

  @IsInt()
  @Min(0)
  conversationsTarget!: number;

  @IsInt()
  @Min(0)
  dialingMinutesTarget!: number;

  @IsInt()
  @Min(0)
  conversationMinutesTarget!: number;

  @IsInt()
  @Min(0)
  connectedCallsTarget!: number;
}
