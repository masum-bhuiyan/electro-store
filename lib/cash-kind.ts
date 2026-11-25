export const CASH_KINDS = ["OPENING", "DEPOSIT", "WITHDRAW"] as const;
export type CashKindKey = (typeof CASH_KINDS)[number];

export const CASH_KIND_LABELS: Record<CashKindKey, string> = {
  OPENING: "শুরুর জমা (চালুর সময়ে যত আছে)",
  DEPOSIT: "মালিকের টাকা জমা দেওয়া",
  WITHDRAW: "মালিকের টাকা তোলা",
};

// ক্যাশ বুকে টাকা ঢোকে (true) না বেরোয় (false)
export function isCashIn(kind: CashKindKey): boolean {
  return kind !== "WITHDRAW";
}