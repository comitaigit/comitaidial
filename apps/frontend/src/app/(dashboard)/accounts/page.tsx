import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAccounts } from "@/features/accounts/data/accounts";
import { AccountsTable } from "@/features/accounts/components/AccountsTable";
import { NewAccountButton } from "@/features/accounts/components/NewAccountButton";
import { ImportAccountsButton } from "@/features/accounts/components/ImportAccountsButton";

export const metadata: Metadata = {
  title: "Accounts",
};

export default async function AccountsPage() {
  const accounts = await getAccounts();

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
      <AccountsTable accounts={accounts} />
    </section>
  );
}
