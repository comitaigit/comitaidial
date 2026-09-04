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

function cadencesFor(person: Person): string {
  if (person.cadenceEnrollments.length === 0) return "—";
  return person.cadenceEnrollments.map((e) => e.cadence.name).join(", ");
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
            <Th>Celular</Th>
            <Th>LinkedIn</Th>
            <Th>Nível de influência</Th>
            <Th>Cadências</Th>
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
              <Td>
                {person.phone ? (
                  <a href={`tel:${person.phone}`} className="text-accent hover:underline">
                    {person.phone}
                  </a>
                ) : (
                  "—"
                )}
              </Td>
              <Td>
                {person.linkedinUrl ? (
                  <a
                    href={person.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Perfil
                  </a>
                ) : (
                  "—"
                )}
              </Td>
              <Td>
                {person.influenceLevel ? INFLUENCE_LABEL[person.influenceLevel] : "—"}
              </Td>
              <Td>{cadencesFor(person)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
