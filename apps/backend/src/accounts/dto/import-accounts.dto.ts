import { IsNotEmpty, IsString } from 'class-validator';

export class ImportAccountsDto {
  // Raw CSV text — the frontend reads the file with File.text() and posts
  // it as a string rather than multipart, since we don't need streaming or
  // large-file support for a sales-team CSV.
  @IsString()
  @IsNotEmpty()
  csv!: string;
}
