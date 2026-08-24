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

export function getQueue(accessToken: string): Promise<QueueItem[]> {
  return request<QueueItem[]>("/dialer/queue", accessToken);
}

export function getResearch(
  accountId: string,
  personRole: string | null,
  accessToken: string,
): Promise<AccountResearch> {
  const query = personRole ? `?personRole=${encodeURIComponent(personRole)}` : "";
  return request<AccountResearch>(`/dialer/research/${accountId}${query}`, accessToken);
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
