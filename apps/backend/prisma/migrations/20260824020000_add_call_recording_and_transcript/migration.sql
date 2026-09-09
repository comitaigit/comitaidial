-- Purely additive: two nullable columns on an existing table, no data
-- migration needed.

-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "transcript" JSONB;
