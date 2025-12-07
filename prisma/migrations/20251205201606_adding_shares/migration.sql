-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wrappedFileKey" TEXT NOT NULL,
    "keyWrapIv" TEXT NOT NULL,
    "keyDerivationSalt" TEXT NOT NULL,
    "argon2MemorySize" INTEGER NOT NULL,
    "argon2Iterations" INTEGER NOT NULL,
    "argon2Parallelism" INTEGER NOT NULL,
    "argon2HashLength" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shares_fileId_idx" ON "shares"("fileId");

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "encrypted_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
