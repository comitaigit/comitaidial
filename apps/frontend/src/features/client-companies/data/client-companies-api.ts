/**
 * Thin client for the backend's /client-companies endpoints. Client-side
 * for the same reason as the other feature APIs: needs the Bearer access
 * token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type ClientCompany = {
  id: string;
  name: string;
  mainProduct: string;
  positioning: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateClientCompanyInput = {
  name: string;
  mainProduct: string;
  positioning?: string;
};

export type UpdateClientCompanyInput = Partial<CreateClientCompanyInput>;

export class ClientCompaniesApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ClientCompaniesApiError";
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
    throw new ClientCompaniesApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export function listClientCompanies(accessToken: string): Promise<ClientCompany[]> {
  return request<ClientCompany[]>("/client-companies", accessToken);
}

export function createClientCompany(
  input: CreateClientCompanyInput,
  accessToken: string,
): Promise<ClientCompany> {
  return request<ClientCompany>("/client-companies", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateClientCompany(
  id: string,
  input: UpdateClientCompanyInput,
  accessToken: string,
): Promise<ClientCompany> {
  return request<ClientCompany>(`/client-companies/${id}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteClientCompany(id: string, accessToken: string): Promise<void> {
  return request<void>(`/client-companies/${id}`, accessToken, { method: "DELETE" });
}
