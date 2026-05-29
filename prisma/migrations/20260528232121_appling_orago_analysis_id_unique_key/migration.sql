/*
  Warnings:

  - A unique constraint covering the columns `[oragoAnalysisId]` on the table `RentalApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RentalApplication" ADD COLUMN "decisionMetadata" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RentalApplicationContest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "adminNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "RentalApplicationContest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RentalApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RentalApplicationContest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RentalApplicationContest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RentalApplicationContest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RentalApplicationContest" ("adminNote", "applicationId", "createdAt", "createdById", "id", "reason", "reviewedAt", "reviewedById", "status", "updatedAt") SELECT "adminNote", "applicationId", "createdAt", "createdById", "id", "reason", "reviewedAt", "reviewedById", "status", "updatedAt" FROM "RentalApplicationContest";
DROP TABLE "RentalApplicationContest";
ALTER TABLE "new_RentalApplicationContest" RENAME TO "RentalApplicationContest";
CREATE INDEX "RentalApplicationContest_applicationId_idx" ON "RentalApplicationContest"("applicationId");
CREATE INDEX "RentalApplicationContest_createdById_idx" ON "RentalApplicationContest"("createdById");
CREATE INDEX "RentalApplicationContest_status_idx" ON "RentalApplicationContest"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RentalApplication_oragoAnalysisId_key" ON "RentalApplication"("oragoAnalysisId");
