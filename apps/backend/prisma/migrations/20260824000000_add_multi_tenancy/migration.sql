-- Multi-tenancy foundation. Adds a Tenant table and scopes every domain
-- table to it. Existing rows (all of them Comitai's own dev/testing data)
-- are backfilled onto a single bootstrap tenant via a column DEFAULT, which
-- is dropped immediately after so every future insert must specify a real
-- tenantId explicitly instead of silently inheriting the bootstrap one.

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Bootstrap tenant: every row that exists before this migration belongs to
-- Comitai's own workspace. Fixed id so this migration is idempotent-safe to
-- read back (not so it's safe to re-run — Prisma migrations never are).
INSERT INTO "tenants" ("id", "name", "createdAt", "updatedAt")
VALUES ('c8977d13-3d26-472d-864d-502f6786690f', 'Comitai', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: backfill existing rows onto the bootstrap tenant via DEFAULT,
-- then drop the DEFAULT so new rows must specify tenantId explicitly.
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "users" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "accounts" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "accounts" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "people" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "people" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "cadences" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "cadences" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "cadence_steps" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "cadence_steps" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "cadence_enrollments" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "cadence_enrollments" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "calls" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "calls" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "signals" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "signals" ALTER COLUMN "tenantId" DROP DEFAULT;

ALTER TABLE "activities" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'c8977d13-3d26-472d-864d-502f6786690f';
ALTER TABLE "activities" ALTER COLUMN "tenantId" DROP DEFAULT;

-- DropIndex: accounts.domain was globally unique — replaced by a per-tenant
-- unique constraint below, since two unrelated tenants can legitimately
-- prospect the same real-world company/domain.
DROP INDEX "accounts_domain_key";

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "accounts_tenantId_idx" ON "accounts"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_tenantId_domain_key" ON "accounts"("tenantId", "domain");

-- CreateIndex
CREATE INDEX "people_tenantId_idx" ON "people"("tenantId");

-- CreateIndex
CREATE INDEX "cadences_tenantId_idx" ON "cadences"("tenantId");

-- CreateIndex
CREATE INDEX "cadence_steps_tenantId_idx" ON "cadence_steps"("tenantId");

-- CreateIndex
CREATE INDEX "cadence_enrollments_tenantId_idx" ON "cadence_enrollments"("tenantId");

-- CreateIndex
CREATE INDEX "calls_tenantId_idx" ON "calls"("tenantId");

-- CreateIndex
CREATE INDEX "signals_tenantId_idx" ON "signals"("tenantId");

-- CreateIndex
CREATE INDEX "activities_tenantId_idx" ON "activities"("tenantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadences" ADD CONSTRAINT "cadences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_steps" ADD CONSTRAINT "cadence_steps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_enrollments" ADD CONSTRAINT "cadence_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
