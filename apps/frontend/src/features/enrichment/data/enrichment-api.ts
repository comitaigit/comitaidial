/**
 * Thin client for the backend's /enrichment endpoints. Client-side for the
 * same reason as the other feature APIs: needs the Bearer access token,
 * which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type EnrichmentJobStatus = "SUCCESS" | "NO_MATCH" | "FAILED";

export type EnrichmentResult = {
  status: EnrichmentJobStatus;
  creditsCharged: number;
  fieldsFilled: string[];
};

export class EnrichmentApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EnrichmentApiError";
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
    throw new EnrichmentApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export function getEnrichmentCredits(accessToken: string): Promise<{ balance: number }> {
  return request<{ balance: number }>("/enrichment/credits", accessToken);
}

export function grantEnrichmentCredits(
  credits: number,
  accessToken: string,
): Promise<{ balance: number }> {
  return request<{ balance: number }>("/enrichment/credits/grant", accessToken, {
    method: "POST",
    body: JSON.stringify({ credits }),
  });
}

export function enrichPerson(
  personId: string,
  accessToken: string,
): Promise<EnrichmentResult> {
  return request<EnrichmentResult>(`/enrichment/people/${personId}`, accessToken, {
    method: "POST",
  });
}

export function enrichAccount(
  accountId: string,
  accessToken: string,
): Promise<EnrichmentResult> {
  return request<EnrichmentResult>(`/enrichment/accounts/${accountId}`, accessToken, {
    method: "POST",
  });
}
