-- Additive: one new nullable column on cadence_enrollments and one new
-- table (google_accounts) for AI Email's per-BDR Gmail OAuth connection.
-- No data migration needed — pre-existing enrollments simply have no
-- enrolledById until re-enrolled.

-- AlterTable
ALTER TABLE "cadence_enrollments" ADD COLUMN     "enrolledById" TEXT;

-- CreateTable
CREATE TABLE "google_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_accounts_userId_key" ON "google_accounts"("userId");

-- CreateIndex
CREATE INDEX "google_accounts_tenantId_idx" ON "google_accounts"("tenantId");

-- AddForeignKey
ALTER TABLE "cadence_enrollments" ADD CONSTRAINT "cadence_enrollments_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
