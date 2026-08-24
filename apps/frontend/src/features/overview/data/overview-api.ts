/**
 * Thin client for the backend's /overview endpoints. Client-side for the
 * same reason as calls-api.ts/signals-api.ts: these routes need the Bearer
 * access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type WindowDays = 7 | 15 | 30;

export type OverviewKpis = {
  attempts: number;
  connected: number;
  conversations: number;
  meetingsScheduled: number;
  connectRate: number;
  conversationRate: number;
};

export type ContentPill =
  | { ready: false; classifiedCount: number }
  | { ready: true; painPoints: string[]; objections: string[]; recommendation: string };

export type TaskListItem = {
  id: string;
  companyName: string;
  prospectName: string;
  dueAt: string;
  summary: string | null;
};

export type Funnel = {
  attempts: number;
  connected: number;
  conversations: number;
  meetingsScheduled: number;
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

export function getOverviewKpis(accessToken: string, days: WindowDays): Promise<OverviewKpis> {
  return request<OverviewKpis>(`/overview/kpis?days=${days}`, accessToken);
}

export function getContentPill(accessToken: string, days: WindowDays): Promise<ContentPill> {
  return request<ContentPill>(`/overview/content-pill?days=${days}`, accessToken);
}

export function getTaskList(accessToken: string): Promise<TaskListItem[]> {
  return request<TaskListItem[]>("/overview/tasks", accessToken);
}

export function getFunnel(accessToken: string, days: WindowDays): Promise<Funnel> {
  return request<Funnel>(`/overview/funnel?days=${days}`, accessToken);
}
