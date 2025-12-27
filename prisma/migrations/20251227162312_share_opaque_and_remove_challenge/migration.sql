/*
  Warnings:

  - You are about to drop the column `publicKey` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the `challenges` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `opaqueRegistrationRecord` to the `shares` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shares" DROP COLUMN "publicKey",
ADD COLUMN     "opaqueRegistrationRecord" TEXT NOT NULL,
ALTER COLUMN "keyDerivationSalt" DROP NOT NULL,
ALTER COLUMN "argon2MemorySize" DROP NOT NULL,
ALTER COLUMN "argon2Iterations" DROP NOT NULL,
ALTER COLUMN "argon2Parallelism" DROP NOT NULL,
ALTER COLUMN "argon2HashLength" DROP NOT NULL;

-- DropTable
DROP TABLE "challenges";
