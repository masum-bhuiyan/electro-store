"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { en } from "@/lib/messages";
import type { Video } from "@/lib/videos";

export default function VideoSlider({ videos }: { videos: Video[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  function scroll(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowClass =
    "hidden h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-brand-teal hover:bg-brand-mist md:flex";

  return (
    <div>
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((v) => {
          const label = v.title ?? en.videos.defaultTitle;
          const playing = activeId === v.id;

          return (
            <li
              key={v.id}
              className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-[48%] lg:w-[32%]"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-brand-teal">
                {playing ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0${
                      v.start ? `&start=${v.start}` : ""
                    }`}
                    title={label}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveId(v.id)}
                    aria-label={en.videos.play(label)}
                    className="group absolute inset-0 h-full w-full"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-brand-teal/30 group-hover:bg-brand-teal/20">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-brand-teal">
                        <Icon name="play" size={28} />
                      </span>
                    </span>
                  </button>
                )}
              </div>
              {v.title && (
                <p className="mt-2 text-sm font-medium text-brand-teal">
                  {v.title}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {videos.length > 1 && (
        <div className="mt-4 hidden justify-end gap-2 md:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={en.videos.prev}
            className={arrowClass}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={en.videos.next}
            className={arrowClass}
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}