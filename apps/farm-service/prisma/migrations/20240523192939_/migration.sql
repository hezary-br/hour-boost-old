/*
  Warnings:

  - A unique constraint covering the columns `[user_email]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_email_key" ON "subscriptions"("user_email");
