-- DropForeignKey
ALTER TABLE "calls" DROP CONSTRAINT "calls_personId_fkey";

-- AlterTable
ALTER TABLE "calls" ALTER COLUMN "personId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

