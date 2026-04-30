'use client';

import { useEffect, useRef, useState } from 'react';
import { GlitchText } from './GlitchText';
import type { GlitchTextHandle } from './GlitchText';

interface Props {
  /** Site/app name shown next to the © glyph. Defaults to "gconf.ai". */
  appName?: string;
}

const ANIM_DURATION = 1200;
const PAUSE = 1900;

/**
 * "Powered by" left + © right footer strip, styled to match chm-website.
 * Easter egg / center custom-links bar are intentionally omitted.
 */
function PoweredByGconf() {
  const glitchRef = useRef<GlitchTextHandle>(null);
  const [zapKey, setZapKey] = useState(0);
  const [isZapping, setIsZapping] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const cycle = () => {
      setIsZapping(true);
      setZapKey((k) => k + 1);
      schedule(() => {
        setIsZapping(false);
        schedule(() => {
          glitchRef.current?.trigger();
          schedule(cycle, ANIM_DURATION + PAUSE);
        }, PAUSE);
      }, ANIM_DURATION);
    };
    schedule(cycle, 800);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="powered-by-gconf flex items-center gap-2 h-5">
      <svg
        key={zapKey}
        className={`zap-icon ${isZapping ? 'animate-zap' : ''}`}
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="#00B0C2"
        style={{ flexShrink: 0 }}
      >
        <path d="M13 0L0 14h9l-2 10L21 10h-9l2-10z" />
      </svg>
      <span className="footer-link-group footer-bottom-text">
        POWERED BY{' '}
        <a href="https://gconf.ai" className="footer-shiny-link">
          <GlitchText ref={glitchRef} autoPlay={false}>GCONF.AI</GlitchText>
        </a>
      </span>
    </div>
  );
}

export function FooterBottom({ appName = 'gconf.ai' }: Props) {
  const year = String(new Date().getFullYear());
  return (
    <div className="footer-bottom-bar">
      <PoweredByGconf />
      <div className="copyright-group flex items-center gap-2 h-5">
        <svg
          className="animate-copyright-glow"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="#ffffff"
          style={{ flexShrink: 0 }}
        >
          <path d="M10.08 10.86c.05-.33.16-.62.3-.87s.34-.46.59-.62c.24-.15.54-.22.91-.23.23.01.44.05.63.13.2.09.38.21.52.36s.25.33.34.53.13.42.14.64h1.79c-.02-.47-.11-.9-.28-1.29s-.4-.73-.7-1.01-.66-.5-1.08-.66-.88-.23-1.39-.23c-.65 0-1.22.11-1.7.34s-.88.53-1.2.92-.56.84-.71 1.36S8 11.29 8 11.87v.27c0 .58.08 1.12.23 1.64s.39.97.71 1.35.72.69 1.2.91 1.05.34 1.7.34c.47 0 .91-.08 1.32-.23s.77-.36 1.08-.63.56-.58.74-.94.29-.74.3-1.15h-1.79c-.01.21-.06.4-.15.58s-.21.33-.36.46-.32.23-.52.3c-.19.07-.39.09-.6.1-.36-.01-.66-.08-.89-.23-.25-.16-.45-.37-.59-.62s-.25-.55-.3-.88-.08-.67-.08-1v-.27c0-.35.03-.68.08-1.01zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
        <span className="footer-bottom-text">
          <strong>
            <GlitchText interval={5000} duration={1200}>{year}</GlitchText>
          </strong>{' '}
          <span className="footer-bottom-app">{appName}</span>
        </span>
      </div>
    </div>
  );
}

export default FooterBottom;
