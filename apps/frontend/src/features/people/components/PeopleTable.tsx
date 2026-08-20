import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import type { Person } from "@/features/people/data/people";

export function PeopleTable({ people }: { people: Person[] }) {
  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Prospect</Th>
            <Th>Conta</Th>
            <Th>Identificadores</Th>
            <Th>Nível de decisão</Th>
            <Th>Cadência</Th>
            <Th>Último outcome</Th>
          </Tr>
        </Thead>
        <Tbody>
          {people.map((person) => (
            <Tr key={person.name}>
              <Td>
                <PersonAvatar initials={person.initials} name={person.name} subtitle={person.role} />
              </Td>
              <Td>{person.account}</Td>
              <Td>{person.identifiers}</Td>
              <Td>{person.decisionLevel}</Td>
              <Td>
                <Tag variant={person.sequenceVariant}>{person.sequence}</Tag>
              </Td>
              <Td>{person.lastOutcome}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
