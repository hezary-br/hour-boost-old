/*
  Warnings:

  - You are about to drop the column `accountName` on the `steam_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `accountName` on the `usages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account_name]` on the table `steam_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_name` to the `steam_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "usages" DROP CONSTRAINT "usages_accountName_fkey";

-- DropIndex
DROP INDEX "steam_accounts_accountName_key";

-- DropIndex
DROP INDEX "usages_accountName_idx";

-- AlterTable
ALTER TABLE "steam_accounts" DROP COLUMN "accountName",
ADD COLUMN     "account_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "usages" DROP COLUMN "accountName",
ADD COLUMN     "account_name" TEXT NOT NULL DEFAULT 'undefined';

-- CreateIndex
CREATE UNIQUE INDEX "steam_accounts_account_name_key" ON "steam_accounts"("account_name");

-- CreateIndex
CREATE INDEX "usages_account_name_idx" ON "usages"("account_name");

-- AddForeignKey
ALTER TABLE "usages" ADD CONSTRAINT "usages_account_name_fkey" FOREIGN KEY ("account_name") REFERENCES "steam_accounts"("account_name") ON DELETE RESTRICT ON UPDATE CASCADE;
