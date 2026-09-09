import { IsInt, Min } from 'class-validator';

export class GrantCreditsDto {
  @IsInt()
  @Min(1)
  credits!: number;
}
