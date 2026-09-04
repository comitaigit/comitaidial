-- Purely additive: two nullable columns + one index/FK on an existing
-- table, no data migration needed.

-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "aiFeedback" JSONB,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "calls_userId_idx" ON "calls"("userId");

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
