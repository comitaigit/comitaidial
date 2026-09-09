import { ArrayNotEmpty, IsUUID } from 'class-validator';

// Drops one or more people from this cadence's queue for good (the BDR
// clicked "Remover", not "Pular contato") — deactivates their enrollment so
// they don't reappear on the next queue fetch. A personId that isn't (or is
// no longer) an active enrollment here is silently skipped.
export class RemoveFromQueueDto {
  @IsUUID()
  cadenceId!: string;

  @IsUUID(undefined, { each: true })
  @ArrayNotEmpty()
  personIds!: string[];
}
