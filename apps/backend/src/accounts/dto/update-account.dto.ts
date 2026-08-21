import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountPriority } from '@prisma/client';

// Every field optional — a PATCH edits only what's sent, per the Account/Prospect
// column model where priority is set manually and pain gets filled in later by
// the transcript pipeline.
export class UpdateAccountDto {
  @IsEnum(AccountPriority)
  @IsOptional()
  priority?: AccountPriority;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  segment?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  pain?: string;
}
