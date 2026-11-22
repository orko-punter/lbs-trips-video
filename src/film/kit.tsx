import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";

// ---------------------------------------------------------------------------
// Look
// ---------------------------------------------------------------------------

const geist = loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const geistMono = loadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] });
const fraunces = loadFraunces("normal", { weights: ["500", "600"], subsets: ["latin"] });

/** The fonts the app's design system expects (next/font sets these variables in the app). */
export const FONT_VARS = {
  "--font-geist-sans": geist.fontFamily,
  "--font-geist-mono": geistMono.fontFamily,
  "--font-fraunces": fraunces.fontFamily,
} as React.CSSProperties;

export const DISPLAY = fraunces.fontFamily;
export const SANS = geist.fontFamily;
export const NAVY = "#131a2e";
export const NAVY_2 = "#1b2442";
export const GOLD = "#e7bb62";
export const W = 1920;
export const H = 1080;

/** The app is laid out at a 1440 × 900 laptop viewport, then framed in the film. */
export const APP_W = 1440;
export const APP_H = 900;
export const WIN_SCALE = 0.86;
export const WIN = { left: W - APP_W * WIN_SCALE - 96, top: (H - APP_H * WIN_SCALE) / 2 };

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 → 1 over [start, start + duration], eased. */
export const ramp = (frame: number, start: number, duration: number, easing = easeOut) =>
  interpolate(frame, [start, start + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Background: night sky with a slow drift
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 140 }, (_, i) => ({
  x: random(`x${i}`) * W,
  y: random(`y${i}`) * H,
  r: 0.6 + random(`r${i}`) * 1.4,
  a: 0.15 + random(`a${i}`) * 0.5,
  speed: 0.04 + random(`s${i}`) * 0.12,
  phase: random(`p${i}`) * Math.PI * 2,
}));

export function NightSky() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 70% 110%, ${NAVY_2} 0%, ${NAVY} 60%, #0d1222 100%)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {STARS.map((s, i) => (
          <circle key={i} cx={(s.x + frame * s.speed) % W} cy={s.y} r={s.r} fill="#fff" opacity={s.a * (0.75 + 0.25 * Math.sin(frame / 40 + s.phase))} />
        ))}
      </svg>
      {/* A soft gold horizon glow, like the front page. */}
      <div style={{ position: "absolute", left: "50%", bottom: -420, width: 1600, height: 700, transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(231,187,98,0.16), rgba(231,187,98,0))" }} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
// Camera: a zoom on the app, described by the point in the app to centre and a scale
// ---------------------------------------------------------------------------

export type Cam = { x: number; y: number; s: number };
export const WIDE: Cam = { x: APP_W / 2, y: APP_H / 2, s: 1 };

/** Camera at `frame`, from keyframes [frame, cam]; each move eases in and out. */
export function camAt(frame: number, keys: [number, Cam][]): Cam {
  if (frame <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, c1] = keys[i]!;
    const [f0, c0] = keys[i - 1]!;
    if (frame <= f1) {
      const t = interpolate(frame, [f0, f1], [0, 1], { easing: easeInOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { x: mix(c0.x, c1.x, t), y: mix(c0.y, c1.y, t), s: mix(c0.s, c1.s, t) };
    }
  }
  return keys[keys.length - 1]![1];
}

/** Where the app's top-left lands inside the window for a camera, never showing past the app's edges. */
export function camOffset(cam: Cam) {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  return {
    tx: clamp(APP_W / 2 - cam.s * cam.x, APP_W - cam.s * APP_W, 0),
    ty: clamp(APP_H / 2 - cam.s * cam.y, APP_H - cam.s * APP_H, 0),
  };
}

/** A point in the app → the same point in the window (both 1440 × 900 before framing). */
export const toWindow = (cam: Cam, p: { x: number; y: number }) => {
  const { tx, ty } = camOffset(cam);
  return { x: tx + cam.s * p.x, y: ty + cam.s * p.y };
};

// ---------------------------------------------------------------------------
// Measuring the real UI: where an element of the app sits, in app coordinates
// ---------------------------------------------------------------------------

export type Rect = { x: number; y: number; w: number; h: number };
export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/**
 * Finds elements in the rendered app and reports their boxes (unaffected by the camera).
 * Measured on every frame, from the content box inside the camera, so every render tab gets the
 * same numbers for the same frame however it got there (no state carried between frames).
 */
export function useAnchors(find: Record<string, (root: HTMLElement) => Element | null | undefined>, _deps?: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Measure without the camera, so the numbers never depend on where the camera points.
    const cameraTransform = root.style.transform;
    root.style.transform = "none";
    const base = (root.firstElementChild as HTMLElement | null) ?? root;
    const box = base.getBoundingClientRect();
    const ratio = box.width / base.offsetWidth || 1;
    const next: Record<string, Rect> = {};
    for (const [key, fn] of Object.entries(find)) {
      const el = fn(root);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const round = (v: number) => Math.round(v * 4) / 4;
      next[key] = { x: round((r.left - box.left) / ratio), y: round((r.top - box.top) / ratio), w: round(r.width / ratio), h: round(r.height / ratio) };
    }
    root.style.transform = cameraTransform;
    setRects((prev) => (JSON.stringify(next) === JSON.stringify(prev) ? prev : next));
  });
  return { ref, rects };
}

export const byText = (root: HTMLElement, selector: string, text: string, nth = 0) =>
  [...root.querySelectorAll(selector)].filter((el) => (el.textContent ?? "").replace(/\s+/g, " ").includes(text))[nth];

// ---------------------------------------------------------------------------
// The app window: a floating screen with a camera inside
// ---------------------------------------------------------------------------

export function AppWindow({ cam, children, enter, exit, contentRef, overlay }: { cam: Cam; children: React.ReactNode; enter: number; exit: number; contentRef?: React.Ref<HTMLDivElement>; overlay?: React.ReactNode }) {
  const { tx, ty } = camOffset(cam);
  // Rises in with a little perspective, settles flat; falls back and fades on the way out.
  const y = mix(80, 0, enter) + mix(0, -30, exit);
  const tilt = mix(10, 0, enter);
  const scale = WIN_SCALE * mix(0.94, 1, enter) * mix(1, 0.92, exit);
  const opacity = Math.min(enter, 1 - exit);
  return (
    <div style={{ position: "absolute", left: WIN.left, top: WIN.top, width: APP_W, height: APP_H, transformOrigin: "0 0", transform: `translateY(${y}px) perspective(2400px) rotateX(${tilt}deg) scale(${scale})`, opacity }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 26, boxShadow: "0 60px 140px -30px rgba(0,0,0,0.65), 0 20px 50px -20px rgba(0,0,0,0.45)" }} />
      <div className="bg-background text-foreground font-sans" style={{ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", outline: "1px solid rgba(255,255,255,0.10)", outlineOffset: -1 }}>
        <div ref={contentRef} style={{ position: "absolute", left: 0, top: 0, width: APP_W, height: APP_H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${cam.s})` }}>
          {children}
        </div>
        {overlay}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attention: spotlight, cursor, click ring
// ---------------------------------------------------------------------------

/** Dims everything but one element (window coordinates), with a gold hairline around it. */
export function Spotlight({ rect, cam, strength, pad = 10, radius = 18 }: { rect?: Rect; cam: Cam; strength: number; pad?: number; radius?: number }) {
  if (!rect || strength <= 0.001) return null;
  const a = toWindow(cam, { x: rect.x, y: rect.y });
  const w = rect.w * cam.s;
  const h = rect.h * cam.s;
  return (
    <div
      style={{
        position: "absolute",
        left: a.x - pad,
        top: a.y - pad,
        width: w + pad * 2,
        height: h + pad * 2,
        borderRadius: radius,
        boxShadow: `0 0 0 2px rgba(231,187,98,${0.9 * strength}), 0 0 0 4000px rgba(12,16,30,${0.28 * strength})`,
        pointerEvents: "none",
      }}
    />
  );
}

export type CursorKey = { f: number; x: number; y: number; click?: boolean };

/** A cursor that glides between points (app coordinates) and clicks with a ring. */
export function Cursor({ cam, keys, frame, visible }: { cam: Cam; keys: CursorKey[]; frame: number; visible: number }) {
  if (keys.length === 0 || visible <= 0) return null;
  let p = { x: keys[0]!.x, y: keys[0]!.y };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!;
    const b = keys[i]!;
    if (frame >= a.f && frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { easing: easeInOut });
      p = { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
      break;
    }
    if (frame > b.f) p = { x: b.x, y: b.y };
  }
  const click = [...keys].reverse().find((k) => k.click && frame >= k.f && frame < k.f + 22);
  const since = click ? frame - click.f : 0;
  const press = click ? interpolate(since, [0, 4, 10], [1, 0.82, 1], { extrapolateRight: "clamp" }) : 1;
  const w = toWindow(cam, p);
  return (
    <>
      {click && (
        <div style={{ position: "absolute", left: w.x, top: w.y, width: 0, height: 0 }}>
          <div style={{ position: "absolute", left: -6 - since * 1.6, top: -6 - since * 1.6, width: 12 + since * 3.2, height: 12 + since * 3.2, borderRadius: "50%", border: `2px solid rgba(231,187,98,${1 - since / 22})` }} />
        </div>
      )}
      <svg width={30} height={30} viewBox="0 0 24 24" style={{ position: "absolute", left: w.x - 3, top: w.y - 2, opacity: visible, transform: `scale(${press})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.35))" }}>
        <path d="M4 2.5 L4 19.5 L8.6 15.4 L11.6 21.8 L14.4 20.6 L11.4 14.3 L17.6 14.3 Z" fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </>
  );
}

/** A "return" key that pops beside a field when the answer is sent (app coordinates). */
export function KeyCap({ cam, at, frame, start }: { cam: Cam; at: { x: number; y: number }; frame: number; start: number }) {
  const t = frame - start;
  if (t < 0 || t > 30) return null;
  const inn = ramp(frame, start, 6);
  const out = ramp(frame, start + 20, 10);
  const press = interpolate(t, [4, 8, 13], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = toWindow(cam, at);
  return (
    <div
      style={{
        position: "absolute",
        left: w.x,
        top: w.y,
        transform: `translate(-50%, -50%) translateY(${mix(8, 0, inn)}px) scale(${press})`,
        opacity: inn * (1 - out),
        fontFamily: SANS,
        fontSize: 22,
        fontWeight: 600,
        color: "#1a2238",
        padding: "10px 18px",
        borderRadius: 12,
        background: "#fff",
        boxShadow: `0 ${mix(5, 2, 1 - press)}px 0 #c9cdd6, 0 12px 30px -10px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)`,
        whiteSpace: "nowrap",
      }}
    >
      return ⏎
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type
// ---------------------------------------------------------------------------

/** A line that arrives word by word on a spring and leaves upwards. */
export function Words({ text, start, end, size = 64, color = "#fff", gold = [], align = "left", width, lineHeight = 1.08 }: { text: string; start: number; end: number; size?: number; color?: string; gold?: string[]; align?: "left" | "center"; width?: number; lineHeight?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = ramp(frame, end - 14, 14, Easing.in(Easing.cubic));
  const words = text.split(" ");
  return (
    <div style={{ fontFamily: DISPLAY, fontSize: size, fontWeight: 500, lineHeight, letterSpacing: "-0.02em", color, textAlign: align, width, opacity: 1 - out, transform: `translateY(${-24 * out}px)`, fontVariationSettings: '"SOFT" 30' }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - start - i * 4, fps, config: { damping: 200, mass: 0.6 } });
        const isGold = gold.includes(w.replace(/[.,?]/g, ""));
        return (
          <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${mix(28, 0, s)}px)`, filter: `blur(${mix(6, 0, s)}px)`, color: isGold ? GOLD : undefined, marginRight: i < words.length - 1 ? "0.24em" : 0 }}>
            {w}
          </span>
        );
      })}
    </div>
  );
}

/** Small spaced label above a line. */
export function Label({ text, start, end }: { text: string; start: number; end: number }) {
  const frame = useCurrentFrame();
  const o = Math.min(ramp(frame, start, 16), 1 - ramp(frame, end - 12, 12));
  return (
    <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, opacity: o, transform: `translateY(${mix(10, 0, ramp(frame, start, 16))}px)`, marginBottom: 22 }}>
      {text}
    </div>
  );
}
