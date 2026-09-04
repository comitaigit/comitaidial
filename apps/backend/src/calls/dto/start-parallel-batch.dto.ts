import { IsUUID } from 'class-validator';

export class StartParallelBatchDto {
  @IsUUID()
  cadenceId!: string;
}
