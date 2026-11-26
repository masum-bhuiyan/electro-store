export const CASH_KINDS = ["OPENING", "DEPOSIT", "WITHDRAW", "TRANSFER"] as const;
export type CashKindKey = (typeof CASH_KINDS)[number];

export const CASH_KIND_LABELS: Record<CashKindKey, string> = {
  OPENING: "শুরুর জমা (চালুর সময়ে যত আছে)",
  DEPOSIT: "মালিকের টাকা জমা দেওয়া",
  WITHDRAW: "মালিকের টাকা তোলা",
  TRANSFER: "স্থানান্তর (এক মাধ্যম থেকে আরেকটায়)",
};

// ক্যাশ বুকে টাকা ঢোকে (true) না বেরোয় (false)। TRANSFER একসাথে দুদিকেই কাজ করে,
// তাই এটা শুধু অন্য তিনটার জন্য
export function isCashIn(kind: CashKindKey): boolean {
  return kind === "OPENING" || kind === "DEPOSIT";
}