import { Card } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import type { InfluenceLevel, Person } from "@/features/people/data/people-api";

const INFLUENCE_LABEL: Record<InfluenceLevel, string> = {
  FINANCIAL_DECISION_MAKER: "Decisor financeiro",
  DIRECT_INFLUENCER: "Influenciador direto",
  OPERATIONAL_DECISION_MAKER: "Decisor operacional",
  INDIRECT_INFLUENCER: "Influenciador indireto",
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function identifiersFor(person: Person): string {
  const parts: string[] = [];
  if (person.phone) parts.push("☎");
  if (person.email) parts.push("@");
  if (person.linkedinUrl) parts.push("in");
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function PeopleTable({
  people,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  people: Person[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const allSelected = people.length > 0 && selectedIds.size === people.length;

  return (
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Selecionar todos"
              />
            </Th>
            <Th>Prospect</Th>
            <Th>Conta</Th>
            <Th>Identificadores</Th>
            <Th>Nível de influência</Th>
          </Tr>
        </Thead>
        <Tbody>
          {people.map((person) => (
            <Tr key={person.id}>
              <Td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(person.id)}
                  onChange={() => onToggle(person.id)}
                  aria-label={`Selecionar ${person.name}`}
                />
              </Td>
              <Td>
                <PersonAvatar
                  initials={initialsFrom(person.name)}
                  name={person.name}
                  subtitle={person.role ?? undefined}
                />
              </Td>
              <Td>{person.account.name}</Td>
              <Td>{identifiersFor(person)}</Td>
              <Td>
                {person.influenceLevel ? INFLUENCE_LABEL[person.influenceLevel] : "—"}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
