/*
  Warnings:

  - You are about to drop the column `argon2HashLength` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `argon2Iterations` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `argon2MemorySize` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `argon2Parallelism` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `keyDerivationSalt` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `argon2HashLength` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the column `argon2Iterations` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the column `argon2MemorySize` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the column `argon2Parallelism` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the column `keyDerivationSalt` on the `shares` table. All the data in the column will be lost.
  - You are about to drop the column `masterKeySalt` on the `users` table. All the data in the column will be lost.
  - Made the column `opaqueRegistrationRecord` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "encrypted_files" DROP COLUMN "argon2HashLength",
DROP COLUMN "argon2Iterations",
DROP COLUMN "argon2MemorySize",
DROP COLUMN "argon2Parallelism",
DROP COLUMN "keyDerivationSalt";

-- AlterTable
ALTER TABLE "shares" DROP COLUMN "argon2HashLength",
DROP COLUMN "argon2Iterations",
DROP COLUMN "argon2MemorySize",
DROP COLUMN "argon2Parallelism",
DROP COLUMN "keyDerivationSalt";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "masterKeySalt",
ALTER COLUMN "opaqueRegistrationRecord" SET NOT NULL;
