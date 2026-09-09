import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Every field optional — a PATCH edits only what's sent.
export class UpdateClientCompanyDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  mainProduct?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  positioning?: string;

  // ICP gate for AI Prospecting — see schema.prisma's comment on this field.
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  targetRoles?: string[];
}
