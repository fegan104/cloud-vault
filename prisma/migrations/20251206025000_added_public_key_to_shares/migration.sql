/*
  Warnings:

  - Added the required column `publicKey` to the `shares` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shares" ADD COLUMN     "publicKey" TEXT NOT NULL;
