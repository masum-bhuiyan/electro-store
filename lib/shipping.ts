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

// ডেলিভারি চার্জ এক জায়গায়। নিজের আসল রেট বসিয়ে নিন।
const DHAKA_FEE = 80;
const OUTSIDE_FEE = 130;

export function isDivision(value: string): value is Division {
  return (DIVISIONS as readonly string[]).includes(value);
}

export function getShippingFee(division: Division): number {
  return division === "ঢাকা" ? DHAKA_FEE : OUTSIDE_FEE;
}