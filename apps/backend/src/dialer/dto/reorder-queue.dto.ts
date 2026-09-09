import { ArrayNotEmpty, IsUUID } from 'class-validator';

// The full new order of the queue as a list of personIds, front to back —
// same "whole-list is authoritative" contract as a drag-and-drop playlist.
// Only enrollments for this cadence are touched; a personId not currently
// enrolled (stale client state) is silently ignored rather than erroring.
export class ReorderQueueDto {
  @IsUUID()
  cadenceId!: string;

  @IsUUID(undefined, { each: true })
  @ArrayNotEmpty()
  personIds!: string[];
}
