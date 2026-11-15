/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import ProductCardActions from "@/components/store/productCardActions";
import { formatPrice } from "@/lib/format";
import { imageSrcSet, imageUrl, isAllowedImageUrl } from "@/lib/images";
import { en } from "@/lib/messages";
import type { ProductListItem } from "@/modules/products/queries";

export default function ProductCard({ product }: { product: ProductListItem }) {
  const image =
    product.image && isAllowedImageUrl(product.image) ? product.image : null;
  const href = `/products/${product.slug}`;

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100
        )
      : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-white"
      >
        {image ? (
          <img
            src={imageUrl(image, 480)}
            srcSet={imageSrcSet(image, [240, 480, 720])}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            alt=""
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-4xl font-bold text-gray-300">
            {product.brandName[0]}
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-brand-teal px-2 py-1 text-[11px] font-bold text-white">
          {en.card.original}
        </span>
        {discount > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-brand-orange px-2 py-1 text-[11px] font-bold text-brand-teal">
            {en.product.off(discount)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 md:p-4">
        <p className="text-xs font-semibold tracking-wide text-brand-blue">
          {product.brandName}
        </p>
        <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold text-brand-teal md:text-base">
          <Link href={href} className="hover:text-brand-blue">
            {product.name}
          </Link>
        </h2>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-brand-teal">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {product.variant && (
          <div className="mt-auto pt-3">
            <ProductCardActions
              productName={product.name}
              slug={product.slug}
              variant={product.variant}
              image={image}
            />
          </div>
        )}
      </div>
    </article>
  );
}