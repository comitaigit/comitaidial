/**
 * Thin client covering the three human-in-the-loop approval queues: Play
 * Engine Actions held back by a cadence's ApprovalMode, Assistant proposals
 * from the AI chat, and the LinkedIn extension's pending connect/message
 * queue. Client-side for the same reason as the other feature APIs: needs
 * the Bearer access token, which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type ActionType = "SEND_EMAIL" | "LINKEDIN_CONNECT" | "LINKEDIN_MESSAGE" | "ENRICH";

export type PendingAction = {
  id: string;
  type: ActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  person: { id: string; name: string; linkedinUrl?: string | null };
};

export type AssistantProposalType = "ENROLL_IN_CADENCE" | "SEND_EMAIL" | "ENRICH_PERSON";

export type PendingProposal = {
  id: string;
  type: AssistantProposalType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export class ApprovalsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApprovalsApiError";
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
    throw new ApprovalsApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// --- Play Engine Actions (email/LinkedIn/enrich content held for approval) ---

export function listPendingActions(accessToken: string): Promise<PendingAction[]> {
  return request<PendingAction[]>("/actions/pending-approval", accessToken);
}

export function approveAction(id: string, accessToken: string): Promise<PendingAction> {
  return request<PendingAction>(`/actions/${id}/approve`, accessToken, { method: "POST" });
}

export function rejectAction(id: string, accessToken: string): Promise<PendingAction> {
  return request<PendingAction>(`/actions/${id}/reject`, accessToken, { method: "POST" });
}

// --- Assistant proposals (chat-initiated, always confirmed by a human) ---

export function listPendingProposals(accessToken: string): Promise<PendingProposal[]> {
  return request<PendingProposal[]>("/assistant/proposals", accessToken);
}

export function approveProposal(id: string, accessToken: string): Promise<PendingProposal> {
  return request<PendingProposal>(`/assistant/proposals/${id}/approve`, accessToken, {
    method: "POST",
  });
}

export function rejectProposal(id: string, accessToken: string): Promise<PendingProposal> {
  return request<PendingProposal>(`/assistant/proposals/${id}/reject`, accessToken, {
    method: "POST",
  });
}

// --- LinkedIn pending actions (surfaced here too, not just the extension) ---

export function listPendingLinkedInActions(accessToken: string): Promise<PendingAction[]> {
  return request<PendingAction[]>("/linkedin/actions/pending", accessToken);
}

export function completeLinkedInAction(
  id: string,
  accessToken: string,
): Promise<PendingAction> {
  return request<PendingAction>(`/linkedin/actions/${id}/complete`, accessToken, {
    method: "POST",
  });
}

export function skipLinkedInAction(id: string, accessToken: string): Promise<PendingAction> {
  return request<PendingAction>(`/linkedin/actions/${id}/skip`, accessToken, {
    method: "POST",
  });
}
