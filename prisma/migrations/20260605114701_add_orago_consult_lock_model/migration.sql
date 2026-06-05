-- CreateEnum
CREATE TYPE "OragoConsultStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "OragoConsultLock" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "document" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "oragoAnalysisId" TEXT,
    "status" "OragoConsultStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OragoConsultLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OragoConsultLock_document_key" ON "OragoConsultLock"("document");

-- CreateIndex
CREATE UNIQUE INDEX "OragoConsultLock_oragoAnalysisId_key" ON "OragoConsultLock"("oragoAnalysisId");

-- CreateIndex
CREATE INDEX "OragoConsultLock_requesterId_idx" ON "OragoConsultLock"("requesterId");

-- CreateIndex
CREATE INDEX "OragoConsultLock_status_idx" ON "OragoConsultLock"("status");
