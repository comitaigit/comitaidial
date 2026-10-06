/**
 * Thin client for the backend's /assistant endpoints (conversational
 * assistant + its chat-initiated action proposals). Client-side for the
 * same reason as the other feature APIs: needs the Bearer access token,
 * which only lives in the client session store.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AssistantMessageRole = "USER" | "ASSISTANT";

export type AssistantMessage = {
  role: AssistantMessageRole;
  text: string;
  createdAt: string;
};

export type AssistantProposalType = "ENROLL_IN_CADENCE" | "SEND_EMAIL" | "ENRICH_PERSON";
export type AssistantProposalStatus = "PENDING" | "REJECTED" | "EXECUTED" | "FAILED";

export type AssistantProposal = {
  id: string;
  type: AssistantProposalType;
  status: AssistantProposalStatus;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  proposals: AssistantProposal[];
};

export class AssistantApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AssistantApiError";
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
    throw new AssistantApiError(await parseErrorMessage(res), res.status);
  }
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export function listConversations(accessToken: string): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>("/assistant/conversations", accessToken);
}

export function getConversation(id: string, accessToken: string): Promise<Conversation> {
  return request<Conversation>(`/assistant/conversations/${id}`, accessToken);
}

export function sendMessage(
  message: string,
  conversationId: string | undefined,
  accessToken: string,
): Promise<{ conversationId: string; reply: string }> {
  return request<{ conversationId: string; reply: string }>("/assistant/messages", accessToken, {
    method: "POST",
    body: JSON.stringify({ message, conversationId }),
  });
}

export function approveProposal(id: string, accessToken: string): Promise<AssistantProposal> {
  return request<AssistantProposal>(`/assistant/proposals/${id}/approve`, accessToken, {
    method: "POST",
  });
}

export function rejectProposal(id: string, accessToken: string): Promise<AssistantProposal> {
  return request<AssistantProposal>(`/assistant/proposals/${id}/reject`, accessToken, {
    method: "POST",
  });
}
