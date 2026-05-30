-- CreateTable
CREATE TABLE "RealEstateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "phone" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RealEstateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateProfile_userId_key" ON "RealEstateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateProfile_cnpj_key" ON "RealEstateProfile"("cnpj");
