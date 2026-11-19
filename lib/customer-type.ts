// ক্রেতার ধরন। ক্লায়েন্ট কম্পোনেন্টও এই ফাইল ব্যবহার করবে, তাই এখানে সার্ভার কোড নেই
export const CUSTOMER_TYPES = ["RETAIL", "WHOLESALE"] as const;
export type CustomerTypeKey = (typeof CUSTOMER_TYPES)[number];

// ড্রপডাউনে দেখানো নাম
export const CUSTOMER_TYPE_LABELS: Record<CustomerTypeKey, string> = {
  RETAIL: "খুচরা",
  WHOLESALE: "পাইকারি",
};

export function isCustomerType(value: unknown): value is CustomerTypeKey {
  return (
    typeof value === "string" &&
    (CUSTOMER_TYPES as readonly string[]).includes(value)
  );
}

// খুচরায় "ক্রেতার নাম", পাইকারিতে "দোকানের নাম"
export function nameLabel(type: CustomerTypeKey): string {
  return type === "WHOLESALE" ? "দোকানের নাম" : "ক্রেতার নাম";
}

export function customerTypeLabel(type: string): string {
  return CUSTOMER_TYPE_LABELS[type as CustomerTypeKey] ?? type;
}