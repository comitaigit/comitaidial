-- Additive: three new enums, one new column on cadences, two new nullable
-- columns on cadence_steps, and three new tables (prospect_events,
-- step_executions, actions) for the Play Engine. No data migration needed.

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('MANUAL', 'FULL');

-- CreateEnum
CREATE TYPE "StepExecutionStatus" AS ENUM ('PENDING', 'WAITING_EVENT', 'READY', 'EXECUTING', 'DONE', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SEND_EMAIL', 'LINKEDIN_CONNECT', 'LINKEDIN_MESSAGE', 'ENRICH');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'PENDING_APPROVAL', 'SENT', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "cadences" ADD COLUMN     "approvalMode" "ApprovalMode" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "cadence_steps" ADD COLUMN     "triggerConfig" JSONB,
ADD COLUMN     "actionConfig" JSONB;

-- CreateTable
CREATE TABLE "prospect_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "personId" TEXT,
    "accountId" TEXT,
    "source" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_executions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "cadenceStepId" TEXT NOT NULL,
    "status" "StepExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "waitingForEvent" TEXT,
    "executedAt" TIMESTAMP(3),
    "outcome" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "personId" TEXT NOT NULL,
    "stepExecutionId" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospect_events_tenantId_processedAt_idx" ON "prospect_events"("tenantId", "processedAt");

-- CreateIndex
CREATE INDEX "prospect_events_personId_idx" ON "prospect_events"("personId");

-- CreateIndex
CREATE INDEX "prospect_events_accountId_idx" ON "prospect_events"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "step_executions_enrollmentId_cadenceStepId_key" ON "step_executions"("enrollmentId", "cadenceStepId");

-- CreateIndex
CREATE INDEX "step_executions_tenantId_status_scheduledFor_idx" ON "step_executions"("tenantId", "status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "actions_idempotencyKey_key" ON "actions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "actions_tenantId_status_idx" ON "actions"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "prospect_events" ADD CONSTRAINT "prospect_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_events" ADD CONSTRAINT "prospect_events_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_events" ADD CONSTRAINT "prospect_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_executions" ADD CONSTRAINT "step_executions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_executions" ADD CONSTRAINT "step_executions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "cadence_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_executions" ADD CONSTRAINT "step_executions_cadenceStepId_fkey" FOREIGN KEY ("cadenceStepId") REFERENCES "cadence_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_stepExecutionId_fkey" FOREIGN KEY ("stepExecutionId") REFERENCES "step_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
