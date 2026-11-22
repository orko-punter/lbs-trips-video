# LBS Trips — planner film (website loop)

18 seconds · 1920×1080 · 60 fps · silent (autoplays muted on the website, once a minute)

**Idea:** planning a group trip is chaos; LBS Trips turns a few answers into a priced trip.
**Rule:** one thing to look at at a time. Every shot holds long enough to read its one line.
**Source:** the app's own React components (planner question screen, "Pick what fits",
price bar, trip card, logo), rendered with demo data for a Lisbon trip for 20 people. The
research list re-uses the screen's exact markup. No stock footage, no invented UI.

## Look

- Canvas: the app's night navy (#141a2c → #1b2340), a slow drifting field of faint stars.
- The app sits in a floating window (rounded 22 px, soft shadow, light UI) — the "screen".
- Type: Fraunces (the app's display face) for lines, Geist for small labels.
- Accent: the app's gold, used once per shot (a word, a ring, a chip).
- Motion: spring in, ease out, no bounces bigger than 2 %. Camera moves are slow push-ins
  and pans (cubic-bezier 0.22, 1, 0.36, 1). A soft blur on fast moves only.
- Cursor: macOS-style arrow, eased paths, a ring pulse on click.

## Shots (frames at 60 fps)

| # | Time | Frames | On screen | Line | Attention |
|---|------|--------|-----------|------|-----------|
| 1 | 0.0–2.0 s | 0–120 | Navy. Words spring in, three "chaos" chips drift in around them, then get swept away as the app window rises. | "Planning a trip for twenty?" · chips: *40 open tabs* · *3 spreadsheets* · *1 endless group chat* | The question, then the chips |
| 2 | 2.0–5.5 s | 120–330 | App window: "Where is the trip going?" The camera pushes in; the cursor clicks the field, **Lisbon** is typed, a "return" key pops. Quick lift to "How many people, roughly?" → **20**, return. | "Answer a few questions." | The input; camera pushes in while typing |
| 3 | 5.5–7.5 s | 330–450 | "Researching your trip": flights, places to stay, itineraries, budget — each row ticks to Done in turn. | "We research the rest." | Each tick, top to bottom |
| 4 | 7.5–13.0 s | 450–780 | "Pick what fits": flights, stays, itinerary side by side. Camera pushes into the best flight; its details open. Move to the stays with the price bar in view (£755); the cursor picks the riverside flats; the price drops to £525 with a gold pulse; close on the number, then pan to "✓ £125 under budget". | "Pick what fits." → "The price follows every choice." | Flight card → stay card → price |
| 5 | 13.0–15.5 s | 780–930 | The window falls away; the finished trip card rises (price per person, spots left) with two other trips behind it. | "Publish it. Your group books." | The Lisbon card |
| 6 | 15.5–18.0 s | 930–1080 | Navy. The LBS Trips mark, then the line with "next trip" in gold, then the address. Fades back to navy so the loop is seamless. | "Plan your next trip" · lbstrips.com | The line |

## Sound

None: the video autoplays muted. (A sound version can reuse the same cut: soft piano
pulse, key clicks on typing, a low "whoosh" on shot changes, a chime on the price.)

## Review checklist

- Every line on screen ≥ 1.2 s, readable at 1280 px wide.
- No more than one moving focus at a time.
- First and last frame identical navy (seamless loop).
- No real member names; demo data only.

## Render

```bash
npm run studio        # preview and scrub in the browser
npm run render        # out/lbs-trips-planner.mp4 (H.264, CRF 16)
npm run render:webm   # out/lbs-trips-planner.webm (VP9)
```

The film imports the app from `../lbs-ai-cup` (components, design system, planner logic), so
copy changes in the app show up in the next render. Server actions and Next.js-only modules
are replaced by stand-ins in `src/shims`; nothing reads or writes a database.
