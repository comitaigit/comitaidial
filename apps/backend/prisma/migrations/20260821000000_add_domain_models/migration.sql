-- CreateEnum
CREATE TYPE "AccountPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "InfluenceLevel" AS ENUM ('FINANCIAL_DECISION_MAKER', 'DIRECT_INFLUENCER', 'OPERATIONAL_DECISION_MAKER', 'INDIRECT_INFLUENCER');

-- CreateEnum
CREATE TYPE "CadenceStepType" AS ENUM ('CALL', 'AUTOMATIC_EMAIL', 'MANUAL_EMAIL', 'MANUAL_SMS', 'WHATSAPP_MESSAGE', 'ACTION_ITEM', 'LINKEDIN_CONNECTION_REQUEST', 'LINKEDIN_MESSAGE');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('NO_ANSWER', 'VOICEMAIL', 'CONVERSATION_NO_PROGRESS', 'QUALIFIED_OBJECTION', 'CALLBACK_SCHEDULED', 'MEETING_SCHEDULED', 'INVALID_NUMBER', 'NOT_DECISION_MAKER');

-- CreateEnum
CREATE TYPE "SignalCategory" AS ENUM ('PERSON', 'COMPANY', 'ENGAGEMENT', 'AI_INTERPRETATION');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL_PLACED', 'OUTCOME_RECORDED', 'CADENCE_STEP_ADVANCED', 'FIELD_EDITED', 'EMAIL_SENT', 'WHATSAPP_MESSAGE_SENT', 'LINKEDIN_ACTION');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "segment" TEXT,
    "priority" "AccountPriority",
    "pain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "influenceLevel" "InfluenceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_steps" (
    "id" TEXT NOT NULL,
    "cadenceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "dayOffset" INTEGER NOT NULL,
    "type" "CadenceStepType" NOT NULL,
    "waitForConnectionAccepted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "cadence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_enrollments" (
    "id" TEXT NOT NULL,
    "cadenceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "currentStepOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cadence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "twilioCallSid" TEXT,
    "toNumber" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "outcome" "CallOutcome",
    "durationSeconds" INTEGER,
    "isConversation" BOOLEAN NOT NULL DEFAULT false,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "category" "SignalCategory" NOT NULL,
    "subtype" TEXT NOT NULL,
    "accountId" TEXT,
    "personId" TEXT,
    "summary" TEXT NOT NULL,
    "source" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "accountId" TEXT,
    "personId" TEXT,
    "userId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_domain_key" ON "accounts"("domain");

-- CreateIndex
CREATE INDEX "people_accountId_idx" ON "people"("accountId");

-- CreateIndex
CREATE INDEX "cadence_steps_cadenceId_idx" ON "cadence_steps"("cadenceId");

-- CreateIndex
CREATE UNIQUE INDEX "cadence_steps_cadenceId_order_key" ON "cadence_steps"("cadenceId", "order");

-- CreateIndex
CREATE INDEX "cadence_enrollments_personId_idx" ON "cadence_enrollments"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "cadence_enrollments_cadenceId_personId_key" ON "cadence_enrollments"("cadenceId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "calls_twilioCallSid_key" ON "calls"("twilioCallSid");

-- CreateIndex
CREATE INDEX "calls_personId_idx" ON "calls"("personId");

-- CreateIndex
CREATE INDEX "signals_accountId_idx" ON "signals"("accountId");

-- CreateIndex
CREATE INDEX "signals_personId_idx" ON "signals"("personId");

-- CreateIndex
CREATE INDEX "activities_accountId_idx" ON "activities"("accountId");

-- CreateIndex
CREATE INDEX "activities_personId_idx" ON "activities"("personId");

-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_steps" ADD CONSTRAINT "cadence_steps_cadenceId_fkey" FOREIGN KEY ("cadenceId") REFERENCES "cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_enrollments" ADD CONSTRAINT "cadence_enrollments_cadenceId_fkey" FOREIGN KEY ("cadenceId") REFERENCES "cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_enrollments" ADD CONSTRAINT "cadence_enrollments_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

