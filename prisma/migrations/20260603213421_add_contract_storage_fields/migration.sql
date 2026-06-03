-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "storageBucket" TEXT,
ADD COLUMN     "storageDriver" TEXT,
ADD COLUMN     "storageKey" TEXT;
