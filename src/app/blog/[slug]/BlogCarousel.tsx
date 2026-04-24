'use client';

import { useState } from 'react';
import type { GalleryPhoto } from '@/lib/api';

interface Props {
  photos: GalleryPhoto[];
  title?: string;
}

export function BlogCarousel({ photos, title }: Props) {
  const [index, setIndex] = useState(0);

  if (!photos.length) return null;

  const active = photos[index];
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <figure className="blog-embed blog-embed--carousel">
      {title ? <figcaption>{title}</figcaption> : null}

      <div className="blog-carousel">
        <div className="blog-carousel-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={active.id}
            src={active.url}
            alt={active.alt_text || active.filename || `Photo ${index + 1}`}
            loading="lazy"
          />
        </div>

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              className="blog-carousel-nav blog-carousel-nav--prev"
              onClick={prev}
              aria-label="Previous photo"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="blog-carousel-nav blog-carousel-nav--next"
              onClick={next}
              aria-label="Next photo"
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="blog-carousel-dots" role="tablist">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`blog-carousel-dot${i === index ? ' blog-carousel-dot--active' : ''}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>

            <div className="blog-carousel-counter">
              {String(index + 1).padStart(2, '0')}
              <span className="blog-carousel-counter-sep"> / </span>
              {String(photos.length).padStart(2, '0')}
            </div>
          </>
        ) : null}
      </div>
    </figure>
  );
}
