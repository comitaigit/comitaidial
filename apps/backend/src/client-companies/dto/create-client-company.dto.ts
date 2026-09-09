import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientCompanyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  mainProduct!: string;

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
