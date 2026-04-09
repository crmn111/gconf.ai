'use client';

import { useEffect, useRef } from 'react';

const CELL = 32;
const GAP = 2;

const CYANS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 176, 194],
  [0, 200, 220],
  [0, 150, 170],
  [0, 120, 145],
  [0, 90, 115],
  [0, 65, 85],
  [20, 190, 210],
  [0, 140, 180],
  [0, 210, 200],
];

export function CanvasGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let cells = new Float32Array(0);
    let rafId = 0;
    const mouse = { x: -1000, y: -1000 };
    const timers: ReturnType<typeof setTimeout>[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / CELL) + 1;
      rows = Math.ceil(canvas.height / CELL) + 1;
      cells = new Float32Array(cols * rows);
    };

    const igniteRandom = () => {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let n = 0; n < count; n++) {
        const c = Math.floor(Math.random() * cols);
        const r = Math.floor(Math.random() * rows);
        cells[r * cols + c] = 0.6 + Math.random() * 0.4;
      }
      timers.push(setTimeout(igniteRandom, 80 + Math.random() * 250));
    };

    const igniteBurst = () => {
      const cx = Math.floor(Math.random() * cols);
      const cy = Math.floor(Math.random() * rows);
      const radius = 2 + Math.floor(Math.random() * 3);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
              const intensity = (1 - dist / radius) * (0.3 + Math.random() * 0.5);
              const idx = ny * cols + nx;
              cells[idx] = Math.min(1, cells[idx] + intensity);
            }
          }
        }
      }
      timers.push(setTimeout(igniteBurst, 2000 + Math.random() * 5000));
    };

    const drawSquares = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const size = CELL - GAP;
      const time = t * 0.001;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          let val = cells[idx];
          cells[idx] *= 0.97;

          const shimmer = (Math.sin(time * 0.5 + c * 0.3 + r * 0.2) * 0.5 + 0.5) * 0.02;
          val = Math.max(val, shimmer);

          if (val < 0.005) continue;

          const x = c * CELL;
          const y = r * CELL;
          const colorIdx = (c * 7 + r * 13) % CYANS.length;
          const [gr, gg, gb] = CYANS[colorIdx];

          const alpha = val * 0.7;
          ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${alpha})`;
          ctx.fillRect(x + GAP * 0.5, y + GAP * 0.5, size, size);

          if (val > 0.4) {
            const glowAlpha = (val - 0.4) * 0.3;
            ctx.shadowColor = `rgba(${gr}, ${gg}, ${gb}, ${glowAlpha})`;
            ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${glowAlpha * 0.5})`;
            ctx.fillRect(x + GAP * 0.5, y + GAP * 0.5, size, size);
            ctx.shadowBlur = 0;
          }
        }
      }

      // Mouse proximity glow, folded into the same frame
      if (mouse.x >= 0) {
        const mc = Math.floor(mouse.x / CELL);
        const mr = Math.floor(mouse.y / CELL);
        const rad = 3;
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const nx = mc + dx;
            const ny = mr + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= rad) {
                const intensity = (1 - dist / rad) * 0.12;
                const idx = ny * cols + nx;
                cells[idx] = Math.min(1, cells[idx] + intensity);
              }
            }
          }
        }
      }

      rafId = requestAnimationFrame(drawSquares);
    };

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -1000; mouse.y = -1000; };

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    resize();
    rafId = requestAnimationFrame(drawSquares);
    timers.push(setTimeout(igniteRandom, 500));
    timers.push(setTimeout(igniteBurst, 1500));

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  return <canvas id="grid" ref={canvasRef} />;
}
