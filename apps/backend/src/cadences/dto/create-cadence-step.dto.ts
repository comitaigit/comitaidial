import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { CadenceStepType } from '@prisma/client';

export class CreateCadenceStepDto {
  @IsEnum(CadenceStepType)
  type!: CadenceStepType;

  @IsInt()
  @Min(0)
  dayOffset!: number;

  // LinkedIn-only gating (see schema.prisma's CadenceStep comment) — harmless
  // to send for other step types, just unused by them.
  @IsBoolean()
  @IsOptional()
  waitForConnectionAccepted?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
