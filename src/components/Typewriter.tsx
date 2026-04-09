'use client';

import { useEffect, useRef, useState } from 'react';
import { useTypeClick } from './soundBus';

const PHRASES = [
  'something is being built',
  'the conference reimagined',
  'intelligence converges here',
  'await further transmission',
];

export function Typewriter() {
  const [text, setText] = useState('');
  const typeClick = useTypeClick();
  const typeClickRef = useRef(typeClick);
  typeClickRef.current = typeClick;

  useEffect(() => {
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let pauseTimer = 0;
    let cancelled = false;
    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (cancelled) return;
      const phrase = PHRASES[phraseIdx];

      if (!deleting) {
        if (charIdx >= phrase.length) {
          pauseTimer++;
          if (pauseTimer > 60) { deleting = true; pauseTimer = 0; }
          rafId = requestAnimationFrame(tick);
          return;
        }
        charIdx++;
        typeClickRef.current(false);
      } else {
        if (charIdx <= 0) {
          charIdx = 0;
          deleting = false;
          phraseIdx = (phraseIdx + 1) % PHRASES.length;
          timeoutId = setTimeout(tick, 70);
          return;
        }
        charIdx--;
        typeClickRef.current(true);
      }

      setText(phrase.slice(0, charIdx));
      timeoutId = setTimeout(tick, deleting ? 30 : 70);
    };

    const startTimeout = setTimeout(tick, 1400);

    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <div className="tagline" suppressHydrationWarning>{text}</div>;
}
