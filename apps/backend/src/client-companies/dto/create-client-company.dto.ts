import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
