import Link from "next/link";
import { Card, CardHead, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import type { WorkQueueItem } from "@/features/overview/data/overview";

export function WorkQueueCard({ items }: { items: WorkQueueItem[] }) {
  return (
    <Card>
      <CardHead>
        <CardTitle>Fila de trabalho</CardTitle>
        <Tag variant="info">próxima melhor ação manual</Tag>
      </CardHead>
      <Table>
        <Thead>
          <Tr>
            <Th>Prospect</Th>
            <Th>Conta</Th>
            <Th>Próxima ação</Th>
            <Th>Por quê</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item) => (
            <Tr key={item.name}>
              <Td>
                <Link href={item.goto} className="block">
                  <PersonAvatar
                    initials={item.initials}
                    name={item.name}
                    subtitle={item.role}
                  />
                </Link>
              </Td>
              <Td>{item.account}</Td>
              <Td>
                <Link href={item.goto}>
                  <Tag variant={item.actionVariant}>{item.action}</Tag>
                </Link>
              </Td>
              <Td>{item.reason}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
