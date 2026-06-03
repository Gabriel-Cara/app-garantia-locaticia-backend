/*
  Warnings:

  - A unique constraint covering the columns `[document]` on the table `RentalApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RentalApplication_document_idx";

-- CreateIndex
CREATE UNIQUE INDEX "RentalApplication_document_key" ON "RentalApplication"("document");
