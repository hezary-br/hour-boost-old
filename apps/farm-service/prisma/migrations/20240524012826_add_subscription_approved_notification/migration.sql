-- CreateTable
CREATE TABLE "subscription_approved_notification" (
    "id_subscription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planName" TEXT,

    CONSTRAINT "subscription_approved_notification_pkey" PRIMARY KEY ("id_subscription")
);
