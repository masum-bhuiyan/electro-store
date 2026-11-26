-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAmount" DECIMAL(12,2),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidBy" TEXT,
ADD COLUMN     "paidMethod" "SalePayMethod",
ADD COLUMN     "shippedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");
UPDATE "Order" SET "shippedAt" = "updatedAt" WHERE "status" IN ('SHIPPED', 'DELIVERED');
