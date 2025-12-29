/*
  Warnings:

  - You are about to drop the column `fileIv` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `keyWrapIv` on the `encrypted_files` table. All the data in the column will be lost.
  - You are about to drop the column `keyWrapIv` on the `shares` table. All the data in the column will be lost.
  - Added the required column `fileNonce` to the `encrypted_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyWrapNonce` to the `encrypted_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyWrapNonce` to the `shares` table without a default value. This is not possible if the table is not empty.

*/
-- encrypted_files
ALTER TABLE "encrypted_files"
  RENAME COLUMN "fileIv" TO "fileNonce";

ALTER TABLE "encrypted_files"
  RENAME COLUMN "keyWrapIv" TO "keyWrapNonce";

-- shares
ALTER TABLE "shares"
  RENAME COLUMN "keyWrapIv" TO "keyWrapNonce";
