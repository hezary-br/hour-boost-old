-- CreateTable
CREATE TABLE "preapprovals" (
    "id_preapproval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "previousPreapprovalId" TEXT,
    "payerId" INTEGER,

    CONSTRAINT "preapprovals_pkey" PRIMARY KEY ("id_preapproval")
);

-- AddForeignKey
ALTER TABLE "preapprovals" ADD CONSTRAINT "preapprovals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
