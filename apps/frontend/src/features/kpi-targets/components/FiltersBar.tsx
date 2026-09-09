import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import type { AccountOption, CallOutcome } from "@/features/kpi-targets/data/goals-api";

const OUTCOME_LABEL: Record<CallOutcome, string> = {
  VOICEMAIL: "Caixa postal",
  WRONG_PERSON: "Pessoa errada",
  BUSY: "Ocupado",
  NO_ANSWER: "Não atendeu",
  INVALID_NUMBER: "Não existe",
  CALLBACK_REQUESTED: "Solicitou retorno",
  MEETING_SCHEDULED: "Agendado",
  NOT_INTERESTED: "Sem interesse",
};

export function FiltersBar({
  from,
  to,
  accountId,
  outcome,
  userId,
  accounts,
  users,
  onFromChange,
  onToChange,
  onAccountChange,
  onOutcomeChange,
  onUserChange,
}: {
  from: string;
  to: string;
  accountId: string;
  outcome: CallOutcome | "";
  userId: string;
  accounts: AccountOption[];
  users: { id: string; name: string }[];
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onAccountChange: (v: string) => void;
  onOutcomeChange: (v: CallOutcome | "") => void;
  onUserChange: (v: string) => void;
}) {
  return (
    <Card padded>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Field label="De">
          <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
        </Field>
        <Field label="Até">
          <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
        </Field>
        <Field label="Conta">
          <Select value={accountId} onChange={(e) => onAccountChange(e.target.value)}>
            <option value="">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Outcome">
          <Select
            value={outcome}
            onChange={(e) => onOutcomeChange(e.target.value as CallOutcome | "")}
          >
            <option value="">Todos</option>
            {Object.entries(OUTCOME_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Usuário">
          <Select value={userId} onChange={(e) => onUserChange(e.target.value)}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Card>
  );
}
