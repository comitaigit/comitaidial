/**
 * Thin client for the backend's /calls endpoints. Client-side for the same
 * reason as accounts-api.ts/people-api.ts/cadences-api.ts: these routes
 * need the Bearer access token, which only lives in the client session store.
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

export type Call = {
  id: string;
  personId: string | null;
  person: { id: string; name: string } | null;
  twilioCallSid: string | null;
  toNumber: string;
  fromNumber: string;
  outcome: CallOutcome | null;
  durationSeconds: number | null;
  isConversation: boolean;
  connectedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export class CallsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CallsApiError";
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
    throw new CallsApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function listCalls(accessToken: string, personId?: string): Promise<Call[]> {
  const query = personId ? `?personId=${encodeURIComponent(personId)}` : "";
  return request<Call[]>(`/calls${query}`, accessToken);
}
