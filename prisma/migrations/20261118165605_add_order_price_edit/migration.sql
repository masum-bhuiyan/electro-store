-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "originalShippingFee" DECIMAL(12,2),
ADD COLUMN     "shippingZone" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "listPrice" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "OrderEdit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderEdit_orderId_idx" ON "OrderEdit"("orderId");

-- AddForeignKey
ALTER TABLE "OrderEdit" ADD CONSTRAINT "OrderEdit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
