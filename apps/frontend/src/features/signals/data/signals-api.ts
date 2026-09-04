/**
 * Thin client for the backend's /signals endpoint. Client-side for the same
 * reason as accounts-api.ts/people-api.ts/calls-api.ts: this route needs the
 * Bearer access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type SignalCategory = "PERSON" | "COMPANY" | "ENGAGEMENT" | "AI_INTERPRETATION";

export type Signal = {
  id: string;
  category: SignalCategory;
  subtype: string;
  summary: string;
  source: string | null;
  occurredAt: string;
  account: { id: string; name: string } | null;
  person: { id: string; name: string } | null;
};

export class SignalsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "SignalsApiError";
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
    throw new SignalsApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function listSignals(accessToken: string): Promise<Signal[]> {
  return request<Signal[]>("/signals", accessToken);
}
