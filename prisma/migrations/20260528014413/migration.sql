/*
  Warnings:

  - You are about to drop the `Analysis` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Analysis";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "UserCreditWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "availableCredits" INTEGER NOT NULL DEFAULT 3,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCreditWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditLedger_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RentalApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentType" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "oragoAnalysisId" TEXT,
    "oragoRawResponse" TEXT,
    "oragoData" TEXT,
    "products" TEXT,
    "rentValue" DECIMAL NOT NULL,
    "condominiumValue" DECIMAL NOT NULL,
    "feesValue" DECIMAL NOT NULL,
    "requestedExpense" DECIMAL NOT NULL,
    "automaticDecision" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "housingExpenseMin" DECIMAL,
    "housingExpenseMax" DECIMAL,
    "decisionReasons" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONSULTED',
    "tenantName" TEXT,
    "tenantDocument" TEXT,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "propertyZipCode" TEXT,
    "propertyStreet" TEXT,
    "propertyNumber" TEXT,
    "propertyComplement" TEXT,
    "propertyNeighborhood" TEXT,
    "propertyCity" TEXT,
    "propertyState" TEXT,
    "adminDecision" TEXT,
    "adminDecisionById" TEXT,
    "adminDecisionAt" DATETIME,
    "adminDecisionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentalApplication_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RentalApplication_adminDecisionById_fkey" FOREIGN KEY ("adminDecisionById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RentalApplicationContest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentalApplicationContest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "templateName" TEXT NOT NULL,
    "filePath" TEXT,
    "fileName" TEXT,
    "generatedById" TEXT,
    "errorMessage" TEXT,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCreditWallet_userId_key" ON "UserCreditWallet"("userId");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_idx" ON "CreditLedger"("userId");

-- CreateIndex
CREATE INDEX "CreditLedger_actorId_idx" ON "CreditLedger"("actorId");

-- CreateIndex
CREATE INDEX "RentalApplication_requesterId_idx" ON "RentalApplication"("requesterId");

-- CreateIndex
CREATE INDEX "RentalApplication_document_idx" ON "RentalApplication"("document");

-- CreateIndex
CREATE INDEX "RentalApplication_status_idx" ON "RentalApplication"("status");

-- CreateIndex
CREATE INDEX "RentalApplication_automaticDecision_idx" ON "RentalApplication"("automaticDecision");

-- CreateIndex
CREATE INDEX "RentalApplicationContest_applicationId_idx" ON "RentalApplicationContest"("applicationId");

-- CreateIndex
CREATE INDEX "RentalApplicationContest_createdById_idx" ON "RentalApplicationContest"("createdById");

-- CreateIndex
CREATE INDEX "RentalApplicationContest_status_idx" ON "RentalApplicationContest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_applicationId_key" ON "Contract"("applicationId");
