import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type { Account } from "@/features/accounts/data/accounts";

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Conta</Th>
            <Th>Segmento</Th>
            <Th>Prospects</Th>
            <Th>Contexto IA</Th>
            <Th>Última interação</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {accounts.map((account) => (
            <Tr key={account.name} clickable>
              <Td>
                <b>{account.name}</b>
                <div className="text-[13px] text-muted">{account.domain}</div>
              </Td>
              <Td>{account.segment}</Td>
              <Td>{account.prospects}</Td>
              <Td>
                <Tag variant={account.contextVariant}>
                  {account.contextStatus}
                </Tag>
              </Td>
              <Td>{account.lastInteraction}</Td>
              <Td>
                {account.statusVariant === "warn" ? (
                  <Tag variant="warn">{account.status}</Tag>
                ) : (
                  account.status
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
