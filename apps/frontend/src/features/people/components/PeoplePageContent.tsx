"use client";

import { PeopleTable } from "@/features/people/components/PeopleTable";
import { usePeoplePage } from "@/features/people/hooks/usePeoplePage";

export function PeoplePageContent() {
  const { people, isLoading, error } = usePeoplePage();

  if (isLoading) return <p className="text-sm text-muted">Carregando prospects…</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;

  return <PeopleTable people={people} />;
}
