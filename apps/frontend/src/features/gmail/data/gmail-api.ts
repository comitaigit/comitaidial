/**
 * Thin client for the backend's /gmail endpoints. Client-side for the same
 * reason as the other feature APIs: needs the Bearer access token, which
 * only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type GmailStatus = {
  connected: boolean;
  email?: string;
};

export class GmailApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GmailApiError";
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
    throw new GmailApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export function getGmailStatus(accessToken: string): Promise<GmailStatus> {
  return request<GmailStatus>("/gmail/status", accessToken);
}

export function getGmailConnectUrl(accessToken: string): Promise<{ url: string }> {
  return request<{ url: string }>("/gmail/connect", accessToken);
}

export function disconnectGmail(accessToken: string): Promise<{ success: true }> {
  return request<{ success: true }>("/gmail", accessToken, { method: "DELETE" });
}
