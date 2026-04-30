import Link from 'next/link';
import type { ReactNode } from 'react';
import { prefetchAppDetails } from '@/lib/prefetch';
import { FooterBottom } from '@/components/FooterBottom';

/**
 * Shared chrome for the blog surface: scanline + vignette background,
 * nav bar with brand mark (from CMS settings, falls back to the inline
 * bolt+wordmark), and footer. Server component — no client state.
 */
export async function BlogShell({ children }: { children: ReactNode }) {
  const app = await prefetchAppDetails();
  const logoUrl = app?.logo_header;
  const logoScale = app?.logo_header_scale ?? 100;
  const appName = app?.app_name || 'gconf.ai';

  return (
    <div className="blog-root">
      <div className="blog-vignette" aria-hidden />
      <div className="blog-scanlines" aria-hidden />
      <div className="blog-noise" aria-hidden />

      <nav className="blog-nav">
        <Link href="/" className="blog-nav-brand">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={appName}
              className="blog-nav-logo"
              style={{
                // Base size 34px at scale=100 (20% larger than the original 28px).
                height: `${Math.round((logoScale / 100) * 34)}px`,
                width: 'auto',
                display: 'block',
              }}
            />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="blog-nav-bolt" aria-hidden>
                <path d="M13 0L0 14h9l-2 10L21 10h-9l2-10z" />
              </svg>
              <span>
                gconf<span className="blog-nav-tld">.ai</span>
              </span>
            </>
          )}
        </Link>
        <div className="blog-nav-links">
          <Link href="/blog" className="blog-nav-link blog-nav-link--active">
            blog
          </Link>
        </div>
      </nav>

      <div role="main" className="blog-main">
        {children}
      </div>

      <footer className="blog-footer">
        <FooterBottom appName={appName} />
      </footer>
    </div>
  );
}
