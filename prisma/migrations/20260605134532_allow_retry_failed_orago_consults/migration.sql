-- DropIndex
DROP INDEX "OragoConsultLock_document_key";

-- AddForeignKey
ALTER TABLE "OragoConsultLock" ADD CONSTRAINT "OragoConsultLock_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
