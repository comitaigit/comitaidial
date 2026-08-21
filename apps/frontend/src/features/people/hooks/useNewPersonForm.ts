"use client";

import { useEffect, useState } from "react";
import { closeModal } from "@/features/shell/stores/modal-store";
import { useToast } from "@/features/shell/hooks/useToast";
import { useSessionStore } from "@/features/shell/stores/session-store";
import { usePeopleStore } from "@/features/people/stores/people-store";
import {
  createPerson,
  listAccountOptions,
  type AccountOption,
  type InfluenceLevel,
} from "@/features/people/data/people-api";

export function useNewPersonForm() {
  const toast = useToast();
  const accessToken = useSessionStore((s) => s.accessToken);
  const addPerson = usePeopleStore((s) => s.addPerson);

  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [influenceLevel, setInfluenceLevel] = useState<InfluenceLevel | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listAccountOptions(accessToken)
      .then((options) => {
        setAccountOptions(options);
        setAccountId((current) => current || (options[0]?.id ?? ""));
      })
      .catch(() => {
        // The Field select just stays empty; the submit button's accountId
        // guard keeps the form from being submitted without one.
      });
  }, [accessToken]);

  const name = `${firstName.trim()} ${lastName.trim()}`.trim();
  const canSubmit = Boolean(accessToken) && name.length > 0 && accountId.length > 0 && !submitting;

  async function create() {
    if (!accessToken || !canSubmit) return;

    setSubmitting(true);
    try {
      const person = await createPerson(
        {
          accountId,
          name,
          role: role.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          influenceLevel: influenceLevel || undefined,
        },
        accessToken,
      );
      addPerson(person);
      toast("Prospect criado e associado à account.");
      closeModal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível criar o prospect.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    accountOptions,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    accountId,
    setAccountId,
    role,
    setRole,
    phone,
    setPhone,
    email,
    setEmail,
    linkedinUrl,
    setLinkedinUrl,
    influenceLevel,
    setInfluenceLevel,
    submitting,
    canSubmit,
    create,
  };
}
