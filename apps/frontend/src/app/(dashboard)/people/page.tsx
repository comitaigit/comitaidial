import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getPeople } from "@/features/people/data/people";
import { PeopleTable } from "@/features/people/components/PeopleTable";
import { NewPersonButton } from "@/features/people/components/NewPersonButton";

export const metadata: Metadata = {
  title: "Prospects",
};

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <section>
      <PageHeader
        title="Prospects"
        subtitle="Person é a entidade central; telefone, e-mail e LinkedIn são identificadores."
        actions={
          <>
            <Button>Deduplicação</Button>
            <NewPersonButton />
          </>
        }
      />
      <PeopleTable people={people} />
    </section>
  );
}
