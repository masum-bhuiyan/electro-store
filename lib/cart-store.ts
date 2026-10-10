"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  price: number;
  stock: number;
  quantity: number;
};

const STORAGE_KEY = "electro-cart-v1";
// একটা আইটেম সর্বোচ্চ কয়টা কেনা যাবে
export const MAX_PER_ITEM = 10;

const EMPTY: CartItem[] = [];
let cart: CartItem[] = EMPTY;
let loaded = false;
let listeningStorage = false;
const listeners = new Set<() => void>();

// localStorage-এর ডাটা ভুল বা নষ্ট হতে পারে, তাই প্রতিটা আইটেম যাচাই করি
function isValidItem(x: unknown): x is CartItem {
  if (typeof x !== "object" || x === null) return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.variantId === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    typeof i.variantLabel === "string" &&
    typeof i.price === "number" &&
    typeof i.stock === "number" &&
    typeof i.quantity === "number" &&
    i.quantity > 0
  );
}

function readFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const items = parsed.filter(isValidItem);
    return items.length > 0 ? items : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setCart(next: CartItem[]) {
  cart = next.length > 0 ? next : EMPTY;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ব্রাউজারে সেভ করা না গেলেও কার্ট এই পেজে চলবে
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // অন্য ট্যাবে কার্ট বদলালে এই ট্যাবেও যেন বদলায় (একবারই বসাই)
  if (!listeningStorage) {
    listeningStorage = true;
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        cart = readFromStorage();
        emit();
      }
    });
  }

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CartItem[] {
  if (!loaded) {
    loaded = true;
    cart = readFromStorage();
  }
  return cart;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

function clampQty(quantity: number, stock: number): number {
  return Math.max(0, Math.min(quantity, stock, MAX_PER_ITEM));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const current = getSnapshot();
  const existing = current.find((i) => i.variantId === item.variantId);

  if (existing) {
    const q = clampQty(existing.quantity + quantity, item.stock);
    if (q <= 0) return;
    setCart(
      current.map((i) =>
        i.variantId === item.variantId ? { ...i, ...item, quantity: q } : i
      )
    );
  } else {
    const q = clampQty(quantity, item.stock);
    if (q <= 0) return;
    setCart([...current, { ...item, quantity: q }]);
  }
}

export function setQuantity(variantId: string, quantity: number) {
  const current = getSnapshot();
  if (quantity <= 0) {
    setCart(current.filter((i) => i.variantId !== variantId));
    return;
  }
  setCart(
    current.map((i) =>
      i.variantId === variantId
        ? { ...i, quantity: clampQty(quantity, i.stock) }
        : i
    )
  );
}

export function removeFromCart(variantId: string) {
  setCart(getSnapshot().filter((i) => i.variantId !== variantId));
}

export function clearCart() {
  setCart([]);
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, count, subtotal };
}

const noopSubscribe = () => () => {};

// সার্ভারে false, ব্রাউজারে লোড হওয়ার পর true
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}