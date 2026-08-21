import {
  IsBoolean,
  IsOptional,
  IsString,
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
}
