import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
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

export function AccountsTable({ accounts }: { accounts: Account[] }) {
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
          </Tr>
        </Thead>
        <Tbody>
          {accounts.map((account) => (
            <Tr key={account.id} clickable>
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
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
