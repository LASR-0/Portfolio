import { useEffect, useRef } from "react";

/* The ASCII field. Ported from the prototype's draw()/measure(), with the
   lifecycle the prototype never had (plan.md §11.2).

   The prototype rebuilt and reflowed the full text content of the <pre> every
   frame at 60fps, forever — roughly 12,000 characters at 1440 — including
   while the reader was at the footer. That is fixed here:

     - IntersectionObserver stops the loop when the hero leaves the viewport
     - visibilitychange stops it when the tab is backgrounded
     - frames are capped at 30fps; the effect does not read smoother at 60
     - cell size grows on small viewports, so a phone draws far fewer cells

   Reduced motion renders one static frame, never samples the cursor, and now
   responds to the setting changing at runtime (plan.md §11.3). */

const RAMP = " .:-=+*#%@";
const FPS = 30;
const FRAME_MS = 1000 / FPS;
const ASPECT = 0.6;

export default function HeroField() {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = { x: 0.15, y: 0.65 };

    let cols = 0;
    let rows = 0;
    let cellH = 13;
    let raf = 0;
    let t0 = 0;
    let last = 0;
    let visible = true;
    let onscreen = true;

    const measure = () => {
      // Bigger cells on narrow viewports: fewer characters to build per frame.
      cellH = window.innerWidth < 700 ? 18 : 13;
      el.style.fontSize = `${cellH}px`;
      el.style.lineHeight = `${cellH}px`;
      cols = Math.max(20, Math.floor(el.clientWidth / (cellH * ASPECT)));
      rows = Math.max(10, Math.floor(el.clientHeight / cellH));
    };

    const draw = (t: number) => {
      if (!cols) return;
      const mx = (mouse.x - 0.5) * 2 * 1.7;
      const my = (mouse.y - 0.5) * 2;
      const ease = Math.min(1, t / 1.1);
      let out = "";
      for (let y = 0; y < rows; y++) {
        const py = (y / rows - 0.5) * 2;
        for (let x = 0; x < cols; x++) {
          const px = (x / cols - 0.5) * 2 * 1.7;
          const dx = px - mx;
          const dy = py - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          let v = Math.sin(d * 6.5 - t * 1.9) * Math.exp(-d * 0.85);
          v += 0.55 * Math.sin(px * 2.4 + t * 0.35) * Math.cos(py * 2.9 - t * 0.28);
          v += 0.28 * Math.sin((px + py) * 5.1 - t * 0.6);
          v *= ease;
          let i = Math.round((v * 0.5 + 0.5) * (RAMP.length - 1));
          if (i < 0) i = 0;
          if (i > RAMP.length - 1) i = RAMP.length - 1;
          out += RAMP[i];
        }
        out += "\n";
      }
      el.textContent = out;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw((now - t0) / 1000);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const start = () => {
      if (raf || mq.matches || !visible || !onscreen) return;
      if (!t0) t0 = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const sync = () => {
      if (mq.matches) {
        stop();
        draw(1.2); // one static frame
      } else {
        start();
      }
    };

    const onResize = () => {
      measure();
      if (mq.matches) draw(1.2);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (mq.matches) return;
      const r = el.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
    };

    const onVisibility = () => {
      visible = !document.hidden;
      visible ? sync() : stop();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting;
        onscreen ? sync() : stop();
      },
      { threshold: 0 },
    );

    measure();
    sync();

    const host = el.parentElement ?? el;
    io.observe(el);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("pointermove", onPointerMove);
    mq.addEventListener("change", sync);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onPointerMove);
      mq.removeEventListener("change", sync);
    };
  }, []);

  return <pre ref={ref} className="hero__field" aria-hidden="true" />;
}
