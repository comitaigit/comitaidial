-- Additive: one new column on tenants (credit balance, defaults to 0 so no
-- existing tenant gets free credits), two new enums, and one new table
-- (enrichment_jobs). No data migration needed.

-- CreateEnum
CREATE TYPE "EnrichmentProviderName" AS ENUM ('LUSHA');

-- CreateEnum
CREATE TYPE "EnrichmentJobStatus" AS ENUM ('SUCCESS', 'NO_MATCH', 'FAILED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "enrichmentCreditBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "enrichment_jobs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT,
    "accountId" TEXT,
    "provider" "EnrichmentProviderName" NOT NULL,
    "status" "EnrichmentJobStatus" NOT NULL,
    "creditsCharged" INTEGER NOT NULL DEFAULT 0,
    "fieldsFilled" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrichment_jobs_tenantId_idx" ON "enrichment_jobs"("tenantId");

-- CreateIndex
CREATE INDEX "enrichment_jobs_personId_idx" ON "enrichment_jobs"("personId");

-- CreateIndex
CREATE INDEX "enrichment_jobs_accountId_idx" ON "enrichment_jobs"("accountId");

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
