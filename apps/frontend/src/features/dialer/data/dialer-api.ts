/**
 * Thin client for the Dialer's backend calls: minting a Voice Access Token
 * for the browser softphone, fetching the dial queue, generating/fetching
 * account research, and recording the outcome after a call ends.
 * Client-side — same reason as every other *-api.ts in this app: these
 * routes need the Bearer token from the client-side session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type InfluenceLevel =
  | "FINANCIAL_DECISION_MAKER"
  | "DIRECT_INFLUENCER"
  | "OPERATIONAL_DECISION_MAKER"
  | "INDIRECT_INFLUENCER";

export type AccountPriority = "HIGH" | "MEDIUM" | "LOW";

export type QueueItem = {
  personId: string;
  name: string;
  phone: string;
  role: string | null;
  persona: InfluenceLevel | null;
  accountId: string;
  accountName: string;
  priority: AccountPriority | null;
  lastActivity: string | null;
  cadenceId: string;
  clientCompanyId: string;
  linkedinUrl: string | null;
  callAttemptsCount: number;
  lastOutcome: string | null;
};

export type DialerCadence = {
  id: string;
  name: string;
  clientCompanyId: string | null;
  clientCompany: { id: string; name: string; mainProduct: string } | null;
  _count: { enrollments: number };
};

export type CallOutcome =
  | "VOICEMAIL"
  | "WRONG_PERSON"
  | "BUSY"
  | "NO_ANSWER"
  | "INVALID_NUMBER"
  | "CALLBACK_REQUESTED"
  | "MEETING_SCHEDULED"
  | "NOT_INTERESTED";

export type NotInterestedReason =
  | "BUDGET"
  | "NOT_INTERESTED"
  | "PRODUCT_FEEDBACK"
  | "USES_COMPETITOR"
  | "DOES_NOT_WANT_TO_TALK";

export type TaskChannel = "CALL" | "WHATSAPP" | "EMAIL" | "LINKEDIN";

export type Call = {
  id: string;
  personId: string | null;
  createdAt: string;
};

export type ParallelLegStatus =
  | "RINGING"
  | "MACHINE_DETECTED"
  | "NO_ANSWER"
  | "BUSY"
  | "FAILED"
  | "CONNECTED"
  | "ABANDONED";

export type ParallelBatchLeg = {
  callId: string;
  personId: string;
  name: string;
  accountName: string;
  phone: string;
};

export type ParallelBatchSummary = {
  batchId: string;
  conferenceName: string;
  legs: ParallelBatchLeg[];
};

export type ParallelBatchWinner = {
  callId: string;
  personId: string;
  name: string;
  role: string | null;
  accountId: string;
  accountName: string;
  clientCompanyId: string;
};

export type ParallelBatchStatus = {
  batchId: string;
  legs: Array<{ callId: string; personId: string; status: ParallelLegStatus }>;
  winner: ParallelBatchWinner | null;
};

export type ResearchObjection = { objection: string; response: string };
export type ResearchBattlecard = { competitor: string; theirStrength: string; ourEdge: string };

export type AccountResearch = {
  companyOverview: string;
  roleImportance: string;
  roleIndicators: string;
  callScript: string;
  objections: ResearchObjection[];
  battlecards: ResearchBattlecard[];
  generatedAt: string;
};

export type UpdateOutcomeInput = {
  outcome: CallOutcome;
  durationSeconds?: number;
  notInterestedReason?: NotInterestedReason;
  callbackDueAt?: string;
  callbackChannel?: TaskChannel;
  callbackNotes?: string;
  suppressNumber?: boolean;
};

export class DialerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DialerApiError";
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.message === "string") return body.message;
    if (Array.isArray(body.message)) return body.message.join(" ");
  } catch {
    // fall through to generic message
  }
  return "Something went wrong. Please try again.";
}

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new DialerApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function getVoiceToken(accessToken: string): Promise<{ token: string }> {
  return request<{ token: string }>("/calls/voice-token", accessToken, { method: "POST" });
}

export function listDialerCadences(accessToken: string): Promise<DialerCadence[]> {
  return request<DialerCadence[]>("/cadences", accessToken);
}

export function getQueue(cadenceId: string, accessToken: string): Promise<QueueItem[]> {
  return request<QueueItem[]>(
    `/dialer/queue?cadenceId=${encodeURIComponent(cadenceId)}`,
    accessToken,
  );
}

// Persists a manual drag-and-drop reorder — personIds is the full new
// front-to-back order, same contract as reordering a playlist.
export function reorderQueue(
  cadenceId: string,
  personIds: string[],
  accessToken: string,
): Promise<void> {
  return request<void>("/dialer/queue/reorder", accessToken, {
    method: "PATCH",
    body: JSON.stringify({ cadenceId, personIds }),
  });
}

export function getResearch(
  accountId: string,
  personRole: string | null,
  clientCompanyId: string,
  accessToken: string,
): Promise<AccountResearch> {
  const params = new URLSearchParams({ clientCompanyId });
  if (personRole) params.set("personRole", personRole);
  return request<AccountResearch>(`/dialer/research/${accountId}?${params}`, accessToken);
}

// Discagem paralela — up to 3 lines at once (2026-08-25). Originates the
// batch's outbound legs server-side; the browser then joins the same
// Conference via the softphone (see useSoftphone.callParallel).
export function startParallelBatch(
  cadenceId: string,
  accessToken: string,
): Promise<ParallelBatchSummary> {
  return request<ParallelBatchSummary>("/calls/parallel-batch", accessToken, {
    method: "POST",
    body: JSON.stringify({ cadenceId }),
  });
}

// Polled while a batch is in flight — no push/websocket in v1.
export function getParallelBatchStatus(
  batchId: string,
  accessToken: string,
): Promise<ParallelBatchStatus> {
  return request<ParallelBatchStatus>(`/calls/parallel-batch/${batchId}`, accessToken);
}

// Called when the BDR hangs up before any line was answered by a human —
// cancels whatever legs are still ringing so a prospect who picks up a
// moment later isn't dropped into an abandoned conference room.
export function cancelParallelBatch(batchId: string, accessToken: string): Promise<void> {
  return request<void>(`/calls/parallel-batch/${batchId}/cancel`, accessToken, {
    method: "POST",
  });
}

export async function getLatestCallForPerson(
  personId: string,
  accessToken: string,
): Promise<Call | null> {
  const calls = await request<Call[]>(
    `/calls?personId=${encodeURIComponent(personId)}`,
    accessToken,
  );
  return calls[0] ?? null;
}

export function updateCallOutcome(
  callId: string,
  input: UpdateOutcomeInput,
  accessToken: string,
): Promise<unknown> {
  return request(`/calls/${callId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
