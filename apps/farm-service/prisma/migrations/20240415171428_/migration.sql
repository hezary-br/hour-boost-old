-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('INFINITY', 'USAGE');

-- CreateEnum
CREATE TYPE "PlanName" AS ENUM ('GUEST', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "PlanNameCustom" AS ENUM ('CUSTOM_USAGE_PLAN', 'CUSTOM_INFINITY_PLAN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "users" (
    "id_user" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profilePic" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "Status" NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "steam_accounts" (
    "id_steamAccount" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT,
    "accountName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "autoRelogin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "steam_accounts_pkey" PRIMARY KEY ("id_steamAccount")
);

-- CreateTable
CREATE TABLE "plans" (
    "id_plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "name" "PlanName" NOT NULL,
    "ownerId" TEXT,
    "type" "PlanType" NOT NULL DEFAULT 'USAGE',

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id_plan")
);

-- CreateTable
CREATE TABLE "custom_plans" (
    "id_plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "name" "PlanNameCustom" NOT NULL,
    "ownerId" TEXT,
    "type" "PlanType" NOT NULL DEFAULT 'USAGE',
    "maxSteamAccounts" INTEGER NOT NULL,
    "maxGamesAllowed" INTEGER NOT NULL,
    "maxUsageTime" INTEGER NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "autoRelogin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "custom_plans_pkey" PRIMARY KEY ("id_plan")
);

-- CreateTable
CREATE TABLE "custom_plans_new" (
    "id_plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "originalPlanId" TEXT NOT NULL,
    "maxSteamAccounts" INTEGER NOT NULL,
    "maxGamesAllowed" INTEGER NOT NULL,
    "maxUsageTime" INTEGER NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "autoRelogin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "custom_plans_new_pkey" PRIMARY KEY ("id_plan")
);

-- CreateTable
CREATE TABLE "usages" (
    "id_usage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "amountTime" INTEGER NOT NULL,
    "plan_id" TEXT,
    "custom_plan_id" TEXT,
    "user_id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL DEFAULT 'undefined',

    CONSTRAINT "usages_pkey" PRIMARY KEY ("id_usage")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id_Purchase" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id_Purchase")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "steam_accounts_accountName_key" ON "steam_accounts"("accountName");

-- CreateIndex
CREATE INDEX "steam_accounts_owner_id_idx" ON "steam_accounts"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_ownerId_key" ON "plans"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_plans_ownerId_key" ON "custom_plans"("ownerId");

-- CreateIndex
CREATE INDEX "custom_plans_ownerId_idx" ON "custom_plans"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_plans_new_originalPlanId_key" ON "custom_plans_new"("originalPlanId");

-- CreateIndex
CREATE INDEX "custom_plans_new_originalPlanId_idx" ON "custom_plans_new"("originalPlanId");

-- CreateIndex
CREATE INDEX "usages_custom_plan_id_idx" ON "usages"("custom_plan_id");

-- CreateIndex
CREATE INDEX "usages_plan_id_idx" ON "usages"("plan_id");

-- CreateIndex
CREATE INDEX "usages_user_id_idx" ON "usages"("user_id");

-- CreateIndex
CREATE INDEX "usages_accountName_idx" ON "usages"("accountName");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_owner_id_key" ON "purchases"("owner_id");

-- AddForeignKey
ALTER TABLE "steam_accounts" ADD CONSTRAINT "steam_accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_plans" ADD CONSTRAINT "custom_plans_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_plans_new" ADD CONSTRAINT "custom_plans_new_originalPlanId_fkey" FOREIGN KEY ("originalPlanId") REFERENCES "plans"("id_plan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usages" ADD CONSTRAINT "usages_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id_plan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usages" ADD CONSTRAINT "usages_custom_plan_id_fkey" FOREIGN KEY ("custom_plan_id") REFERENCES "custom_plans"("id_plan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usages" ADD CONSTRAINT "usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usages" ADD CONSTRAINT "usages_accountName_fkey" FOREIGN KEY ("accountName") REFERENCES "steam_accounts"("accountName") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
