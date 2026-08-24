import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeoplePageContent } from "@/features/people/components/PeoplePageContent";
import { NewPersonButton } from "@/features/people/components/NewPersonButton";
import { ImportPeopleButton } from "@/features/people/components/ImportPeopleButton";

export const metadata: Metadata = {
  title: "Prospects",
};

// Client-fetched — see accounts/page.tsx's comment: /people also requires
// the Bearer access token, which only lives in the client-side session store.
export default function PeoplePage() {
  return (
    <section>
      <PageHeader
        title="Prospects"
        subtitle="Person é a entidade central; telefone, e-mail e LinkedIn são identificadores."
        actions={
          <>
            <ImportPeopleButton />
            <NewPersonButton />
          </>
        }
      />
      <PeoplePageContent />
    </section>
  );
}
