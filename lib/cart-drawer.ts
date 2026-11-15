"use client";

import { useSyncExternalStore } from "react";

// কার্ট ড্রয়ার খোলা না বন্ধ, সেই অবস্থা এক জায়গায় (যেকোনো বাটন থেকে খোলা যাবে)
let open = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function openCartDrawer() {
  if (open) return;
  open = true;
  emit();
}

export function closeCartDrawer() {
  if (!open) return;
  open = false;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCartDrawerOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}