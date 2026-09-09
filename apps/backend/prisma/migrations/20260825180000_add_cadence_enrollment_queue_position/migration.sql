-- Purely additive: one new nullable column, no data migration needed.

-- AlterTable
ALTER TABLE "cadence_enrollments" ADD COLUMN     "queuePosition" INTEGER;
