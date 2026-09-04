"use client";

import { create } from "zustand";
import {
  listClientCompanies,
  type ClientCompany,
} from "@/features/client-companies/data/client-companies-api";

type ClientCompaniesState = {
  clientCompanies: ClientCompany[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  fetchClientCompanies: (accessToken: string) => Promise<void>;
  addClientCompany: (company: ClientCompany) => void;
  replaceClientCompany: (company: ClientCompany) => void;
  removeClientCompany: (id: string) => void;
};

export const useClientCompaniesStore = create<ClientCompaniesState>((set) => ({
  clientCompanies: [],
  status: "idle",
  error: null,
  fetchClientCompanies: async (accessToken) => {
    set({ status: "loading", error: null });
    try {
      const clientCompanies = await listClientCompanies(accessToken);
      set({ clientCompanies, status: "loaded" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Failed to load client companies.",
      });
    }
  },
  addClientCompany: (company) =>
    set((state) => ({ clientCompanies: [...state.clientCompanies, company] })),
  replaceClientCompany: (company) =>
    set((state) => ({
      clientCompanies: state.clientCompanies.map((c) => (c.id === company.id ? company : c)),
    })),
  removeClientCompany: (id) =>
    set((state) => ({
      clientCompanies: state.clientCompanies.filter((c) => c.id !== id),
    })),
}));
