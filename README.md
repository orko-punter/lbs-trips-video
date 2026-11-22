# LBS Trips planner film

An 18-second product film for the [LBS Trips](https://github.com/orko-punter/lbs-ai-cup) website (1920×1080, 60 fps, silent, plays muted on loop). It shows the trip planner turning a few answers into a priced group trip.

It's built with [Remotion](https://www.remotion.dev), so the film is React code: it renders the app's own components (the planner questions, "Pick what fits", the price bar, the trip card) with demo data for a Lisbon trip for 20 people. No stock footage and no mocked-up screens.

The shot-by-shot plan, timings and look are in [STORYBOARD.md](STORYBOARD.md).

## Run it

```bash
npm install
npm run studio   # preview and scrub the film in the browser
npm run render   # writes out/lbs-trips-planner.mp4
```

## Layout

- `src/film/` holds the film: `Film.tsx` sequences the shots, `Scenes.tsx` and `AppShots.tsx` hold the shots, and `kit.tsx` has the shared motion helpers (springs, cursor, camera).
- `src/shims/` stands in for Next.js pieces (`next/link`, `next/image`, server actions) so the app's components render inside Remotion.
- `src/demo.ts` is the demo trip data.
