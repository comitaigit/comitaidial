"use client";

import { create } from "zustand";
import {
  listConversations,
  getConversation,
  sendMessage as sendMessageApi,
  type ConversationSummary,
  type Conversation,
} from "@/features/assistant/data/assistant-api";

type AssistantState = {
  conversations: ConversationSummary[];
  activeConversation: Conversation | null;
  listStatus: "idle" | "loading" | "loaded" | "error";
  conversationStatus: "idle" | "loading" | "loaded" | "error";
  sending: boolean;
  error: string | null;
  fetchConversations: (accessToken: string) => Promise<void>;
  openConversation: (accessToken: string, id: string) => Promise<void>;
  startNewConversation: () => void;
  sendMessage: (accessToken: string, text: string) => Promise<void>;
  setProposalStatus: (id: string, status: "REJECTED" | "EXECUTED" | "FAILED") => void;
};

export const useAssistantStore = create<AssistantState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  listStatus: "idle",
  conversationStatus: "idle",
  sending: false,
  error: null,
  fetchConversations: async (accessToken) => {
    set({ listStatus: "loading", error: null });
    try {
      const conversations = await listConversations(accessToken);
      set({ conversations, listStatus: "loaded" });
    } catch (err) {
      set({
        listStatus: "error",
        error: err instanceof Error ? err.message : "Failed to load conversations.",
      });
    }
  },
  openConversation: async (accessToken, id) => {
    set({ conversationStatus: "loading" });
    try {
      const activeConversation = await getConversation(id, accessToken);
      set({ activeConversation, conversationStatus: "loaded" });
    } catch (err) {
      set({
        conversationStatus: "error",
        error: err instanceof Error ? err.message : "Failed to load conversation.",
      });
    }
  },
  startNewConversation: () => set({ activeConversation: null, conversationStatus: "idle" }),
  sendMessage: async (accessToken, text) => {
    set({ sending: true });
    try {
      const activeId = get().activeConversation?.id;
      const result = await sendMessageApi(text, activeId, accessToken);
      await get().openConversation(accessToken, result.conversationId);
      await get().fetchConversations(accessToken);
    } finally {
      set({ sending: false });
    }
  },
  setProposalStatus: (id, status) =>
    set((s) =>
      s.activeConversation
        ? {
            activeConversation: {
              ...s.activeConversation,
              proposals: s.activeConversation.proposals.map((p) =>
                p.id === id ? { ...p, status } : p,
              ),
            },
          }
        : s,
    ),
}));
