-- CreateEnum
CREATE TYPE "CashEntryKind" AS ENUM ('OPENING', 'DEPOSIT', 'WITHDRAW');

-- CreateTable
CREATE TABLE "CashEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "kind" "CashEntryKind" NOT NULL,
    "method" "SalePayMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "staffName" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashEntry_entryNumber_key" ON "CashEntry"("entryNumber");

-- CreateIndex
CREATE INDEX "CashEntry_method_entryDate_idx" ON "CashEntry"("method", "entryDate");
