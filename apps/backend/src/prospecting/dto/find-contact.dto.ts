import { IsString } from 'class-validator';

export class FindContactDto {
  @IsString()
  accountId!: string;

  @IsString()
  clientCompanyId!: string;
}
