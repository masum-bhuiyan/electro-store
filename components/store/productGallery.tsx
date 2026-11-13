"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { imageSrcSet, imageUrl, isAllowedImageUrl } from "@/lib/images";
import { en } from "@/lib/messages";

const arrow =
  "absolute top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-brand-teal shadow transition hover:bg-white";

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
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-brand-mist text-8xl font-bold text-gray-300">
        {fallbackLetter}
      </div>
    );
  }

  const index = Math.min(active, list.length - 1);
  const current = list[index];

  function go(step: number) {
    setActive((index + step + list.length) % list.length);
  }

  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <img
          key={current}
          src={imageUrl(current, 800)}
          srcSet={imageSrcSet(current, [480, 800, 1200])}
          sizes="(min-width: 768px) 50vw, 100vw"
          alt={name}
          fetchPriority="high"
          className="h-full w-full object-contain"
        />

        {list.length > 1 && (
          <>
            <button
              type="button"
              aria-label={en.detail.prevImage}
              onClick={() => go(-1)}
              className={`${arrow} left-2`}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              aria-label={en.detail.nextImage}
              onClick={() => go(1)}
              className={`${arrow} right-2`}
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={en.detail.image(i + 1)}
              aria-current={src === current ? "true" : undefined}
              onClick={() => setActive(i)}
              className={
                src === current
                  ? "overflow-hidden rounded-lg border-2 border-brand-blue bg-white"
                  : "overflow-hidden rounded-lg border-2 border-gray-200 bg-white hover:border-brand-blue"
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