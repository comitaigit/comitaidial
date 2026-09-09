/**
 * Thin client for the backend's /overview/funnel endpoint (Meu Funil).
 * Client-side for the same reason as overview-api.ts: needs the Bearer
 * access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type WindowDays = 7 | 15 | 30;

export type Funnel = {
  attempts: number;
  connected: number;
  conversations: number;
  meetingsScheduled: number;
};

export class FunnelApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FunnelApiError";
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

export async function getFunnel(accessToken: string, days: WindowDays): Promise<Funnel> {
  const res = await fetch(`${API_BASE_URL}/overview/funnel?days=${days}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new FunnelApiError(await parseErrorMessage(res), res.status);
  }
  return res.json() as Promise<Funnel>;
}
