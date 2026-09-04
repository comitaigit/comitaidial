import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { InfluenceLevel } from '@prisma/client';

// accountId is intentionally not editable here — moving a person between
// accounts is a distinct operation, not a field edit, if it's ever needed.
export class UpdatePersonDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  role?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  linkedinUrl?: string;

  @IsEnum(InfluenceLevel)
  @IsOptional()
  influenceLevel?: InfluenceLevel;
}
