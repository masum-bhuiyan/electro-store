// ব্রাউজারে কার্টের ডাটা কেমন দেখাবে তা define করা
export type CartItem = {
  productId: number;
  variantId: number;
  quantity: number;
  // ক্যাশের জন্য product details ও দাম save করি, যাতে database call না লাগে
  productName: string;
  productSlug: string;
  productImage: string | null;
  price: number;
};

export type Cart = {
  items: CartItem[];
};

// ডিফল্ট খালি কার্ট
export const EMPTY_CART: Cart = {
  items: [],
};

// ব্রাউজারে কার্ট সংরক্ষণের জন্য key
export const CART_STORAGE_KEY = "electro-store-cart";

// কার্ট এ একটা item আছে কিনা খুঁজে বের করা
export function findCartItem(
  cart: Cart,
  productId: number,
  variantId: number
): CartItem | undefined {
  return cart.items.find(
    (item) => item.productId === productId && item.variantId === variantId
  );
}

// কার্টের মোট item সংখ্যা (প্রতিটা product এর quantity গুনে নেওয়া)
export function getCartTotalQuantity(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// কার্টের মোট দাম
export function getCartTotalPrice(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}