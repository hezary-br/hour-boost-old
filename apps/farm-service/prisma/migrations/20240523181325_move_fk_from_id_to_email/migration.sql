/*
  Warnings:

  - You are about to drop the column `user_id` on the `subscriptions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "user_id",
ADD COLUMN     "user_email" TEXT;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
