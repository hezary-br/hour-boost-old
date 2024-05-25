-- AlterTable
ALTER TABLE "subscription_approved_notification" ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "subscription_approved_notification" ADD CONSTRAINT "subscription_approved_notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
