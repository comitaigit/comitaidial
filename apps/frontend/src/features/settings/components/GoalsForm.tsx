"use client";

import { Card, CardHead, CardTitle, CardBody } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useGoalsForm } from "@/features/settings/hooks/useGoalsForm";

export function GoalsForm() {
  const {
    isLoading,
    isLockedByManager,
    callsTarget,
    setCallsTarget,
    conversationsTarget,
    setConversationsTarget,
    dialingMinutesTarget,
    setDialingMinutesTarget,
    conversationMinutesTarget,
    setConversationMinutesTarget,
    connectedCallsTarget,
    setConnectedCallsTarget,
    saving,
    save,
  } = useGoalsForm();

  return (
    <Card>
      <CardHead>
        <CardTitle>Metas semanais</CardTitle>
      </CardHead>
      <CardBody>
        {isLoading ? (
          <p className="text-sm text-muted">Carregando metas…</p>
        ) : (
          <>
            {isLockedByManager ? (
              <p className="mb-3 rounded-lg border border-dashed border-[#fedf89] bg-[#fffaeb] p-2.5 text-xs">
                Esta meta foi definida por um gestor. Apenas um gestor pode alterá-la.
              </p>
            ) : null}
            <Field label="Chamadas semanais">
              <Input
                type="number"
                min={0}
                value={callsTarget}
                disabled={isLockedByManager}
                onChange={(e) => setCallsTarget(e.target.value)}
              />
            </Field>
            <Field label="Conversas semanais">
              <Input
                type="number"
                min={0}
                value={conversationsTarget}
                disabled={isLockedByManager}
                onChange={(e) => setConversationsTarget(e.target.value)}
              />
            </Field>
            <Field label="Tempo em discagem semanal (min)">
              <Input
                type="number"
                min={0}
                value={dialingMinutesTarget}
                disabled={isLockedByManager}
                onChange={(e) => setDialingMinutesTarget(e.target.value)}
              />
            </Field>
            <Field label="Tempo em conversas semanal (min)">
              <Input
                type="number"
                min={0}
                value={conversationMinutesTarget}
                disabled={isLockedByManager}
                onChange={(e) => setConversationMinutesTarget(e.target.value)}
              />
            </Field>
            <Field label="Total de chamadas conectadas">
              <Input
                type="number"
                min={0}
                value={connectedCallsTarget}
                disabled={isLockedByManager}
                onChange={(e) => setConnectedCallsTarget(e.target.value)}
              />
            </Field>
            <Button
              variant="primary"
              onClick={save}
              disabled={isLockedByManager || saving}
            >
              {saving ? "Salvando…" : "Salvar metas"}
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
