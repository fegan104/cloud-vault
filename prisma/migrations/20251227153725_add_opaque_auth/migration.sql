/*
  Warnings:

  - You are about to drop the column `publicKey` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "publicKey",
ADD COLUMN     "opaqueRegistrationRecord" TEXT;

-- CreateTable
CREATE TABLE "opaque_ephemerals" (
    "id" TEXT NOT NULL,
    "userIdentifier" TEXT NOT NULL,
    "serverLoginState" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opaque_ephemerals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opaque_ephemerals_userIdentifier_key" ON "opaque_ephemerals"("userIdentifier");
