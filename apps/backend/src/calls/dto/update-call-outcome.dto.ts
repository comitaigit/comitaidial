import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CallOutcome, NotInterestedReason, TaskChannel } from '@prisma/client';

export class UpdateCallOutcomeDto {
  @IsEnum(CallOutcome)
  outcome!: CallOutcome;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationSeconds?: number;

  // Required when outcome = NOT_INTERESTED.
  @ValidateIf(
    (dto: UpdateCallOutcomeDto) => dto.outcome === CallOutcome.NOT_INTERESTED,
  )
  @IsEnum(NotInterestedReason)
  notInterestedReason?: NotInterestedReason;

  // Required when outcome = CALLBACK_REQUESTED — combined date+time the
  // prospect asked to be called back.
  @ValidateIf(
    (dto: UpdateCallOutcomeDto) =>
      dto.outcome === CallOutcome.CALLBACK_REQUESTED,
  )
  @IsDateString()
  callbackDueAt?: string;

  @ValidateIf(
    (dto: UpdateCallOutcomeDto) =>
      dto.outcome === CallOutcome.CALLBACK_REQUESTED,
  )
  @IsEnum(TaskChannel)
  callbackChannel?: TaskChannel;

  // BDR-authored note on what was agreed — becomes the created Task's
  // summary. Not AI-generated: there's no call transcript yet to summarize
  // from (that lands with Call Check's transcription), so a fabricated
  // "AI summary" here would just be decoration pretending to be real.
  @ValidateIf(
    (dto: UpdateCallOutcomeDto) =>
      dto.outcome === CallOutcome.CALLBACK_REQUESTED,
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  callbackNotes?: string;

  // "Não discar mais para esse número" — available regardless of outcome.
  @IsOptional()
  @IsBoolean()
  suppressNumber?: boolean;
}
