import { CanvasGrid } from '@/components/CanvasGrid';
import { Typewriter } from '@/components/Typewriter';
import { SoundToggle } from '@/components/SoundToggle';
import { GlitchLine } from '@/components/GlitchLine';
import { NewsletterForm } from '@/components/NewsletterForm';

export default function Home() {
  return (
    <>
      <CanvasGrid />
      <div className="ray-burst" aria-hidden />
      <div className="vignette" />
      <div className="scanlines" />
      <GlitchLine />
      <SoundToggle />

      <main>
        <div className="logo-mark">
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
          <div className="dot" />
        </div>

        <h1>
          <svg className="bolt-icon" viewBox="0 0 24 24" aria-hidden>
            <path d="M13 0L0 14h9l-2 10L21 10h-9l2-10z" />
          </svg>
          gconf<span className="tld">.ai</span>
        </h1>

        <Typewriter />

        <div className="status-row">
          <div className="status-dot" />
          <span>Systems initializing</span>
        </div>

        <NewsletterForm />

        <div className="footer-text">&copy; 2026 gconf.ai &mdash; classified</div>
      </main>
    </>
  );
}
