import { useEffect, useRef } from 'react';

// Animated "market" backdrop for the lesson pages: faint grid, three slowly drifting price lines
// and floating particles. Canvas only, pauses when the tab is hidden, and is static for people
// who prefer reduced motion. It sits behind the page and never receives clicks.

const LINES = [
  { speed: 22, amp: 0.1, y: 0.3, alpha: 0.5, width: 2.2 },
  { speed: 14, amp: 0.13, y: 0.55, alpha: 0.35, width: 1.8 },
  { speed: 30, amp: 0.08, y: 0.78, alpha: 0.28, width: 1.5 },
];
const STEP = 46; // px between price points

function readColors() {
  const css = getComputedStyle(document.documentElement);
  const pick = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
  return { brand: pick('--brand', '#D6A84F'), brand2: pick('--brand2', '#F0C66E'), line: pick('--faint', '#2A2A35') };
}

function withAlpha(color, a) {
  const c = color.trim();
  if (c.startsWith('#')) {
    const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1, 7);
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  return c;
}

export default function LessonBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let colors = readColors();
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let running = true;

    const makeSeries = () => LINES.map((cfg) => {
      const count = Math.ceil(w / STEP) + 4;
      const pts = [];
      let v = 0;
      for (let i = 0; i < count; i += 1) {
        v += (Math.random() - 0.5) * 0.9;
        v *= 0.92;
        pts.push(v);
      }
      return { cfg, pts, offset: 0, v };
    });
    const makeDots = () => Array.from({ length: Math.round(Math.min(46, (w * h) / 38000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: 0.8 + Math.random() * 1.8, s: 6 + Math.random() * 12, a: 0.15 + Math.random() * 0.35,
    }));
    let series = [];
    let dots = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      series = makeSeries();
      dots = makeDots();
      draw(0);
    };

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);

      // faint grid
      ctx.strokeStyle = withAlpha(colors.line, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 120) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y < h; y += 120) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();

      // drifting price lines
      series.forEach((s) => {
        s.offset += s.cfg.speed * dt;
        while (s.offset >= STEP) {
          s.offset -= STEP;
          s.pts.shift();
          s.v += (Math.random() - 0.5) * 0.9;
          s.v *= 0.92;
          s.pts.push(s.v);
        }
        const baseY = h * s.cfg.y;
        const amp = h * s.cfg.amp;
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, withAlpha(colors.brand, 0));
        grad.addColorStop(0.25, withAlpha(colors.brand, s.cfg.alpha));
        grad.addColorStop(0.75, withAlpha(colors.brand2, s.cfg.alpha));
        grad.addColorStop(1, withAlpha(colors.brand2, 0));

        const pathLine = () => {
          ctx.beginPath();
          s.pts.forEach((p, i) => {
            const x = i * STEP - s.offset;
            const y = baseY + p * amp;
            if (i === 0) ctx.moveTo(x, y);
            else {
              const px = (i - 1) * STEP - s.offset;
              const py = baseY + s.pts[i - 1] * amp;
              ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
            }
          });
        };
        pathLine();
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.cfg.width + 5;
        ctx.globalAlpha = 0.18; // soft glow
        ctx.stroke();
        pathLine();
        ctx.lineWidth = s.cfg.width;
        ctx.globalAlpha = 1;
        ctx.stroke();
      });

      // floating particles
      dots.forEach((d) => {
        d.y -= d.s * dt;
        if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.fillStyle = withAlpha(colors.brand2, d.a);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const loop = (t) => {
      if (!running) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); }
      else cancelAnimationFrame(raf);
    };

    const themeObserver = new MutationObserver(() => { colors = readColors(); if (reduce) draw(0); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="lesson-backdrop" aria-hidden="true" />;
}
