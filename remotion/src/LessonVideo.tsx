import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import type { LessonVideoProps } from "./lessonData";
import { BackdropInternet } from "./components/BackdropInternet";
import { IntroCard } from "./scenes/IntroCard";
import { MainScene } from "./scenes/MainScene";
import { OutroCard } from "./scenes/OutroCard";

loadOswald("normal", { weights: ["500", "600", "700"] });
loadDMSans("normal", { weights: ["400", "500", "700"] });

export const LessonVideo: React.FC<LessonVideoProps> = ({
  title,
  audioUrl,
  captionSegments,
  durationSeconds,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  // Timing: intro 5s, outro 6s, main = remainder
  const introFrames = Math.round(5 * fps);
  const outroFrames = Math.round(6 * fps);
  const mainFrames = durationInFrames - introFrames - outroFrames;
  const mainStartMs = (introFrames / fps) * 1000;
  const outroStartMs = ((introFrames + mainFrames) / fps) * 1000;

  // Filter caption segments per section
  const introCaps = captionSegments.filter((c) => c.endMs <= mainStartMs);
  const mainCaps = captionSegments.filter(
    (c) => c.startMs >= mainStartMs && c.endMs <= outroStartMs
  );
  // (Outro caps intentionally unused — outro card carries its own text.)

  return (
    <AbsoluteFill style={{ backgroundColor: "#FBF6EF" }}>
      <BackdropInternet />

      <Sequence from={0} durationInFrames={introFrames}>
        <IntroCard title={title} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={mainFrames}>
        <MainScene captionSegments={mainCaps} sceneStartMs={mainStartMs} />
      </Sequence>

      <Sequence from={introFrames + mainFrames} durationInFrames={outroFrames}>
        <OutroCard />
      </Sequence>

      {audioUrl && <Audio src={audioUrl} />}

      {/* Intro caption overlay (small "Hi I am Kiki") — uses global timing */}
      {introCaps.length > 0 && (
        <Sequence from={0} durationInFrames={introFrames}>
          {/* Reuse Caption via MainScene styling would require rebasing; skip for intro since title says it */}
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
