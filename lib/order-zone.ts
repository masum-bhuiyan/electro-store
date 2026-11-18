import type { Zone } from "@/lib/shipping";
import { isZone, zoneAddressLabel } from "@/lib/shipping";

// ঠিকানার শেষে "(ঢাকার ভেতরে)" বা "(ঢাকার বাইরে)" থাকে
const SUFFIX = /\s*\((ঢাকার ভেতরে|ঢাকার বাইরে)\)\s*$/;

// পুরোনো অর্ডারে shippingZone খালি, তাই ঠিকানা থেকে বের করি
export function zoneFromAddress(address: string): Zone | null {
  const m = SUFFIX.exec(address);
  if (!m) return null;
  return m[1] === "ঢাকার ভেতরে" ? "dhaka" : "outside";
}

// ঠিকানার শেষের এলাকার লেখা নতুন এলাকা দিয়ে বদলায় (না থাকলে যোগ করে)
export function withZoneLabel(address: string, zone: Zone): string {
  const base = address.replace(SUFFIX, "");
  return `${base} (${zoneAddressLabel(zone)})`;
}

export function currentZone(
  shippingZone: string | null,
  address: string
): Zone | null {
  if (shippingZone && isZone(shippingZone)) return shippingZone;
  return zoneFromAddress(address);
}