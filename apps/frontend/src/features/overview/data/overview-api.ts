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

export type HomeTask = {
  id: string;
  status: "done" | "overdue" | "active" | "pending";
  time: string;
  type: "call" | "meeting" | "followup" | "proposal" | "email";
  contactName: string;
  company: string;
  context?: string;
  signal?: boolean;
  actionLabel: string;
  actionHref: string;
};

export type CargoRow = {
  label: string;
  count: number;
  percentage: number;
  highlight?: "success" | "danger";
};

export type CargoBreakdown = {
  conversations: CargoRow[];
  meetings: CargoRow[];
};

export type HeatmapData = {
  data: number[][];
  hours: string[];
  days: string[];
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

// Derives a HomeTask from the existing TaskListItem shape.
// The backend doesn't yet expose task type / action — defaults to "call".
export function toHomeTask(item: TaskListItem): HomeTask {
  const dueAt = new Date(item.dueAt);
  const now = new Date();
  const isOverdue = dueAt < now;
  const diffMs = dueAt.getTime() - now.getTime();
  const isSoon = !isOverdue && diffMs < 30 * 60_000;

  const status: HomeTask["status"] = isOverdue ? "overdue" : isSoon ? "active" : "pending";

  const h = dueAt.getHours().toString().padStart(2, "0");
  const m = dueAt.getMinutes().toString().padStart(2, "0");
  const time = isOverdue ? "Vencida" : isSoon ? "Agora" : `${h}h${m}`;

  const actionLabel =
    status === "overdue" ? "Resolver →" : status === "active" ? "Entrar →" : "Ligar →";

  return {
    id: item.id,
    status,
    time,
    type: "call",
    contactName: item.prospectName,
    company: item.companyName,
    context: item.summary ?? undefined,
    actionLabel,
    actionHref: "/dialer",
  };
}
