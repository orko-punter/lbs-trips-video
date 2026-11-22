import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { AppShots, APP_IN } from "./AppShots";
import { FONT_VARS, NightSky } from "./kit";
import { Captions, Hook, LoopSeam, Outro, Published } from "./Scenes";

export const FPS = 60;
export const DURATION = 1080;
const PUBLISHED = 784;
const OUTRO = 932;

/** Nothing is measured until the fonts are in, so every render tab lays the app out the same way. */
function useFontsReady() {
  const [handle] = useState(() => delayRender("Waiting for fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    document.fonts.ready.then(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
}

export function Film() {
  const frame = useCurrentFrame();
  const ready = useFontsReady();
  return (
    <AbsoluteFill style={FONT_VARS}>
      <NightSky />
      {frame < APP_IN + 12 && <Hook />}
      {ready && frame >= APP_IN - 2 && frame < 800 && <AppShots />}
      <Captions />
      {ready && frame >= PUBLISHED && frame < OUTRO + 10 && <Published from={PUBLISHED} />}
      {frame >= OUTRO && <Outro from={OUTRO} duration={DURATION - OUTRO} />}
      <LoopSeam total={DURATION} />
    </AbsoluteFill>
  );
}
