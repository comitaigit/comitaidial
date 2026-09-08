import { IsDate, IsObject, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RecordProspectEventDto {
  @IsString()
  eventType!: string;

  @IsString()
  source!: string;

  @IsString()
  @IsOptional()
  personId?: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  occurredAt?: Date;
}
