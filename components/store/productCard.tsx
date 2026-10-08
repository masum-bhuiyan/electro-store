import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/modules/products/queries";

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-gray-100 text-4xl font-bold text-gray-300">
        {product.brandName[0]}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">{product.brandName}</p>
        <h2 className="mt-1 line-clamp-2 font-medium group-hover:text-blue-600">
          {product.name}
        </h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
        {!product.inStock && (
          <p className="mt-2 text-sm font-medium text-red-600">স্টকে নেই</p>
        )}
      </div>
    </Link>
  );
}