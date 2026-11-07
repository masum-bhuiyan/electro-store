"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { imageSrcSet, imageUrl, isAllowedImageUrl } from "@/lib/images";

export default function ProductGallery({
  images,
  name,
  fallbackLetter,
}: {
  images: string[];
  name: string;
  fallbackLetter: string;
}) {
  const list = images.filter((src) => isAllowedImageUrl(src));
  const [active, setActive] = useState(0);

  if (list.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-8xl font-bold text-gray-300">
        {fallbackLetter}
      </div>
    );
  }

  const current = list[Math.min(active, list.length - 1)];

  return (
    <div>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
        <img
          key={current}
          src={imageUrl(current, 800)}
          srcSet={imageSrcSet(current, [480, 800, 1200])}
          sizes="(min-width: 768px) 50vw, 100vw"
          alt={name}
          fetchPriority="high"
          className="h-full w-full object-contain"
        />
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`ছবি ${i + 1}`}
              onClick={() => setActive(i)}
              className={
                src === current
                  ? "overflow-hidden rounded-md border-2 border-blue-600 bg-white"
                  : "overflow-hidden rounded-md border border-gray-200 bg-white hover:border-gray-500"
              }
            >
              <img
                src={imageUrl(src, 160)}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}