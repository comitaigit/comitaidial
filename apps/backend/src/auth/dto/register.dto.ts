import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /**
   * Length + character-class requirement only — NIST 800-63B recommends
   * against forcing arbitrary composition rules and instead favors length
   * and checking against known-breached password lists (not implemented
   * here; consider a HaveIBeenPwned k-anonymity check before production).
   */
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain a number' })
  password!: string;
}
