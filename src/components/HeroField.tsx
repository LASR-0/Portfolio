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

/* The field's shape. Each pattern maps a cell's normalised position and the
   cursor to a wave height in roughly -1..1; draw() handles ramp, ease and
   colour, so swapping PATTERN below changes the character field and the wash
   beneath it together — they read the same value by design.

   px/py are -1.7..1.7 and -1..1. mx/my are the cursor in the same space. */
/* Lava lamp blobs. Each rises and falls on its own slow cycle with an
   independent horizontal wobble; the periods are deliberately unrelated so the
   arrangement never visibly repeats. R is the radius of support and s the
   strength — seven of them, because with five the band went fully empty
   whenever several drifted out of frame at once. As tuned, empty ground stays
   between roughly 23% and 50% across a full cycle. */
const LAVA = [
  { x: -1.30, ax: 0.26, wx: 0.21, phx: 0.0, ay: 1.05, wy: 0.170, phy: 0.0, R: 0.82, s: 1.00 },
  { x: -0.62, ax: 0.34, wx: 0.16, phx: 1.9, ay: 0.95, wy: 0.131, phy: 2.3, R: 0.95, s: 1.10 },
  { x: 0.05, ax: 0.30, wx: 0.19, phx: 3.4, ay: 1.10, wy: 0.149, phy: 4.1, R: 0.88, s: 1.05 },
  { x: 0.72, ax: 0.28, wx: 0.14, phx: 5.2, ay: 1.00, wy: 0.113, phy: 0.9, R: 0.76, s: 0.95 },
  { x: 1.34, ax: 0.44, wx: 0.09, phx: 2.7, ay: 0.90, wy: 0.191, phy: 5.6, R: 0.80, s: 0.95 },
  { x: -0.95, ax: 0.38, wx: 0.12, phx: 4.4, ay: 1.15, wy: 0.101, phy: 3.2, R: 0.70, s: 0.85 },
  { x: 0.45, ax: 0.32, wx: 0.23, phx: 0.7, ay: 1.20, wy: 0.163, phy: 1.4, R: 0.72, s: 0.88 },
];

/* Surface threshold and edge gain. TH is where the membrane sits in the summed
   field; GAIN steepens the shoulder so a blob edge reads as a boundary rather
   than a slow gradient. */
const LAVA_TH = 0.45;
const LAVA_GAIN = 2.6;
const LAVA_MR = 0.62; // cursor blob radius
const LAVA_MS = 0.80; // cursor blob strength

/* Galaxy. INCL flattens the disc into an ellipse so it sits in a wide band the
   way an inclined disc would; WIND is the winding of the logarithmic spiral and
   SHARP narrows the arms against the space between them. */
const GX = {
  ARMS: 2,
  WIND: 4.2,
  INCL: 0.68,
  SPIN: 0.22,
  CORE: 6.0, // nucleus tightness
  COREW: 1.35, // nucleus brightness
  DISC: 1.3, // disc falloff — higher fades the halo sooner
  ARMW: 1.85, // arm brightness
  SHARP: 2.6,
  TH: 0.38,
  GAIN: 3.0,
  DUST: 0.09,
};

const PATTERNS = {
  /* Cursor ripple over a slow standing swell and a diagonal travelling wave.
     Reads as disturbed water. */
  ripple: (px: number, py: number, mx: number, my: number, t: number) => {
    const dx = px - mx;
    const dy = py - my;
    const d = Math.sqrt(dx * dx + dy * dy);
    let v = Math.sin(d * 6.5 - t * 1.9) * Math.exp(-d * 0.85);
    v += 0.55 * Math.sin(px * 2.4 + t * 0.35) * Math.cos(py * 2.9 - t * 0.28);
    v += 0.28 * Math.sin((px + py) * 5.1 - t * 0.6);
    return v;
  },

  /* Topographic survey lines. A smooth height field is sliced at fixed
     intervals, so the marks land on the contours rather than filling the
     band — nested rings that drift and reshape around the cursor's basin.
     Closest to the drafting language the rest of the page is set in. */
  contour: (px: number, py: number, mx: number, my: number, t: number) => {
    const dx = px - mx;
    const dy = py - my;
    let h = Math.sin(px * 1.9 + t * 0.22) * Math.cos(py * 2.3 - t * 0.18);
    h += 0.6 * Math.sin((px * 0.8 + py * 1.4) * 1.7 + t * 0.15);
    h -= 1.35 * Math.exp(-(dx * dx + dy * dy) * 0.6); // cursor sinks a basin
    const f = h * 4.5; // slice count
    // Distance to the nearest slice, 0 on a line and 1 between them.
    const ridge = Math.abs(f - Math.round(f)) * 2;
    return 1 - ridge * 1.6;
  },

  /* Three point sources beating against each other, one of them the cursor.
     Moire fringes that bloom and collapse as the sources drift. */
  interference: (px: number, py: number, mx: number, my: number, t: number) => {
    const ax = px - mx;
    const ay = py - my;
    const bx = px + 1.1;
    const by = py - 0.6 + Math.sin(t * 0.3) * 0.45;
    const cx = px - 1.0;
    const cy = py + 0.7 - Math.cos(t * 0.24) * 0.45;
    const a = Math.sqrt(ax * ax + ay * ay);
    const b = Math.sqrt(bx * bx + by * by);
    const c = Math.sqrt(cx * cx + cy * cy);
    let v = Math.sin(a * 7.0 - t * 2.0) * Math.exp(-a * 0.7);
    v += Math.sin(b * 6.0 - t * 1.5) * Math.exp(-b * 0.5);
    v += Math.sin(c * 6.6 + t * 1.7) * Math.exp(-c * 0.5);
    return v * 0.62;
  },

  /* Lava lamp. Blobs are summed, and it is the sum that makes neighbours
     stretch toward each other and fuse into one mass instead of merely
     overlapping — the whole read of the thing. The cursor is an extra blob, so
     the lamp reaches for the pointer and pinches off again when it leaves.

     The kernel has finite support: a blob contributes nothing beyond R, so the
     ground between blobs is genuinely empty. An inverse-square falloff was
     tried first and its tail never decays, so seven of them summed to a floor
     that filled the band edge to edge with no bare paper anywhere.

     Blob centres depend only on t, so they are computed once per frame and
     reused across every cell. Done naively this is 84,000 sin() calls a frame
     at 1440 rather than fourteen — the one place in this file where the
     per-cell budget actually bites. */
  lava: (() => {
    const cx = new Float64Array(LAVA.length);
    const cy = new Float64Array(LAVA.length);
    let frame = Number.NaN;

    return (px: number, py: number, mx: number, my: number, t: number) => {
      if (t !== frame) {
        frame = t;
        for (let i = 0; i < LAVA.length; i++) {
          const b = LAVA[i];
          cx[i] = b.x + Math.sin(t * b.wx + b.phx) * b.ax;
          cy[i] = Math.sin(t * b.wy + b.phy) * b.ay;
        }
      }

      let f = 0;
      for (let i = 0; i < LAVA.length; i++) {
        const b = LAVA[i];
        const dx = px - cx[i];
        const dy = py - cy[i];
        const dd = dx * dx + dy * dy;
        const rr = b.R * b.R;
        if (dd < rr) {
          const u = 1 - dd / rr;
          f += b.s * u * u * u; // cubic falloff, smooth at the rim
        }
      }

      const mdx = px - mx;
      const mdy = py - my;
      const mdd = mdx * mdx + mdy * mdy;
      const mrr = LAVA_MR * LAVA_MR;
      if (mdd < mrr) {
        const u = 1 - mdd / mrr;
        f += LAVA_MS * u * u * u;
      }

      return (f - LAVA_TH) * LAVA_GAIN;
    };
  })(),

  /* Spiral galaxy: a bright nucleus, a disc that fades outward, and two
     logarithmic arms wound through it. The centre leans toward the cursor, so
     the whole spiral shifts and the arms re-present as the pointer moves.

     The arms rotate rigidly. Differential rotation — inner radii sweeping
     faster, which is what real galaxies do — was the obvious first choice and
     is wrong here: its phase gradient grows with elapsed time, so on a page
     left open the inner arms wind tighter until they alias into noise against
     the character grid. Rigid rotation keeps the spatial gradient independent
     of t, so the field is as clean after six hours as at load, and the log
     term supplies the spiral shape that the differential term was there for.

     atan2 and log per cell are pricier than the sin() the other patterns use,
     but at 30fps and ~12,000 cells it is still well inside the frame budget. */
  galaxy: (px: number, py: number, mx: number, my: number, t: number) => {
    const dx = px - mx * 0.35;
    const dy = (py - my * 0.35) / GX.INCL;
    const r = Math.sqrt(dx * dx + dy * dy);
    const th = Math.atan2(dy, dx);

    // +0.12 keeps the log finite at the centre, which the nucleus covers anyway.
    const phase = GX.ARMS * (th + GX.SPIN * t) - GX.WIND * Math.log(r + 0.12);
    let arm = Math.cos(phase) * 0.5 + 0.5;
    arm = Math.pow(arm, GX.SHARP);

    const core = Math.exp(-r * r * GX.CORE);
    const disc = Math.exp(-r * GX.DISC);
    /* Dust is gated by the disc envelope — ungated it speckled the bare band
       out to the corners, well past where the galaxy ends. */
    const dust =
      GX.DUST * disc * Math.sin(px * 23 + py * 17) * Math.sin(px * 13 - py * 29);

    return (core * GX.COREW + disc * arm * GX.ARMW + dust - GX.TH) * GX.GAIN;
  },
};

/* Swap this: "ripple" | "contour" | "interference" | "lava" | "galaxy". */
const PATTERN: keyof typeof PATTERNS = "interference";
const field = PATTERNS[PATTERN];

/* Wash colour, read from the design tokens instead of baked into the draw
   loop. tokens.css is the single source of truth (§4) and the ported prototype
   broke that rule: the crest was --vermilion copied in as raw RGB and the
   trough was a brown that existed nowhere else, so retuning the accent left the
   wash behind. Fallbacks are the prototype's original values, used only if a
   token is missing or unparseable. */
const WASH_FALLBACK_TROUGH: RGB = [112, 62, 28];
const WASH_FALLBACK_CREST: RGB = [232, 69, 43];
const WASH_ALPHA = 240; // peak alpha at the crests

type RGB = [number, number, number];

const parseRGB = (css: string): RGB | null => {
  const v = css.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v);
  return fn ? [+fn[1], +fn[2], +fn[3]] : null;
};

const readToken = (name: string, fallback: RGB): RGB => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  return parseRGB(raw) ?? fallback;
};

export default function HeroField() {
  const ref = useRef<HTMLPreElement>(null);
  const washRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    const wash = washRef.current;
    if (!el || !wash) return;
    const wctx = wash.getContext("2d", { alpha: true });

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
    let img: ImageData | null = null;

    /* Resolved once on mount and held as scalars with the ramp pre-subtracted,
       so the per-cell work below is one multiply-add per channel — less than
       the literals it replaces, not more. */
    let wR = 0;
    let wG = 0;
    let wB = 0;
    let wDR = 0;
    let wDG = 0;
    let wDB = 0;

    const readWash = () => {
      const [tr, tg, tb] = readToken("--wash-trough", WASH_FALLBACK_TROUGH);
      const [cr, cg, cb] = readToken("--vermilion", WASH_FALLBACK_CREST);
      wR = tr;
      wG = tg;
      wB = tb;
      wDR = cr - tr;
      wDG = cg - tg;
      wDB = cb - tb;
    };

    const measure = () => {
      // Bigger cells on narrow viewports: fewer characters to build per frame.
      cellH = window.innerWidth < 700 ? 18 : 13;
      el.style.fontSize = `${cellH}px`;
      el.style.lineHeight = `${cellH}px`;
      cols = Math.max(20, Math.floor(el.clientWidth / (cellH * ASPECT)));
      rows = Math.max(10, Math.floor(el.clientHeight / cellH));

      /* The colour wash is drawn on the SAME grid as the characters, one pixel
         per cell, then stretched and blurred by CSS. That is what makes it move
         with the field rather than beside it — both read the same v below. */
      wash.width = cols;
      wash.height = rows;
      img = wctx ? wctx.createImageData(cols, rows) : null;
    };

    const draw = (t: number) => {
      if (!cols) return;
      const mx = (mouse.x - 0.5) * 2 * 1.7;
      const my = (mouse.y - 0.5) * 2;
      const ease = Math.min(1, t / 1.1);
      let out = "";
      const px32 = img ? img.data : null;
      let o = 0;
      for (let y = 0; y < rows; y++) {
        const py = (y / rows - 0.5) * 2;
        for (let x = 0; x < cols; x++) {
          const px = (x / cols - 0.5) * 2 * 1.7;
          /* One monomorphic call per cell — V8 inlines it, so the swappable
             table costs nothing against the per-frame budget above. */
          const v = field(px, py, mx, my, t) * ease;
          let n = v * 0.5 + 0.5;
          if (n < 0) n = 0;
          if (n > 1) n = 1;

          let i = Math.round(n * (RAMP.length - 1));
          if (i < 0) i = 0;
          if (i > RAMP.length - 1) i = RAMP.length - 1;
          out += RAMP[i];

          if (px32) {
            /* --wash-trough through to --vermilion at the crests. Alpha rises
               as n^3 so troughs stay bare paper and the wave keeps its shape;
               a flatter curve washes the whole band pink. */
            const a = n * n * n;
            px32[o]     = wR + wDR * n;
            px32[o + 1] = wG + wDG * n;
            px32[o + 2] = wB + wDB * n;
            px32[o + 3] = a * WASH_ALPHA;
            o += 4;
          }
        }
        out += "\n";
      }
      el.textContent = out;
      if (wctx && img) wctx.putImageData(img, 0, 0);
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

    readWash();
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

  return (
    <>
      <canvas ref={washRef} className="hero__wash" aria-hidden="true" />
      <pre ref={ref} className="hero__field" aria-hidden="true" />
    </>
  );
}
