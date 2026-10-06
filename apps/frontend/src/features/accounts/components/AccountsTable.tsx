import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import type { Account, AccountPriority } from "@/features/accounts/data/accounts-api";

const PRIORITY_LABEL: Record<AccountPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

const PRIORITY_VARIANT: Record<AccountPriority, "bad" | "warn" | "default"> = {
  HIGH: "bad",
  MEDIUM: "warn",
  LOW: "default",
};

export function AccountsTable({
  accounts,
  busyId,
  onEnrich,
  onFindContact,
}: {
  accounts: Account[];
  busyId: string | null;
  onEnrich: (account: Account) => void;
  onFindContact: (account: Account) => void;
}) {
  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Conta</Th>
            <Th>Segmento</Th>
            <Th>Prospects</Th>
            <Th>Prioridade</Th>
            <Th>Dor</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {accounts.map((account) => (
            <Tr key={account.id}>
              <Td>
                <b>{account.name}</b>
                {account.domain && (
                  <div className="text-[13px] text-muted">{account.domain}</div>
                )}
              </Td>
              <Td>{account.segment ?? "—"}</Td>
              <Td>{account._count.people}</Td>
              <Td>
                {account.priority ? (
                  <Tag variant={PRIORITY_VARIANT[account.priority]}>
                    {PRIORITY_LABEL[account.priority]}
                  </Tag>
                ) : (
                  "—"
                )}
              </Td>
              <Td>{account.pain ?? "Não mapeada"}</Td>
              <Td>
                <div className="flex gap-1.5">
                  <Button
                    size="small"
                    disabled={busyId === account.id}
                    onClick={() => onEnrich(account)}
                  >
                    Enriquecer
                  </Button>
                  <Button size="small" onClick={() => onFindContact(account)}>
                    Buscar contato
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
