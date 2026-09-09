/**
 * Thin client for the backend's /cadences endpoints. Client-side for the
 * same reason as accounts-api.ts/people-api.ts: these routes need the
 * Bearer access token, which only lives in the client-side session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type Cadence = {
  id: string;
  name: string;
  active: boolean;
  clientCompanyId: string | null;
  clientCompany: { id: string; name: string; mainProduct: string } | null;
  createdAt: string;
  updatedAt: string;
  _count: { steps: number; enrollments: number };
};

export type CreateCadenceInput = {
  name: string;
  active?: boolean;
  clientCompanyId?: string;
};

export type UpdateCadenceInput = {
  name?: string;
  active?: boolean;
  clientCompanyId?: string | null;
};

export type CadenceStepType =
  | "CALL"
  | "AUTOMATIC_EMAIL"
  | "MANUAL_EMAIL"
  | "MANUAL_SMS"
  | "WHATSAPP_MESSAGE"
  | "ACTION_ITEM"
  | "LINKEDIN_CONNECTION_REQUEST"
  | "LINKEDIN_MESSAGE";

export type CadenceStep = {
  id: string;
  cadenceId: string;
  order: number;
  dayOffset: number;
  type: CadenceStepType;
  waitForConnectionAccepted: boolean;
  notes: string | null;
};

export type CreateCadenceStepInput = {
  type: CadenceStepType;
  dayOffset: number;
  waitForConnectionAccepted?: boolean;
  notes?: string;
};

export class CadencesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CadencesApiError";
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
    throw new CadencesApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function listCadences(accessToken: string): Promise<Cadence[]> {
  return request<Cadence[]>("/cadences", accessToken);
}

export type ClientCompanyOption = { id: string; name: string; mainProduct: string };

export function listClientCompaniesForCadence(
  accessToken: string,
): Promise<ClientCompanyOption[]> {
  return request<ClientCompanyOption[]>("/client-companies", accessToken);
}

export function createCadence(
  input: CreateCadenceInput,
  accessToken: string,
): Promise<Cadence> {
  return request<Cadence>("/cadences", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCadence(
  id: string,
  input: UpdateCadenceInput,
  accessToken: string,
): Promise<Cadence> {
  return request<Cadence>(`/cadences/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function addCadenceStep(
  cadenceId: string,
  input: CreateCadenceStepInput,
  accessToken: string,
): Promise<CadenceStep> {
  return request<CadenceStep>(`/cadences/${cadenceId}/steps`, accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
