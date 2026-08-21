/**
 * Thin client for the backend's /overview endpoints. Client-side for the
 * same reason as calls-api.ts/signals-api.ts: these routes need the Bearer
 * access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type CallOutcome =
  | "NO_ANSWER"
  | "VOICEMAIL"
  | "CONVERSATION_NO_PROGRESS"
  | "QUALIFIED_OBJECTION"
  | "CALLBACK_SCHEDULED"
  | "MEETING_SCHEDULED"
  | "INVALID_NUMBER"
  | "NOT_DECISION_MAKER";

export type OverviewKpis = {
  attemptsToday: number;
  conversationsToday: number;
  signalsToday: number;
};

export type WorkQueueItem = {
  personId: string;
  name: string;
  role: string | null;
  accountName: string;
  lastOutcome: CallOutcome;
  lastCallAt: string;
};

export type OverviewSummary = {
  kpis: OverviewKpis;
  workQueue: WorkQueueItem[];
};

export class OverviewApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "OverviewApiError";
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
    throw new OverviewApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function getOverviewSummary(accessToken: string): Promise<OverviewSummary> {
  return request<OverviewSummary>("/overview/summary", accessToken);
}

export function getOverviewInsight(accessToken: string): Promise<{ insight: string }> {
  return request<{ insight: string }>("/overview/insight", accessToken);
}
