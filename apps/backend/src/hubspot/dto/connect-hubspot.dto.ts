import { IsString, MinLength } from 'class-validator';

export class ConnectHubSpotDto {
  @IsString()
  @MinLength(10)
  accessToken!: string;
}
