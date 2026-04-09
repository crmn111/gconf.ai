'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle';
  life: number;
}

const COLORS = ['#00B0C2', '#00ffd5', '#ffffff', '#14e0f2', '#88eaf2'];

interface ConfettiProps {
  /** Monotonically increasing token — each new value triggers a burst. */
  burstKey: number;
  /** Number of particles per burst (default 120). */
  count?: number;
}

export function Confetti({ burstKey, count = 120 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  // Keep the canvas sized to the viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Fire a burst whenever burstKey changes (except the initial 0)
  useEffect(() => {
    if (burstKey === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Launch from the horizontal center, vertical middle of the viewport
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // slight upward bias
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        size: 5 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() < 0.7 ? 'rect' : 'circle',
        life: now,
      });
    }

    // Start the animation loop if it isn't already running
    if (rafRef.current == null) {
      const loop = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const ps = particlesRef.current;
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          p.vy += 0.18;           // gravity
          p.vx *= 0.995;          // drag
          p.vy *= 0.995;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vrot;

          // Remove off-screen / stale particles
          if (p.y > h + 40 || p.x < -40 || p.x > w + 40) {
            ps.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        if (ps.length > 0) {
          rafRef.current = requestAnimationFrame(loop);
        } else {
          rafRef.current = null;
          ctx.clearRect(0, 0, w, h);
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [burstKey, count]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
      }}
      aria-hidden
    />
  );
}
