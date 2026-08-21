import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountsPageContent } from "@/features/accounts/components/AccountsPageContent";
import { NewAccountButton } from "@/features/accounts/components/NewAccountButton";
import { ImportAccountsButton } from "@/features/accounts/components/ImportAccountsButton";

export const metadata: Metadata = {
  title: "Accounts",
};

// Client-fetched, not server-fetched: /accounts requires the Bearer access
// token, which only ever lives in the client-side session store (never a
// cookie the server could read) — see accounts-api.ts's header comment.
export default function AccountsPage() {
  return (
    <section>
      <PageHeader
        title="Accounts"
        subtitle="Contexto de IA é pesquisado e cacheado no nível da conta."
        actions={
          <>
            <ImportAccountsButton />
            <NewAccountButton />
          </>
        }
      />
      <AccountsPageContent />
    </section>
  );
}
