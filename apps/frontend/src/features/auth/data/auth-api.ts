/**
 * Thin client for the backend's /auth endpoints. Runs in the browser (this
 * feature's forms are Client Components), so this is a plain fetch wrapper,
 * not a `server-only` data module — see the api-integration-guide skill for
 * why this shape (mirrors the mocked-service pattern used elsewhere in the
 * app, but talking to the real NestJS backend instead of static mock data).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include", // sends/receives the httpOnly refresh-token cookie
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new AuthApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function refresh(): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/refresh", { method: "POST" });
}

export function logout(accessToken: string): Promise<{ success: true }> {
  return request<{ success: true }>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
