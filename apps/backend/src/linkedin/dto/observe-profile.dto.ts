import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

// Sent by the BDR's browser extension while they're viewing a LinkedIn
// profile — whatever the content script could read off the page for the
// profile currently open. Both role/company are optional since LinkedIn's
// DOM doesn't always expose a clean "current role" (e.g. profile with no
// current position listed).
export class ObserveProfileDto {
  @IsUrl()
  linkedinUrl!: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  currentRole?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  currentCompanyName?: string;

  // '1st' | '2nd' | '3rd' — whatever badge text the page showed next to
  // the name. Used only to detect a fresh "accepted" transition; anything
  // else is ignored, so this doesn't need to be an enum.
  @IsString()
  @IsOptional()
  @MaxLength(10)
  connectionDegree?: string;
}
