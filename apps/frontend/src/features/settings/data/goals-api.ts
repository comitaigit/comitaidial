/**
 * Thin client for the backend's /goals/me endpoint (Workspace's Metas card).
 * Client-side for the same reason as the other feature APIs: needs the
 * Bearer access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type GoalPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY";

export type Goal = {
  id: string;
  period: GoalPeriod;
  callsTarget: number;
  conversationsTarget: number;
  dialingMinutesTarget: number;
  conversationMinutesTarget: number;
  connectedCallsTarget: number;
  setByRole: "ADMIN" | "MEMBER";
};

export type UpsertGoalInput = {
  period: GoalPeriod;
  callsTarget: number;
  conversationsTarget: number;
  dialingMinutesTarget: number;
  conversationMinutesTarget: number;
  connectedCallsTarget: number;
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

export async function getMyGoal(accessToken: string, period: GoalPeriod): Promise<Goal | null> {
  const res = await fetch(`${API_BASE_URL}/goals/me?period=${period}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new GoalsApiError(await parseErrorMessage(res), res.status);
  }
  const body: unknown = await res.json();
  return (body as Goal | null) ?? null;
}

export async function upsertMyGoal(accessToken: string, input: UpsertGoalInput): Promise<Goal> {
  const res = await fetch(`${API_BASE_URL}/goals/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new GoalsApiError(await parseErrorMessage(res), res.status);
  }
  return res.json() as Promise<Goal>;
}
