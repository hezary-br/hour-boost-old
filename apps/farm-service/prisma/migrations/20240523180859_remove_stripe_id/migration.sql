/*
  Warnings:

  - You are about to drop the column `stripeId` on the `subscriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "stripeId";
