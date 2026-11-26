-- CreateTable
CREATE TABLE "DayClosing" (
    "id" TEXT NOT NULL,
    "closingNumber" TEXT NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "lines" JSONB NOT NULL,
    "totalDiff" DECIMAL(12,2) NOT NULL,
    "staffName" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayClosing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DayClosing_closingNumber_key" ON "DayClosing"("closingNumber");

-- CreateIndex
CREATE INDEX "DayClosing_closingDate_idx" ON "DayClosing"("closingDate");
