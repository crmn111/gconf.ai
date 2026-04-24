'use client';

/**
 * Tiny shared sound bus: a single AudioContext + an enabled flag that any component can toggle.
 * Components subscribe to state changes via `useSoundEnabled()`.
 *
 * The enabled flag is persisted to localStorage so the user's preference
 * survives refreshes and repeat visits.
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'gconf:sound-enabled';

let audioCtx: AudioContext | null = null;
let enabled = true;
let hydrated = false;
const listeners = new Set<(v: boolean) => void>();

// Read the stored preference once, on first client-side access. Runs lazily
// from the hook's useEffect so the module stays SSR-safe (no window access
// at import time, no hydration mismatch — the server always renders with the
// default, and the hook syncs to the stored value after mount).
function hydrateFromStorage(): void {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === 'undefined') return;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'false') enabled = false;
    else if (stored === 'true') enabled = true;
  } catch {
    /* localStorage blocked (private mode / quota) — keep default */
  }
}

function persist(v: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  audioCtx = new Ctor();
  const resume = () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (audioCtx && audioCtx.state === 'running') {
      ['click', 'keydown', 'mousedown', 'mousemove', 'touchstart', 'scroll'].forEach(e =>
        document.removeEventListener(e, resume)
      );
    }
  };
  ['click', 'keydown', 'mousedown', 'mousemove', 'touchstart', 'scroll'].forEach(e =>
    document.addEventListener(e, resume, { passive: true })
  );
  return audioCtx;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  persist(v);
  listeners.forEach(fn => fn(v));
}

export function useSoundEnabled(): [boolean, (v: boolean) => void] {
  const [state, setState] = useState(enabled);
  useEffect(() => {
    hydrateFromStorage();
    // If the hydrated value differs from the initial SSR state, sync it in.
    if (state !== enabled) setState(enabled);
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [state, setSoundEnabled];
}

export function useTypeClick() {
  return useCallback((soft: boolean) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const volume = soft ? 0.015 : 0.03;
    const duration = soft ? 0.02 : 0.04;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(soft ? 800 : 400 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + duration);

    filter.type = 'highpass';
    filter.frequency.value = 200;

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);

    const bufLen = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = buf;
    noiseGain.gain.setValueAtTime(volume * 0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.8);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  }, []);
}
