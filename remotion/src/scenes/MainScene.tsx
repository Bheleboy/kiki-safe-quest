import { AbsoluteFill } from "remotion";
import { Character } from "../components/Character";
import { Caption } from "../components/Caption";
import type { CaptionSegment } from "../lessonData";

interface Props {
  captionSegments: CaptionSegment[];
  sceneStartMs: number;
}

export const MainScene: React.FC<Props> = ({ captionSegments, sceneStartMs }) => {
  // Rebase caption timing to local scene frames
  const rebased = captionSegments.map((c) => ({
    ...c,
    startMs: c.startMs - sceneStartMs,
    endMs: c.endMs - sceneStartMs,
  }));

  return (
    <AbsoluteFill>
      <Character src="images/kiki.png" entryFrame={0} side="left" fromX={-500} height={820} />
      <Character src="images/nala.png" entryFrame={15} side="right" fromX={500} height={780} bobSpeed={38} />
      <Caption segments={rebased} />
    </AbsoluteFill>
  );
};
