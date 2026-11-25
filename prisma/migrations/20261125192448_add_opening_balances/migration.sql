-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "openingSetAt" TIMESTAMP(3),
ADD COLUMN     "openingSetBy" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "openingSetAt" TIMESTAMP(3),
ADD COLUMN     "openingSetBy" TEXT;
