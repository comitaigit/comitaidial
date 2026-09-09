-- Dialer v2 (Dial spec, founder 2026-08-24): new CallOutcome set, Task,
-- SuppressedNumber, AccountResearch. Everything here is additive except the
-- CallOutcome enum swap — see the explicit UPDATE below for what that costs.

-- CreateEnum
CREATE TYPE "NotInterestedReason" AS ENUM ('BUDGET', 'NOT_INTERESTED', 'PRODUCT_FEEDBACK', 'USES_COMPETITOR', 'DOES_NOT_WANT_TO_TALK');

-- CreateEnum
CREATE TYPE "TaskChannel" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'LINKEDIN');

-- AlterEnum: CallOutcome's value set is replaced entirely (old and new
-- names don't overlap except NO_ANSWER/INVALID_NUMBER/MEETING_SCHEDULED).
-- A row whose outcome is one of the dropped values (CONVERSATION_NO_PROGRESS,
-- QUALIFIED_OBJECTION, CALLBACK_SCHEDULED, NOT_DECISION_MAKER) has no
-- equivalent in the new set, so it's nulled out here rather than left to
-- fail the type cast below. This only clears the `outcome` classification
-- on existing dev/test Call rows — the rows themselves, and every other
-- table, are untouched.
BEGIN;
UPDATE "calls"
SET "outcome" = NULL
WHERE "outcome"::text NOT IN (
  'VOICEMAIL', 'WRONG_PERSON', 'BUSY', 'NO_ANSWER', 'INVALID_NUMBER',
  'CALLBACK_REQUESTED', 'MEETING_SCHEDULED', 'NOT_INTERESTED'
);
CREATE TYPE "CallOutcome_new" AS ENUM ('VOICEMAIL', 'WRONG_PERSON', 'BUSY', 'NO_ANSWER', 'INVALID_NUMBER', 'CALLBACK_REQUESTED', 'MEETING_SCHEDULED', 'NOT_INTERESTED');
ALTER TABLE "calls" ALTER COLUMN "outcome" TYPE "CallOutcome_new" USING ("outcome"::text::"CallOutcome_new");
ALTER TYPE "CallOutcome" RENAME TO "CallOutcome_old";
ALTER TYPE "CallOutcome_new" RENAME TO "CallOutcome";
DROP TYPE "CallOutcome_old";
COMMIT;

-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "notInterestedReason" "NotInterestedReason";

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sourceCallId" TEXT,
    "channel" "TaskChannel" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppressed_numbers" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "reason" TEXT,
    "suppressedByTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppressed_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_research" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyOverview" TEXT NOT NULL,
    "roleImportance" TEXT NOT NULL,
    "roleIndicators" TEXT NOT NULL,
    "callScript" TEXT NOT NULL,
    "objections" JSONB NOT NULL,
    "battlecards" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_research_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_tenantId_idx" ON "tasks"("tenantId");

-- CreateIndex
CREATE INDEX "tasks_personId_idx" ON "tasks"("personId");

-- CreateIndex
CREATE INDEX "tasks_accountId_idx" ON "tasks"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "suppressed_numbers_phoneNumber_key" ON "suppressed_numbers"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "account_research_accountId_key" ON "account_research"("accountId");

-- CreateIndex
CREATE INDEX "account_research_tenantId_idx" ON "account_research"("tenantId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sourceCallId_fkey" FOREIGN KEY ("sourceCallId") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_research" ADD CONSTRAINT "account_research_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_research" ADD CONSTRAINT "account_research_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
