-- Additive: two new nullable columns (people.hubspotContactId,
-- accounts.hubspotCompanyId) and one new table (hubspot_connections).
-- No data migration needed.

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "hubspotContactId" TEXT;

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "hubspotCompanyId" TEXT;

-- CreateTable
CREATE TABLE "hubspot_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubspot_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hubspot_connections_tenantId_key" ON "hubspot_connections"("tenantId");

-- AddForeignKey
ALTER TABLE "hubspot_connections" ADD CONSTRAINT "hubspot_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
