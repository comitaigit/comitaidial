import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { InfluenceLevel } from '@prisma/client';

export class CreatePersonDto {
  @IsUUID()
  accountId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

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
