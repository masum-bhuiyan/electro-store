"use server";

import {
  getSuggestedProducts,
  type ProductListItem,
} from "@/modules/products/queries";

// ড্রয়ারের সাজেশনের জন্য। এটা পাবলিক endpoint, তাই ইনপুট যাচাই করি
export async function getCartSuggestionsAction(
  rawIds: unknown
): Promise<ProductListItem[]> {
  if (!Array.isArray(rawIds)) return [];

  const ids = rawIds
    .filter(
      (x): x is string => typeof x === "string" && x.length > 0 && x.length <= 50
    )
    .slice(0, 30);

  try {
    return await getSuggestedProducts(ids, 3);
  } catch {
    return [];
  }
}