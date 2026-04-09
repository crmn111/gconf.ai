'use client';

import { useEffect, useRef } from 'react';

export function GlitchLine() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const trigger = () => {
      if (cancelled) return;
      const el = ref.current;
      if (!el) return;
      const y = Math.random() * window.innerHeight;
      el.style.top = y + 'px';
      el.style.opacity = '0.4';
      el.style.height = (1 + Math.random() * 2) + 'px';

      timers.push(setTimeout(() => {
        if (el) el.style.opacity = '0';
      }, 80 + Math.random() * 120));

      timers.push(setTimeout(trigger, 3000 + Math.random() * 8000));
    };

    const startTimer = setTimeout(trigger, 2500);
    timers.push(startTimer);

    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  return <div className="glitch-line" ref={ref} />;
}
