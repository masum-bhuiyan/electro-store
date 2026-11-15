import { isZone } from "@/lib/shipping";
import type { CustomerInput } from "@/modules/orders/validation";

// কাস্টমারের নিজের ব্রাউজারে সংরক্ষণ (সার্ভারে যায় না)
const KEY = "bt-customer-v1";

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

// সার্ভারে (যেখানে window নেই) null দেয়
export function loadSavedCustomer(): CustomerInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const o = parsed as Record<string, unknown>;
    const name = str(o.name, 80);
    const phone = str(o.phone, 20);
    const address = str(o.address, 250);
    const zone = typeof o.zone === "string" && isZone(o.zone) ? o.zone : "";

    if (!name && !phone && !address) return null;
    return { name, phone, address, zone };
  } catch {
    return null;
  }
}

export function saveCustomer(c: CustomerInput) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        name: c.name,
        phone: c.phone,
        address: c.address,
        zone: c.zone,
      })
    );
  } catch {
    // সেভ করা না গেলে অর্ডারে সমস্যা নেই
  }
}

export function clearSavedCustomer() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // কিছু করার নেই
  }
}