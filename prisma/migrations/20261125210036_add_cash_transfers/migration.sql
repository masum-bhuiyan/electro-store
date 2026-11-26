-- AlterEnum
ALTER TYPE "CashEntryKind" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "CashEntry" ADD COLUMN     "charge" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "chargeExpenseId" TEXT,
ADD COLUMN     "toMethod" "SalePayMethod";
