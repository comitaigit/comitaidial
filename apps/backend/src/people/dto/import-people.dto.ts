import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportPeopleDto {
  // Raw CSV text — same reasoning as ImportAccountsDto: no multipart, the
  // frontend posts File.text() as a JSON string.
  @IsString()
  @IsNotEmpty()
  csv!: string;

  // Optional — when set, every prospect created or matched by this import
  // is enrolled into this cadence (the CSV upload's "incluir em cadência
  // existente" option).
  @IsUUID()
  @IsOptional()
  cadenceId?: string;
}
