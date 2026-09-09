import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class DiscoverAccountsDto {
  // Lusha's lookalike API requires 5-100 seed companies — see
  // ProspectingService.discoverAccounts.
  @IsString({ each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(100)
  seedAccountIds!: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  limit?: number;
}
