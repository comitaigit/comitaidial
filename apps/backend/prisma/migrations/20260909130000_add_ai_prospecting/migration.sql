-- Additive: one new column on client_companies (ICP target roles, defaults
-- to an empty array so prospecting stays gated off until configured) and
-- one new table (prospecting_jobs), reusing the EnrichmentProviderName and
-- EnrichmentJobStatus enums added in 20260909110000_add_enrichment. No
-- data migration needed.

-- AlterTable
ALTER TABLE "client_companies" ADD COLUMN     "targetRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "prospecting_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "provider" "EnrichmentProviderName" NOT NULL,
    "status" "EnrichmentJobStatus" NOT NULL,
    "creditsCharged" INTEGER NOT NULL DEFAULT 0,
    "personId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospecting_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospecting_jobs_tenantId_idx" ON "prospecting_jobs"("tenantId");

-- CreateIndex
CREATE INDEX "prospecting_jobs_accountId_idx" ON "prospecting_jobs"("accountId");

-- AddForeignKey
ALTER TABLE "prospecting_jobs" ADD CONSTRAINT "prospecting_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_jobs" ADD CONSTRAINT "prospecting_jobs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_jobs" ADD CONSTRAINT "prospecting_jobs_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospecting_jobs" ADD CONSTRAINT "prospecting_jobs_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
