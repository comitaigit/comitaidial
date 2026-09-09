import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCadenceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  // Optional at creation — a cadence with no client company is "incomplete"
  // (the Dialer refuses to dial it) but can still be authored/edited before
  // that's set.
  @IsUUID()
  @IsOptional()
  clientCompanyId?: string;
}
