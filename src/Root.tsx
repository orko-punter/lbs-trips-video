import { Composition } from "remotion";
import { DURATION, FPS, Film } from "./film/Film";
import { H, W } from "./film/kit";

export function Root() {
  return <Composition id="PlannerFilm" component={Film} durationInFrames={DURATION} fps={FPS} width={W} height={H} />;
}
