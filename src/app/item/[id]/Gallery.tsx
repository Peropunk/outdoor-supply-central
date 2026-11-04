"use client";

import { useRef, useState } from "react";
import { GearPhoto } from "@/components/GearPhoto";
import type { Photo } from "@/lib/listings";

/**
 * Listing photos: swipe on phones, thumbnails on desktop. One strip of images
 * serves both, so each photo only loads once.
 */
export function Gallery({ photos }: { photos: Photo[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const strip = stripRef.current;
    if (strip) setActive(Math.round(strip.scrollLeft / strip.clientWidth));
  }

  function show(index: number) {
    const strip = stripRef.current;
    strip?.scrollTo({ left: index * strip.clientWidth, behavior: "smooth" });
  }

  return (
    // On desktop the square stays short enough that the thumbnails fit on screen.
    <div className="mx-auto md:max-w-[calc(100dvh-13rem)]">
      <div className="relative -mx-4 md:mx-0">
        <div
          ref={stripRef}
          onScroll={onScroll}
          tabIndex={photos.length > 1 ? 0 : undefined}
          aria-label="Listing photos"
          className="snap-strip flex overflow-x-auto md:rounded-[var(--radius-card)]"
        >
          {(photos.length ? photos : [undefined]).map((photo, i) => (
            <GearPhoto key={i} photo={photo} size="lg" priority={i === 0} className="w-full shrink-0" />
          ))}
        </div>
        {photos.length > 1 && (
          <p
            aria-hidden="true"
            className="absolute right-6 bottom-3 rounded-full bg-ink/70 px-2.5 py-0.5 text-[13px] text-white md:right-3"
          >
            {active + 1} / {photos.length}
          </p>
        )}
      </div>

      {photos.length > 1 && (
        <ul className="no-scrollbar mt-3 hidden gap-2 overflow-x-auto md:flex">
          {photos.map((photo, i) => (
            <li key={i} className="shrink-0">
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={`Show photo ${i + 1} of ${photos.length}`}
                aria-current={active === i ? "true" : undefined}
                className={`block w-16 overflow-hidden rounded-md border-2 ${active === i ? "border-trail" : "border-transparent"}`}
              >
                <GearPhoto photo={photo} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
