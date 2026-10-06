/**
 * Thin client for the backend's /hubspot endpoints. Client-side for the same
 * reason as the other feature APIs: needs the Bearer access token, which
 * only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type HubSpotStatus = {
  connected: boolean;
};

export type HubSpotObject = {
  id: string;
  properties: Record<string, string | null>;
};

export class HubSpotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HubSpotApiError";
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
    throw new HubSpotApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export function getHubSpotStatus(accessToken: string): Promise<HubSpotStatus> {
  return request<HubSpotStatus>("/hubspot/status", accessToken);
}

export function connectHubSpot(
  hubspotAccessToken: string,
  accessToken: string,
): Promise<{ success: true }> {
  return request<{ success: true }>("/hubspot/connect", accessToken, {
    method: "POST",
    body: JSON.stringify({ accessToken: hubspotAccessToken }),
  });
}

export function disconnectHubSpot(accessToken: string): Promise<{ success: true }> {
  return request<{ success: true }>("/hubspot", accessToken, { method: "DELETE" });
}

export function getHubSpotContactForPerson(
  personId: string,
  accessToken: string,
): Promise<HubSpotObject> {
  return request<HubSpotObject>(`/hubspot/people/${personId}`, accessToken);
}

export function getHubSpotCompanyForAccount(
  accountId: string,
  accessToken: string,
): Promise<HubSpotObject> {
  return request<HubSpotObject>(`/hubspot/accounts/${accountId}`, accessToken);
}
