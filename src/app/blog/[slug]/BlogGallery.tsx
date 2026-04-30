'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryPhoto } from '@/lib/api';

interface Props {
  photos: GalleryPhoto[];
  title?: string;
}

/**
 * Blog gallery with built-in lightbox viewer.
 *
 *  - Click a thumbnail to open the lightbox at that index.
 *  - Keyboard:
 *      ←  / →   — previous / next photo
 *      Esc      — close
 *  - The lightbox displays the photo's `alt_text` as a caption beneath
 *    the image, and uses it as the `alt` attribute. Falls back to filename.
 *  - Click outside the image (or the close button) to dismiss.
 */
export function BlogGallery({ photos, title }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null;
  const current = open ? photos[openIndex] : null;

  // The lightbox needs to portal to document.body so it escapes any ancestor
  // CSS (transforms, `contain`, `overflow: hidden`, stacking contexts) that
  // would otherwise clip a `position: fixed` element.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);
  const prev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  // Keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, next, prev]);

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Touch swipe support.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <figure className="blog-embed blog-embed--gallery">
      {title ? <figcaption>{title}</figcaption> : null}
      <div className="blog-gallery">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="blog-gallery-item"
            aria-label={photo.alt_text || photo.filename || `Open photo ${i + 1}`}
            style={{
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'zoom-in',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt_text || photo.filename || ''}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {open && current && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt_text || current.filename || 'Photo viewer'}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 3rem',
          }}
        >
          {/* Close (top-right) */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(); }}
            aria-label="Close photo viewer"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 999,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Counter (top-left) */}
          <div
            style={{
              position: 'absolute',
              top: 22,
              left: 22,
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.85rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {(openIndex ?? 0) + 1} / {photos.length}
          </div>

          {/* Prev arrow */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 999,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.4rem',
                lineHeight: 1,
              }}
            >
              ‹
            </button>
          )}

          {/* Image + caption (clicking the image itself doesn't close) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              maxWidth: 'min(95vw, 1400px)',
              maxHeight: '100%',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.alt_text || current.filename || ''}
              style={{
                maxWidth: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                background: '#000',
              }}
            />
            {(current.alt_text || current.filename) && (
              <figcaption
                style={{
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  maxWidth: 'min(90vw, 900px)',
                  textAlign: 'center',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {current.alt_text || current.filename}
              </figcaption>
            )}
          </div>

          {/* Next arrow */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 999,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.4rem',
                lineHeight: 1,
              }}
            >
              ›
            </button>
          )}
        </div>,
        document.body,
      )}
    </figure>
  );
}

export default BlogGallery;
