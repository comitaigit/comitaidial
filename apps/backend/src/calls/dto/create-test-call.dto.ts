import { IsPhoneNumber } from 'class-validator';

export class CreateTestCallDto {
  @IsPhoneNumber()
  to!: string;
}
