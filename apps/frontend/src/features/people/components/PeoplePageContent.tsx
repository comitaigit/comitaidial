"use client";

import { PeopleTable } from "@/features/people/components/PeopleTable";
import { BulkActionsBar } from "@/features/people/components/BulkActionsBar";
import { usePeoplePage } from "@/features/people/hooks/usePeoplePage";
import { usePeopleSelection } from "@/features/people/hooks/usePeopleSelection";

export function PeoplePageContent() {
  const { people, isLoading, error } = usePeoplePage();
  const { selectedIds, toggle, selectAll, clear } = usePeopleSelection();

  if (isLoading) return <p className="text-sm text-muted">Carregando prospects…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;

  const allSelected = people.length > 0 && selectedIds.size === people.length;

  return (
    <>
      {selectedIds.size > 0 && (
        <BulkActionsBar selectedIds={Array.from(selectedIds)} onDone={clear} />
      )}
      <PeopleTable
        people={people}
        selectedIds={selectedIds}
        onToggle={toggle}
        onToggleAll={() => (allSelected ? clear() : selectAll(people.map((p) => p.id)))}
      />
    </>
  );
}
