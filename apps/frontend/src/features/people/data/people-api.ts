/**
 * Thin client for the backend's /people endpoints. Client-side for the same
 * reason as accounts-api.ts: these routes need the Bearer access token,
 * which only lives in the client-side session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type InfluenceLevel =
  | "FINANCIAL_DECISION_MAKER"
  | "DIRECT_INFLUENCER"
  | "OPERATIONAL_DECISION_MAKER"
  | "INDIRECT_INFLUENCER";

export type Person = {
  id: string;
  accountId: string;
  account: { id: string; name: string };
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  influenceLevel: InfluenceLevel | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePersonInput = {
  accountId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  influenceLevel?: InfluenceLevel;
};

// Just enough of Account to populate the "Account" picker in the new-prospect
// form — kept local to this slice rather than importing from
// features/accounts (feature slices don't reach into each other's internals).
export type AccountOption = { id: string; name: string };

// Same idea for Cadence — just enough to populate the "add selected
// prospects to a cadence" picker.
export type CadenceOption = { id: string; name: string };

export class PeopleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PeopleApiError";
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
    throw new PeopleApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function listPeople(accessToken: string, accountId?: string): Promise<Person[]> {
  const query = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
  return request<Person[]>(`/people${query}`, accessToken);
}

export function createPerson(
  input: CreatePersonInput,
  accessToken: string,
): Promise<Person> {
  return request<Person>("/people", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listAccountOptions(accessToken: string): Promise<AccountOption[]> {
  return request<AccountOption[]>("/accounts", accessToken);
}

export function listCadenceOptions(accessToken: string): Promise<CadenceOption[]> {
  return request<CadenceOption[]>("/cadences", accessToken);
}

export function enrollPersonInCadence(
  cadenceId: string,
  personId: string,
  accessToken: string,
): Promise<unknown> {
  return request(`/cadences/${cadenceId}/enrollments`, accessToken, {
    method: "POST",
    body: JSON.stringify({ personId }),
  });
}
