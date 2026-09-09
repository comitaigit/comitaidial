import { CallOutcome } from '@prisma/client';

// Which Outcomes mean a human was actually reached vs. which mean the call
// never connected — shared by Call Check's Status column, Overview's KPIs,
// and Meu Funil's funnel. The Dial spec is explicit that this formula must
// stay identical everywhere it's used, so it lives here once instead of
// being reimplemented per feature.
export const NOT_CONNECTED_OUTCOMES: readonly CallOutcome[] = [
  CallOutcome.NO_ANSWER,
  CallOutcome.INVALID_NUMBER,
  CallOutcome.BUSY,
  CallOutcome.VOICEMAIL,
];

export type CallStatus = 'SCHEDULED' | 'CONNECTED' | 'NOT_CONNECTED';

export function deriveCallStatus(
  outcome: CallOutcome | null,
): CallStatus | null {
  if (!outcome) return null;
  if (outcome === CallOutcome.MEETING_SCHEDULED) return 'SCHEDULED';
  if (NOT_CONNECTED_OUTCOMES.includes(outcome)) return 'NOT_CONNECTED';
  return 'CONNECTED';
}
