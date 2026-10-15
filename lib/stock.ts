export type StockReasonKey = "PURCHASE" | "SALE" | "RETURN" | "ADJUSTMENT";

const STOCK_REASON_LABEL: Record<StockReasonKey, string> = {
  PURCHASE: "নতুন মাল",
  SALE: "বিক্রি",
  RETURN: "বাতিলে ফেরত",
  ADJUSTMENT: "সংশোধন",
};

export function stockReasonLabel(reason: string): string {
  return STOCK_REASON_LABEL[reason as StockReasonKey] ?? reason;
}