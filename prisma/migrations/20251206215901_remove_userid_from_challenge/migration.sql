/*
  Warnings:

  - You are about to drop the column `userId` on the `challenges` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "challenges" DROP CONSTRAINT "challenges_userId_fkey";

-- DropIndex
DROP INDEX "challenges_userId_idx";

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "userId";
