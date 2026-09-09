-- Additive: one new table (account_discovery_jobs) for AI Prospecting
-- variant B (new-Account discovery via lookalike). Reuses the
-- EnrichmentProviderName/EnrichmentJobStatus enums added in
-- 20260909110000_add_enrichment. No data migration needed.

-- CreateTable
CREATE TABLE "account_discovery_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "seedAccountIds" TEXT[] NOT NULL,
    "provider" "EnrichmentProviderName" NOT NULL,
    "status" "EnrichmentJobStatus" NOT NULL,
    "creditsCharged" INTEGER NOT NULL DEFAULT 0,
    "createdAccountIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_discovery_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_discovery_jobs_tenantId_idx" ON "account_discovery_jobs"("tenantId");

-- AddForeignKey
ALTER TABLE "account_discovery_jobs" ADD CONSTRAINT "account_discovery_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
