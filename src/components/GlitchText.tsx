'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

interface GlitchTextProps {
  children: string;
  className?: string;
  /** Interval between shuffle cycles in ms (ignored when autoPlay=false) */
  interval?: number;
  /** Duration of the shuffle animation in ms */
  duration?: number;
  /** When false, shuffles only fire via the imperative trigger() handle */
  autoPlay?: boolean;
}

export interface GlitchTextHandle {
  trigger: () => void;
}

const CHARS = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Shuffle / scramble text animation. Ported from chm-website so the gconf.ai
 * footer-bottom can match its visual treatment.
 */
export const GlitchText = forwardRef<GlitchTextHandle, GlitchTextProps>(({
  children,
  className = '',
  interval = 5000,
  duration = 1200,
  autoPlay = true,
}, ref) => {
  const target = children;
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const runShuffle = useCallback(() => {
    const start = performance.now();
    const queue = target.split('').map((char) => {
      if (char === ' ') return { from: ' ', to: ' ', startAt: 0, endAt: 0 };
      const startAt = Math.random() * (duration * 0.4);
      const endAt = startAt + Math.random() * (duration * 0.5) + duration * 0.1;
      return { from: randomChar(), to: char, startAt, endAt };
    });

    const tick = (now: number) => {
      if (cancelledRef.current) return;
      const elapsed = now - start;
      let output = '';
      let complete = 0;
      for (const q of queue) {
        if (elapsed >= q.endAt) {
          complete++;
          output += q.to;
        } else if (elapsed >= q.startAt) {
          output += randomChar();
        } else {
          output += q.from;
        }
      }
      setDisplay(output);
      if (complete < queue.length) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        if (autoPlay) {
          timeoutRef.current = setTimeout(runShuffle, interval);
        }
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [target, interval, duration, autoPlay]);

  useImperativeHandle(ref, () => ({
    trigger: runShuffle,
  }), [runShuffle]);

  useEffect(() => {
    cancelledRef.current = false;
    if (!autoPlay) return;
    timeoutRef.current = setTimeout(runShuffle, interval);
    return () => {
      cancelledRef.current = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [autoPlay, runShuffle, interval]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return <span className={className}>{display}</span>;
});

GlitchText.displayName = 'GlitchText';

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}
