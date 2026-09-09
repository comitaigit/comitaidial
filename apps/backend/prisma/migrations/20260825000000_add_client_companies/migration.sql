-- Additive: one new table, two new nullable columns, and swapping
-- account_research's uniqueness from (accountId) alone to
-- (accountId, clientCompanyId) — no rows are dropped or modified, only the
-- uniqueness constraint changes shape.

-- DropIndex
DROP INDEX "account_research_accountId_key";

-- AlterTable
ALTER TABLE "cadences" ADD COLUMN     "clientCompanyId" TEXT;

-- AlterTable
ALTER TABLE "account_research" ADD COLUMN     "clientCompanyId" TEXT;

-- CreateTable
CREATE TABLE "client_companies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainProduct" TEXT NOT NULL,
    "positioning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_companies_tenantId_idx" ON "client_companies"("tenantId");

-- CreateIndex
CREATE INDEX "cadences_clientCompanyId_idx" ON "cadences"("clientCompanyId");

-- CreateIndex
CREATE INDEX "account_research_clientCompanyId_idx" ON "account_research"("clientCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "account_research_accountId_clientCompanyId_key" ON "account_research"("accountId", "clientCompanyId");

-- AddForeignKey
ALTER TABLE "client_companies" ADD CONSTRAINT "client_companies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadences" ADD CONSTRAINT "cadences_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_research" ADD CONSTRAINT "account_research_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
