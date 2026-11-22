import { memo, useLayoutEffect } from "react";
import { BedDoubleIcon, CheckIcon, Loader2Icon, MapIcon, PiggyBankIcon, PlaneIcon, XIcon } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { AdminShell } from "@/components/admin/admin-shell";
import { PlannerFunnel } from "@/components/admin/planner-funnel";
import type { PlanSession } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { DESTINATION_STEP, PICK_AFTER, PICK_BEFORE, TRAVELLERS_STEP, pickStep } from "../demo";
import { APP_H, APP_W, AppWindow, type Cam, Cursor, type CursorKey, KeyCap, Spotlight, WIDE, byText, camAt, centre, mix, ramp, useAnchors } from "./kit";

/**
 * Shots 2–4: the app window. The planner screens are the app's own PlannerFunnel inside its
 * console shell, fed demo plans; the camera, cursor and spotlight are layered on top.
 */

export const APP_IN = 110;
export const APP_OUT = 772;
const DEST = { from: APP_IN, to: 252 };
const PEOPLE = { from: 252, to: 330 };
const RESEARCH = { from: 330, to: 450 };
const PICK = { from: 450, to: 800 };
const CLICK_STAY = 640;
const PICK_SESSIONS: Record<string, PlanSession> = { [PICK_BEFORE]: pickStep(PICK_BEFORE), [PICK_AFTER]: pickStep(PICK_AFTER) };

/** The question screens are framed the same way: from the progress bar down, centred column. */
const QUESTION_ZOOM = 1.75;
const columnCam = (titleY: number | undefined, s: number): Cam => (titleY == null ? WIDE : { x: APP_W / 2, y: titleY - 100 + APP_H / s / 2, s });

const Console = memo(function Console({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell username="Alex Morgan" needsReview={0} openQuestions={0} isSuperAdmin={false} isStaff={false} club={{ id: "default", name: "LBS Trips", paused: false }} clubs={[]}>
      {children}
    </AdminShell>
  );
});

const Funnel = memo(function Funnel({ session }: { session: PlanSession }) {
  return (
    <Console>
      <PlannerFunnel initial={session} aiReady placesReady flightsReady staysReady />
    </Console>
  );
});

/** Types into the screen's field the way a person would, and wakes up Continue once there is an answer. */
function useTyped(root: HTMLElement | null, text: string, focused: boolean) {
  useLayoutEffect(() => {
    if (!root) return;
    const input = root.querySelector("main input") as HTMLInputElement | null;
    if (input) {
      input.value = text;
      if (focused) input.focus({ preventScroll: true });
      else input.blur();
    }
    const go = byText(root, "button", "Continue") as HTMLButtonElement | undefined;
    if (go) {
      go.disabled = text.length < 1;
      if (text.length > 0) go.removeAttribute("data-disabled");
    }
  });
}

const typed = (frame: number, word: string, start: number, perChar = 6) => word.slice(0, Math.max(0, Math.min(word.length, Math.floor((frame - start) / perChar) + 1)));

// ---------------------------------------------------------------------------

/** A question: the cursor clicks into the field, the answer is typed, return sends it. */
function useQuestionShot({ session, word, typeAt, sendAt, from, pushIn }: { session: PlanSession; word: string; typeAt: number; sendAt: number; from: number; pushIn: boolean }) {
  const frame = useCurrentFrame();
  const { ref, rects } = useAnchors(
    {
      input: (r) => r.querySelector("main input"),
      title: (r) => r.querySelector("main h1"),
    },
    [session, frame >= from],
  );
  const text = frame >= typeAt ? typed(frame, word, typeAt) : "";
  useTyped(ref.current, text, frame >= typeAt - 6);

  const input = rects.input;
  const focus = columnCam(rects.title?.y, QUESTION_ZOOM);
  const cam = pushIn
    ? camAt(frame, [
        [from, WIDE],
        [from + 16, WIDE],
        [from + 60, focus],
      ])
    : focus;
  const clickX = input ? input.x + Math.min(input.w * 0.62, input.w - 40) : 0;
  const keys: CursorKey[] = input
    ? [
        { f: from + (pushIn ? 8 : 0), x: clickX + 60, y: input.y + input.h + 120 },
        { f: typeAt - 12, x: clickX, y: centre(input).y },
        { f: typeAt - 10, x: clickX, y: centre(input).y, click: true },
        { f: typeAt + 10, x: clickX + 40, y: input.y + input.h + 130 },
      ]
    : [];
  return {
    ref,
    cam,
    overlay: input ? (
      <>
        <Cursor cam={cam} keys={keys} frame={frame} visible={pushIn ? ramp(frame, from + 6, 10) : 1} />
        <KeyCap cam={cam} at={input.w < 400 ? { x: input.x + input.w + 64, y: centre(input).y } : { x: input.x + input.w - 56, y: input.y - 30 }} frame={frame} start={sendAt} />
      </>
    ) : null,
  };
}

// ---------------------------------------------------------------------------

const RESEARCHERS = [
  { icon: <PlaneIcon className="size-5" />, title: "Flight researcher", detail: "Comparing return flights from LHR, LGW to LIS" },
  { icon: <BedDoubleIcon className="size-5" />, title: "Accommodation researcher", detail: "Searching places to stay in Lisbon with prices for your dates" },
  { icon: <MapIcon className="size-5" />, title: "Itinerary researcher", detail: "Drafting three different outlines for 3 nights" },
  { icon: <PiggyBankIcon className="size-5" />, title: "Budget check", detail: "Adding up what the picks would cost per person" },
];
const doneAt = (i: number) => RESEARCH.from + 30 + i * 16;

/** The research step, in the planner's own markup, with each researcher finishing in turn. */
const ResearchScreen = memo(function ResearchScreen({ done }: { done: number }) {
  return (
    <Console>
      <div className="mx-auto flex min-h-[calc(100svh-9rem)] max-w-2xl flex-col">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
            <XIcon className="size-4" /> Save and close
          </span>
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < 8 ? "bg-primary" : i === 8 ? "bg-gold" : "bg-foreground/10")} />
            ))}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">9 of 10</span>
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Researching your trip</h1>
          <p className="mt-2 text-[15px] text-pretty text-muted-foreground">Four researchers work at the same time. This usually takes under a minute.</p>
          <ul className="mt-7 space-y-3">
            {RESEARCHERS.map((r, i) => {
              const isDone = i < done;
              return (
                <li key={r.title} className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", isDone ? "bg-success/12 text-success" : "bg-gold/20 text-gold-foreground")}>{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-sm text-pretty text-muted-foreground">{isDone ? "Done" : r.detail}</div>
                  </div>
                  {isDone ? <CheckIcon className="research-check size-5 shrink-0 text-success" strokeWidth={3} data-i={i} /> : <Loader2Icon className="research-spin size-5 shrink-0 text-muted-foreground" />}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Console>
  );
});

function useResearchShot() {
  const frame = useCurrentFrame();
  const { ref, rects } = useAnchors({ title: (r) => r.querySelector("main h1") }, [frame >= RESEARCH.from]);
  const focus = columnCam(rects.title?.y, 1.6);
  const cam = camAt(frame, [
    [RESEARCH.from, columnCam(rects.title?.y, QUESTION_ZOOM)],
    [RESEARCH.from + 30, focus],
    [RESEARCH.to - 30, focus],
    [RESEARCH.to, WIDE],
  ]);
  const done = RESEARCHERS.filter((_, i) => frame >= doneAt(i)).length;
  // Spinners turn and fresh ticks pop, frame by frame.
  const motion = `
    .research-spin { transform: rotate(${frame * 14}deg); }
    ${RESEARCHERS.map((_, i) => `.research-check[data-i="${i}"] { transform: scale(${mix(0.3, 1, ramp(frame, doneAt(i), 8))}); }`).join("\n")}
  `;
  return { ref, cam, done, motion };
}

// ---------------------------------------------------------------------------

/** "Pick what fits": the real screen; the cursor picks the better-value stay and the price follows. */
function usePickShot() {
  const frame = useCurrentFrame();
  const stayId = frame >= CLICK_STAY ? PICK_AFTER : PICK_BEFORE;
  // The best flight's details open as the camera arrives on it.
  const open = ramp(frame, 526, 26);
  const { ref, rects } = useAnchors(
    {
      flight: (r) => r.querySelector('[data-testid="flight-option"][data-selected="true"]'),
      stay: (r) => byText(r, '[data-testid="stay-option"]', "Ribeira"),
      stayButton: (r) => [...(byText(r, '[data-testid="stay-option"]', "Ribeira")?.querySelectorAll("button") ?? [])].pop(),
      price: (r) => r.querySelector('[data-testid="funnel-price"]'),
    },
    [stayId, frame >= PICK.from, Math.round(open * 24)],
  );
  const sel = rects.stayButton;
  const pulse = Math.min(ramp(frame, CLICK_STAY + 2, 8), 1 - ramp(frame, CLICK_STAY + 40, 26));

  const f = rects.flight;
  const st = rects.stay;
  const pr = rects.price;
  const flightCam: Cam = f ? { x: centre(f).x, y: f.y + f.h * 0.5, s: 1.62 } : WIDE;
  // Frame A: the stay being picked and the price, both in view.
  let camA: Cam = WIDE;
  if (st && pr) {
    const left = pr.x - 36;
    const right = st.x + st.w + 36;
    const top = st.y - 40;
    const bottom = pr.y + pr.h + 24;
    const s = Math.min(APP_W / (right - left), APP_H / (bottom - top), 1.6);
    const y = bottom - APP_H / s / 2;
    camA = { x: left + APP_W / s / 2, y, s };
  }
  // Then close on the price: the number first, then the verdict at the other end of the bar.
  const zs = 1.9;
  const camNumber: Cam = pr ? { x: pr.x - 24 + APP_W / zs / 2, y: centre(pr).y, s: zs } : WIDE;
  const camVerdict: Cam = pr ? { x: pr.x + pr.w + 24 - APP_W / zs / 2, y: centre(pr).y, s: zs } : WIDE;
  const cam = camAt(frame, [
    [PICK.from, WIDE],
    [PICK.from + 26, WIDE],
    [PICK.from + 76, flightCam],
    [586, flightCam],
    [618, camA],
    [650, camA],
    [676, camNumber],
    [690, camNumber],
    [716, camVerdict],
    [738, camVerdict],
    [768, WIDE],
  ]);
  const keys: CursorKey[] =
    f && sel
      ? [
          { f: PICK.from + 40, x: 1100, y: 760 },
          { f: 520, x: f.x + f.w * 0.58, y: f.y + 34 },
          { f: 594, x: f.x + f.w * 0.62, y: f.y + 40 },
          { f: CLICK_STAY - 2, x: centre(sel).x, y: centre(sel).y },
          { f: CLICK_STAY - 2, x: centre(sel).x, y: centre(sel).y, click: true },
          { f: 690, x: centre(sel).x + 40, y: centre(sel).y + 110 },
        ]
      : [];
  const spot =
    frame < 596
      ? { rect: f, strength: Math.min(ramp(frame, 506, 16), 1 - ramp(frame, 580, 16)) }
      : frame < 648
        ? { rect: st, strength: Math.min(ramp(frame, 606, 14), 1 - ramp(frame, 642, 10)) }
        : { rect: pr, strength: Math.min(ramp(frame, 648, 12), 1 - ramp(frame, 736, 18)), pad: 8 };
  return {
    ref,
    cam,
    stayId,
    open,
    pulse: { scale: mix(1, 1.14, pulse), margin: mix(0, 5, pulse), color: `color-mix(in oklab, #b8860b ${Math.round(pulse * 100)}%, var(--foreground))` },
    overlay: (
      <>
        <Spotlight rect={spot.rect} cam={cam} strength={spot.strength} pad={spot.pad ?? 10} />
        <Cursor cam={cam} keys={keys} frame={frame} visible={Math.min(ramp(frame, PICK.from + 30, 12), 1 - ramp(frame, 700, 14))} />
      </>
    ),
  };
}

// ---------------------------------------------------------------------------

export function AppShots() {
  const frame = useCurrentFrame();
  const enter = ramp(frame, APP_IN, 40);
  const exit = ramp(frame, APP_OUT, 28);
  const dest = useQuestionShot({ session: DESTINATION_STEP, word: "Lisbon", typeAt: DEST.from + 70, sendAt: DEST.to - 22, from: DEST.from, pushIn: true });
  const people = useQuestionShot({ session: TRAVELLERS_STEP, word: "20", typeAt: PEOPLE.from + 30, sendAt: PEOPLE.to - 24, from: PEOPLE.from, pushIn: false });
  const research = useResearchShot();
  const pick = usePickShot();

  // Which screen is up, with a short lift between screens.
  const shot = frame < DEST.to ? "dest" : frame < PEOPLE.to ? "people" : frame < RESEARCH.to ? "research" : "pick";
  const changeAt = shot === "people" ? PEOPLE.from : shot === "research" ? RESEARCH.from : shot === "pick" ? PICK.from : DEST.from;
  const lift = shot === "dest" ? 1 : ramp(frame, changeAt, 16);
  const current = shot === "dest" ? dest : shot === "people" ? people : shot === "research" ? { ...research, overlay: null } : pick;

  return (
    <AppWindow cam={current.cam} enter={enter} exit={exit} contentRef={current.ref} overlay={current.overlay}>
      <div style={{ opacity: mix(0.2, 1, lift), transform: `translateY(${mix(18, 0, lift)}px)`, height: "100%" }}>
        {shot === "dest" && <Funnel session={DESTINATION_STEP} />}
        {shot === "people" && <Funnel session={TRAVELLERS_STEP} />}
        {shot === "research" && (
          <>
            <style>{research.motion}</style>
            <ResearchScreen done={research.done} />
          </>
        )}
        {shot === "pick" && (
          <>
            <style>{`[data-testid="flight-option"][data-selected="true"] .peek-details { grid-template-rows: ${pick.open}fr !important; opacity: ${pick.open} !important; }
              [data-testid="funnel-price"] .font-display { display: inline-block; transform-origin: 50% 70%; transform: scale(${pick.pulse.scale}); margin: 0 ${pick.pulse.margin}px; color: ${pick.pulse.color}; }`}</style>
            <Funnel key={pick.stayId} session={PICK_SESSIONS[pick.stayId]!} />
          </>
        )}
      </div>
    </AppWindow>
  );
}
