-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "unitCost" DECIMAL(12,2);
UPDATE "OrderItem" oi
SET "unitCost" = pv."costPrice"
FROM "ProductVariant" pv
WHERE oi."variantId" = pv."id" AND pv."costPrice" IS NOT NULL;
