/**
 * Thin client for the backend's /goals/report and /accounts endpoints (KPI
 * Targets). Client-side for the same reason as the other feature APIs:
 * needs the Bearer access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type CallOutcome =
  | "VOICEMAIL"
  | "WRONG_PERSON"
  | "BUSY"
  | "NO_ANSWER"
  | "INVALID_NUMBER"
  | "CALLBACK_REQUESTED"
  | "MEETING_SCHEDULED"
  | "NOT_INTERESTED";

export type GoalReportRow = {
  userId: string;
  userName: string;
  target: {
    callsTarget: number;
    conversationsTarget: number;
    dialingMinutesTarget: number;
    conversationMinutesTarget: number;
    connectedCallsTarget: number;
  } | null;
  realized: {
    calls: number;
    conversations: number;
    dialingMinutes: number;
    conversationMinutes: number;
    connectedCalls: number;
    connectRate: number;
  };
};

export type AccountOption = { id: string; name: string };

export type ReportFilters = {
  from?: string;
  to?: string;
  accountId?: string;
  outcome?: CallOutcome;
};

export class GoalsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GoalsApiError";
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

async function request<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new GoalsApiError(await parseErrorMessage(res), res.status);
  }
  return res.json() as Promise<T>;
}

export function getReport(accessToken: string, filters: ReportFilters): Promise<GoalReportRow[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.outcome) params.set("outcome", filters.outcome);
  const query = params.toString();
  return request<GoalReportRow[]>(`/goals/report${query ? `?${query}` : ""}`, accessToken);
}

export function getAccountsForFilter(accessToken: string): Promise<AccountOption[]> {
  return request<AccountOption[]>("/accounts", accessToken);
}
