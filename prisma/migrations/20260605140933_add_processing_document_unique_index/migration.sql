-- CreateIndex
CREATE INDEX IF NOT EXISTS "OragoConsultLock_document_idx"
ON "OragoConsultLock"("document");

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OragoConsultLock_processing_document_unique"
ON "OragoConsultLock"("document")
WHERE "status" = 'PROCESSING';