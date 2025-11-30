/*
  Warnings:

  - You are about to drop the column `keyDerivationAlgorithm` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `keyDerivationHash` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `keyDerivationIterations` on the `encrypted_files` table. All the data in the column will be lost.
  - Added the required column `argon2HashLength` to the `encrypted_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `argon2Iterations` to the `encrypted_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `argon2MemorySize` to the `encrypted_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `argon2Parallelism` to the `encrypted_files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "encrypted_files" DROP COLUMN "keyDerivationAlgorithm",
DROP COLUMN "keyDerivationHash",
DROP COLUMN "keyDerivationIterations",
ADD COLUMN     "argon2HashLength" INTEGER NOT NULL,
ADD COLUMN     "argon2Iterations" INTEGER NOT NULL,
ADD COLUMN     "argon2MemorySize" INTEGER NOT NULL,
ADD COLUMN     "argon2Parallelism" INTEGER NOT NULL;
