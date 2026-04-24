'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Lottie from 'lottie-react';

interface BlogLottieProps {
  animationData: unknown;
  title?: string;
  loop?: boolean;
  autoplay?: boolean;
  /** Legacy numeric px width (optional) */
  width?: number;
  /** CSS max-width value: "640px", "100%", "80vw". Takes precedence. */
  widthCss?: string;
  alignment?: 'left' | 'center' | 'right';
  /** Hex color applied to svg text/tspan via scoped CSS, bypassing lottie-web's paint. */
  textColor?: string;
  /** CSS font stack applied to svg text/tspan. */
  fontFamily?: string;
}

// lottie-web mutates the animation object in place, so every <Lottie> instance
// needs its own clone. JSON round-trip is the only safe option here —
// structuredClone rejects the native functions lottie-web attaches later.
const cloneAnimation = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
};

const normalizeWidth = (value: string | undefined | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
};

/**
 * Plays a Lottie animation inside a blog post.
 *
 * Text color + font are applied through a scoped CSS override on the rendered
 * SVG rather than by mutating the JSON. lottie-web's internal text pipeline
 * can ignore JSON-level fc/f changes (animators, embedded glyph fills, effects
 * layers all trump the base document), but the browser's final paint on the
 * DOM text nodes is styleable with !important — that's what this component
 * relies on.
 */
export default function BlogLottie({
  animationData,
  title,
  loop = true,
  autoplay = true,
  width,
  widthCss,
  alignment = 'center',
  textColor,
  fontFamily,
}: BlogLottieProps) {
  const reactId = useId();
  const scopeId = 'blog-lottie-' + reactId.replace(/[^a-zA-Z0-9_-]/g, '');

  // Clone once on the client. We don't depend on textColor/fontFamily here
  // because those apply via CSS, so changing them shouldn't reload the animation.
  const data = useMemo(() => cloneAnimation(animationData), [animationData]);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 3000);
    return () => window.clearTimeout(t);
  }, [data]);

  const resolvedMaxWidth = normalizeWidth(widthCss) ?? (width ? `${width}px` : '100%');
  const justifyContent =
    alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center';

  // CSS override — identical pattern to ep-dashboard's LottiePlayerWithLoader.
  // Scoped via data-lottie-scope so rules can't leak.
  const cssRules: string[] = [];
  if (textColor) {
    cssRules.push(
      `[data-lottie-scope="${scopeId}"] svg text,` +
        `[data-lottie-scope="${scopeId}"] svg tspan {` +
        `fill: ${textColor} !important;` +
        `color: ${textColor} !important;` +
        `}`
    );
  }
  if (fontFamily) {
    cssRules.push(
      `[data-lottie-scope="${scopeId}"] svg text,` +
        `[data-lottie-scope="${scopeId}"] svg tspan {` +
        `font-family: ${fontFamily} !important;` +
        `}`
    );
  }

  if (!data) return null;

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      {title && (
        <div
          style={{
            color: 'var(--text-secondary, rgba(255,255,255,0.7))',
            fontSize: '0.9rem',
            marginBottom: '0.5rem',
            textAlign: alignment,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ width: '100%', display: 'flex', justifyContent }}>
        <div
          data-lottie-scope={scopeId}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: resolvedMaxWidth,
          }}
        >
          {cssRules.length > 0 && (
            <style dangerouslySetInnerHTML={{ __html: cssRules.join('\n') }} />
          )}
          <Lottie
            animationData={data}
            loop={loop}
            autoplay={autoplay}
            onDOMLoaded={() => setLoading(false)}
            rendererSettings={{ progressiveLoad: true }}
          />
          {loading && (
            <>
              <style>{`
                @keyframes blog-lottie-spin { to { transform: rotate(360deg); } }
                @keyframes blog-lottie-fade-in {
                  from { opacity: 0; transform: scale(0.96); }
                  to   { opacity: 1; transform: scale(1); }
                }
                @keyframes blog-lottie-pulse {
                  0%, 100% { opacity: 0.55; }
                  50%      { opacity: 1; }
                }
              `}</style>
              <div
                aria-live="polite"
                aria-label="Loading animation"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.85rem',
                  background:
                    'radial-gradient(circle at center, rgba(16, 21, 42, 0.55) 0%, rgba(10, 14, 39, 0.4) 100%)',
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                  animation: 'blog-lottie-fade-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  aria-hidden="true"
                  style={{
                    animation: 'blog-lottie-spin 0.9s linear infinite',
                    transformOrigin: 'center',
                    overflow: 'visible',
                  }}
                >
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#24B0C2"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="30 85"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(36, 176, 194, 0.45))' }}
                  />
                </svg>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.78)',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
                    animation: 'blog-lottie-pulse 1.4s ease-in-out infinite',
                  }}
                >
                  Loading
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
