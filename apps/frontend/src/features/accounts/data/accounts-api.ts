/**
 * Thin client for the backend's /accounts endpoints. Runs in the browser —
 * these routes require a Bearer access token, and the token only ever lives
 * in the client-side session store (see `features/auth/data/auth-api.ts`'s
 * header comment for why), so this can't be a `server-only` data module the
 * way a page.tsx's data fetching normally is in this repo.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type AccountPriority = "HIGH" | "MEDIUM" | "LOW";

export type Account = {
  id: string;
  name: string;
  domain: string | null;
  segment: string | null;
  priority: AccountPriority | null;
  pain: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { people: number };
};

export type CreateAccountInput = {
  name: string;
  domain?: string;
  segment?: string;
  priority?: AccountPriority;
};

export class AccountsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AccountsApiError";
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
    throw new AccountsApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function listAccounts(accessToken: string): Promise<Account[]> {
  return request<Account[]>("/accounts", accessToken);
}

export function createAccount(
  input: CreateAccountInput,
  accessToken: string,
): Promise<Account> {
  return request<Account>("/accounts", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type ImportAccountsResult = {
  created: number;
  merged: number;
  skipped: number;
  errors: string[];
};

export function importAccounts(
  csv: string,
  accessToken: string,
): Promise<ImportAccountsResult> {
  return request<ImportAccountsResult>("/accounts/import", accessToken, {
    method: "POST",
    body: JSON.stringify({ csv }),
  });
}
