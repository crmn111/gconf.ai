import { CanvasGrid } from '@/components/CanvasGrid';
import { Typewriter } from '@/components/Typewriter';
import { SoundToggle } from '@/components/SoundToggle';
import { GlitchLine } from '@/components/GlitchLine';
import { NewsletterForm } from '@/components/NewsletterForm';
import { HomeNav } from '@/components/HomeNav';
import { FooterBottom } from '@/components/FooterBottom';
import { prefetchAppDetails } from '@/lib/prefetch';

export default async function Home() {
  const app = await prefetchAppDetails();
  const logoUrl = app?.logo_header;
  const logoScale = app?.logo_header_scale ?? 100;
  const appName = app?.app_name || 'gconf.ai';

  return (
    <>
      <CanvasGrid />
      <div className="ray-burst" aria-hidden />
      <div className="vignette" />
      <div className="scanlines" />
      <GlitchLine />
      <HomeNav active="home" />
      <SoundToggle />

      <main>
        <div className="logo-mark">
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
          <div className="dot" />
        </div>

        <h1>
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={appName}
              className="home-logo"
              style={{
                maxWidth: `${logoScale}%`,
                height: 'auto',
                display: 'inline-block',
              }}
            />
          ) : (
            <>
              <svg className="bolt-icon" viewBox="0 0 24 24" aria-hidden>
                <path d="M13 0L0 14h9l-2 10L21 10h-9l2-10z" />
              </svg>
              gconf<span className="tld">.ai</span>
            </>
          )}
        </h1>

        <Typewriter />

        <div className="status-row">
          <div className="status-dot" />
          <span>Systems initializing</span>
        </div>

        <NewsletterForm />

      </main>

      <footer className="home-footer">
        <FooterBottom appName={appName} />
      </footer>
    </>
  );
}
