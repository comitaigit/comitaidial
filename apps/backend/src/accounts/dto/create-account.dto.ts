import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccountPriority } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  domain?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  segment?: string;

  @IsEnum(AccountPriority)
  @IsOptional()
  priority?: AccountPriority;
}
