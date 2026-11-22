-- CreateTable
CREATE TABLE "SaleEdit" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleEdit_saleId_idx" ON "SaleEdit"("saleId");

-- AddForeignKey
ALTER TABLE "SaleEdit" ADD CONSTRAINT "SaleEdit_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
