/*
  Warnings:

  - You are about to drop the column `account_name` on the `steam_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `account_name` on the `usages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountName]` on the table `steam_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountName` to the `steam_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "usages" DROP CONSTRAINT "usages_account_name_fkey";

-- DropIndex
DROP INDEX "steam_accounts_account_name_key";

-- DropIndex
DROP INDEX "usages_account_name_idx";

-- AlterTable
ALTER TABLE "steam_accounts" RENAME COLUMN "account_name" TO "accountName";

-- AlterTable
ALTER TABLE "usages" RENAME COLUMN "account_name" TO "accountName";

-- CreateIndex
CREATE UNIQUE INDEX "steam_accounts_accountName_key" ON "steam_accounts"("accountName");

-- CreateIndex
CREATE INDEX "usages_accountName_idx" ON "usages"("accountName");

-- AddForeignKey
ALTER TABLE "usages" ADD CONSTRAINT "usages_accountName_fkey" FOREIGN KEY ("accountName") REFERENCES "steam_accounts"("accountName") ON DELETE RESTRICT ON UPDATE CASCADE;
