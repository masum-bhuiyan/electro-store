// ---------- নতুন: ডেলিভারি এলাকা (ঢাকার ভেতরে / বাইরে) ----------
export const ZONES = ["dhaka", "outside"] as const;
export type Zone = (typeof ZONES)[number];

// ডেলিভারি চার্জ এক জায়গায়। ভারী পণ্যে বেশি লাগলে কাস্টমারকে জানানো হয় (চেকআউটে নোট আছে)।
const ZONE_FEES: Record<Zone, number> = { dhaka: 60, outside: 130 };

// অ্যাডমিনে অর্ডারের ঠিকানার সাথে যে লেখা যুক্ত হবে
const ZONE_ADDRESS_LABEL: Record<Zone, string> = {
  dhaka: "ঢাকার ভেতরে",
  outside: "ঢাকার বাইরে",
};

export function isZone(value: string): value is Zone {
  return (ZONES as readonly string[]).includes(value);
}

export function getZoneFee(zone: Zone): number {
  return ZONE_FEES[zone];
}

export function zoneAddressLabel(zone: Zone): string {
  return ZONE_ADDRESS_LABEL[zone];
}

// ---------- পুরোনো: বিভাগ অনুযায়ী (নতুন কোডে ব্যবহার হয় না) ----------
// কোথাও ব্যবহার না হলে নিচের অংশ পরে মুছে দিতে পারেন।
export const DIVISIONS = [
  "ঢাকা",
  "চট্টগ্রাম",
  "রাজশাহী",
  "খুলনা",
  "বরিশাল",
  "সিলেট",
  "রংপুর",
  "ময়মনসিংহ",
] as const;

export type Division = (typeof DIVISIONS)[number];

export function isDivision(value: string): value is Division {
  return (DIVISIONS as readonly string[]).includes(value);
}

export function getShippingFee(division: Division): number {
  return division === "ঢাকা" ? ZONE_FEES.dhaka : ZONE_FEES.outside;
}