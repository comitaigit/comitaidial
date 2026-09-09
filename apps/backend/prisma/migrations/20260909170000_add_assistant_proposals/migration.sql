-- Additive: two new enums and one new table (assistant_proposals) for the
-- Assistant's proposal tools (item 7). No data migration needed.

-- CreateEnum
CREATE TYPE "AssistantProposalType" AS ENUM ('ENROLL_IN_CADENCE', 'SEND_EMAIL', 'ENRICH_PERSON');

-- CreateEnum
CREATE TYPE "AssistantProposalStatus" AS ENUM ('PENDING', 'REJECTED', 'EXECUTED', 'FAILED');

-- CreateTable
CREATE TABLE "assistant_proposals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AssistantProposalType" NOT NULL,
    "status" "AssistantProposalStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "assistant_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_proposals_tenantId_idx" ON "assistant_proposals"("tenantId");

-- CreateIndex
CREATE INDEX "assistant_proposals_conversationId_idx" ON "assistant_proposals"("conversationId");

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_proposals" ADD CONSTRAINT "assistant_proposals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
