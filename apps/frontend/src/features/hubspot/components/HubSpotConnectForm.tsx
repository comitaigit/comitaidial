"use client";

import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useHubSpotConnectForm } from "@/features/hubspot/hooks/useHubSpotConnectForm";

export function HubSpotConnectForm() {
  const { token, setToken, submitting, canSubmit, submit } = useHubSpotConnectForm();

  return (
    <>
      <Field label="Private App Access Token">
        <Input
          type="password"
          placeholder="pat-na1-…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </Field>
      <div className="rounded-[9px] border border-dashed border-[#a6b1c1] bg-[#fafbfc] p-2.5 text-xs leading-relaxed">
        Gere um Private App token no HubSpot (Configurações → Integrações → Private
        Apps) com escopo de leitura de contacts e companies. Somente leitura — o
        Comitai nunca escreve de volta no HubSpot.
      </div>
      <Button variant="primary" className="mt-3 w-full" onClick={submit} disabled={!canSubmit}>
        {submitting ? "Conectando…" : "Conectar HubSpot"}
      </Button>
    </>
  );
}
