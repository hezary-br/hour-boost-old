-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_onceBelongedTo_fkey" FOREIGN KEY ("onceBelongedTo") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
