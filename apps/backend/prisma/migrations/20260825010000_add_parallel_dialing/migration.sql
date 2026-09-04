-- Additive: one new enum, one new table, three new nullable/defaulted
-- columns on calls. No data migration needed.

-- CreateEnum
CREATE TYPE "ParallelLegStatus" AS ENUM ('RINGING', 'MACHINE_DETECTED', 'NO_ANSWER', 'BUSY', 'FAILED', 'CONNECTED', 'ABANDONED');

-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "abandonedByParallelDial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dialBatchId" TEXT,
ADD COLUMN     "parallelLegStatus" "ParallelLegStatus";

-- CreateTable
CREATE TABLE "dial_batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cadenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conferenceName" TEXT NOT NULL,
    "winnerCallSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dial_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dial_batches_conferenceName_key" ON "dial_batches"("conferenceName");

-- CreateIndex
CREATE INDEX "dial_batches_tenantId_idx" ON "dial_batches"("tenantId");

-- CreateIndex
CREATE INDEX "dial_batches_cadenceId_idx" ON "dial_batches"("cadenceId");

-- CreateIndex
CREATE INDEX "calls_dialBatchId_idx" ON "calls"("dialBatchId");

-- AddForeignKey
ALTER TABLE "dial_batches" ADD CONSTRAINT "dial_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dial_batches" ADD CONSTRAINT "dial_batches_cadenceId_fkey" FOREIGN KEY ("cadenceId") REFERENCES "cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dial_batches" ADD CONSTRAINT "dial_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_dialBatchId_fkey" FOREIGN KEY ("dialBatchId") REFERENCES "dial_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
