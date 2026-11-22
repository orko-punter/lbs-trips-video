import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TripCard } from "@/components/site/trip-card";
import { LogoMark } from "@/components/shared/logo";
import type { SeatStats } from "@/lib/db/trips";
import type { Trip } from "@/lib/types";
import { DISPLAY, GOLD, Label, NAVY, SANS, Words, easeInOut, mix, ramp } from "./kit";

// ---------------------------------------------------------------------------
// Shot 1: the hook
// ---------------------------------------------------------------------------

const CHAOS = [
  { text: "40 open tabs", x: 470, y: 330, r: -4, at: 50 },
  { text: "3 spreadsheets", x: 1290, y: 360, r: 3, at: 60 },
  { text: "1 endless group chat", x: 820, y: 700, r: -2, at: 70 },
];

export function Hook() {
  const frame = useCurrentFrame();
  const sweep = ramp(frame, 94, 24, easeInOut);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateX(${mix(0, -420, sweep)}px) scale(${mix(1, 0.8, sweep)})`, opacity: 1 - sweep }}>
          <Words text="Planning a trip for twenty?" start={10} end={120} size={104} align="center" width={1400} gold={["twenty"]} />
        </div>
      </AbsoluteFill>
      {CHAOS.map((c, i) => {
        const inn = ramp(frame, c.at, 18);
        const out = ramp(frame, 88 + i * 3, 22, easeInOut);
        const drift = Math.sin((frame + i * 30) / 26) * 6;
        return (
          <div
            key={c.text}
            style={{
              position: "absolute",
              left: c.x + mix(0, i === 1 ? 520 : -520, out),
              top: c.y + mix(18, 0, inn) + drift,
              transform: `rotate(${c.r}deg) scale(${mix(0.9, 1, inn)})`,
              opacity: inn * (1 - out),
              fontFamily: SANS,
              fontSize: 26,
              fontWeight: 500,
              color: "rgba(255,255,255,0.86)",
              padding: "14px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.16)",
              filter: `blur(${mix(0, 6, out)}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {c.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
// Captions beside the app window
// ---------------------------------------------------------------------------

const CAPTIONS = [
  { label: "Step 1", text: "Answer a few questions.", start: 136, end: 330 },
  { label: "Step 2", text: "We research the rest.", start: 334, end: 450 },
  { label: "Step 3", text: "Pick what fits.", start: 456, end: 640 },
  { label: "Step 4", text: "The price follows every choice.", start: 644, end: 780 },
];

export function Captions() {
  return (
    <>
      {CAPTIONS.map((c) => (
        <div key={c.text} style={{ position: "absolute", left: 96, top: 0, bottom: 0, width: 420, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Label text={c.label} start={c.start} end={c.end} />
          <Words text={c.text} start={c.start + 4} end={c.end} size={60} width={420} />
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shot 5: published, as members see it
// ---------------------------------------------------------------------------

const trip = (id: string, title: string, destination: string, startDate: string, endDate: string, pre: number, main: number): Trip =>
  ({
    id,
    clubId: "default",
    organiserId: "",
    slug: id,
    status: "published",
    title,
    destination,
    startDate,
    endDate,
    images: [],
    price: main,
    currency: "GBP",
    capacity: 20,
    waitlistEnabled: true,
    releasePhases: [
      { key: "pre", enabled: true, startsAt: "", price: pre, announceByEmail: false },
      { key: "main", enabled: true, startsAt: "2027-01-15T10:00:00.000Z", price: main, announceByEmail: false },
      { key: "late", enabled: false, startsAt: "", price: main, announceByEmail: false },
    ],
  }) as unknown as Trip;

/** The Lisbon price is the per-person total the planner showed after the pick, rounded to a ticket price. */
export const LISBON_PRICE = 52_500;

const CARDS: { trip: Trip; seats: SeatStats }[] = [
  { trip: trip("t-edinburgh", "Edinburgh Fringe weekend", "Edinburgh", "2027-08-13", "2027-08-16", 32_000, 36_000), seats: { capacity: 30, taken: 26, available: 4 } as SeatStats },
  { trip: trip("t-lisbon", "Long weekend in Lisbon", "Lisbon", "2027-03-05", "2027-03-08", LISBON_PRICE, LISBON_PRICE + 6_000), seats: { capacity: 20, taken: 6, available: 14 } as SeatStats },
  { trip: trip("t-alps", "Ski week in the Alps", "Chamonix", "2027-01-23", "2027-01-30", 89_000, 98_000), seats: { capacity: 24, taken: 11, available: 13 } as SeatStats },
];

export function Published({ from }: { from: number }) {
  const frame = useCurrentFrame();
  const out = ramp(frame, from + 136, 22, easeInOut);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Label text="Step 5" start={from + 4} end={from + 160} />
        <Words text="Publish it. Your group books." start={from + 8} end={from + 170} size={72} align="center" width={1400} />
      </div>
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 44 }}>
        {CARDS.map((c, i) => {
          const front = i === 1;
          const at = from + (front ? 10 : 22);
          const inn = ramp(frame, at, 34);
          const s = front ? mix(0.9, 1.08, inn) : mix(0.88, 0.96, inn);
          return (
            <div
              key={c.trip.id}
              className="text-foreground font-sans"
              style={{
                width: 440,
                transform: `translateY(${mix(120, front ? -10 : 34, inn)}px) scale(${s})`,
                opacity: inn * (front ? 1 : 0.62),
                filter: front ? "none" : `blur(${mix(4, 1.2, inn)}px)`,
                zIndex: front ? 2 : 1,
                borderRadius: 24,
                boxShadow: front ? `0 40px 90px -30px rgba(0,0,0,0.7), 0 0 0 ${mix(0, 2, ramp(frame, from + 60, 16))}px ${GOLD}` : "0 30px 70px -30px rgba(0,0,0,0.6)",
              }}
            >
              <TripCard trip={c.trip} seats={c.seats} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
// Shot 6: the end card, fading back to navy for the loop
// ---------------------------------------------------------------------------

export function Outro({ from, duration }: { from: number; duration: number }) {
  const frame = useCurrentFrame();
  const logo = ramp(frame, from + 6, 26);
  const addr = ramp(frame, from + 50, 20);
  const fade = interpolate(frame, [from + duration - 34, from + duration - 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34, opacity: 1 - fade }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: logo, transform: `translateY(${mix(16, 0, logo)}px)` }}>
        <LogoMark className="size-16 rounded-2xl [&>svg]:size-8" />
        <span style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>LBS Trips</span>
      </div>
      <Words text="Plan your next trip" start={from + 22} end={from + duration + 40} size={112} align="center" width={1500} gold={["next", "trip"]} />
      <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 500, letterSpacing: "0.08em", color: "rgba(255,255,255,0.72)", opacity: addr, transform: `translateY(${mix(10, 0, addr)}px)` }}>lbstrips.com</div>
    </AbsoluteFill>
  );
}

/** Pure navy over everything at the very start and end, so the loop joins without a seam. */
export function LoopSeam({ total }: { total: number }) {
  const frame = useCurrentFrame();
  const o = Math.max(1 - ramp(frame, 0, 10), ramp(frame, total - 8, 8));
  return o > 0 ? <AbsoluteFill style={{ background: NAVY, opacity: o }} /> : null;
}
