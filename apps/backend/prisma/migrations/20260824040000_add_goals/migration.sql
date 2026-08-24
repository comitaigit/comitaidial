-- Purely additive: one new enum, one new table, no data migration needed.

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "GoalPeriod" NOT NULL,
    "callsTarget" INTEGER NOT NULL DEFAULT 0,
    "conversationsTarget" INTEGER NOT NULL DEFAULT 0,
    "dialingMinutesTarget" INTEGER NOT NULL DEFAULT 0,
    "conversationMinutesTarget" INTEGER NOT NULL DEFAULT 0,
    "connectedCallsTarget" INTEGER NOT NULL DEFAULT 0,
    "setByRole" "Role" NOT NULL DEFAULT 'MEMBER',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goals_tenantId_idx" ON "goals"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "goals_userId_period_key" ON "goals"("userId", "period");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
