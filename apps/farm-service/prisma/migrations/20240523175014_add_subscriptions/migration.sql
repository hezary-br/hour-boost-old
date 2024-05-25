-- CreateTable
CREATE TABLE "subscriptions" (
    "id_subscription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,
    "stripeCustomerId" TEXT,
    "stripeId" TEXT,
    "stripeStatus" TEXT,
    "stripePriceId" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id_subscription")
);

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
