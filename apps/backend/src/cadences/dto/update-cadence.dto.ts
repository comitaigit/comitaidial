import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

// Every field optional — a PATCH edits only what's sent. @IsOptional() skips
// validation for both undefined and null, so clientCompanyId: null is a
// valid way to clear it (knocking the cadence back to "incomplete").
export class UpdateCadenceDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsUUID()
  @IsOptional()
  clientCompanyId?: string;
}
