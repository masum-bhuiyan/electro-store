export function formatPrice(amount: number): string {
  return "৳" + amount.toLocaleString("en-BD");
}
// "2026-10-10T08:30:00.000Z" -> বাংলায় ঢাকার সময়ে তারিখ ও সময়
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  });
}