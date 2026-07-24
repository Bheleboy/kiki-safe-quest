import { Composition } from "remotion";
import { LessonVideo } from "./LessonVideo";
import { lesson_young_m1_l1 } from "./lessonData";
import { HostTestB } from "./scenes/HostTestB";
import { MiddleScene } from "./scenes/MiddleScene";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  const duration = Math.round(lesson_young_m1_l1.durationSeconds * FPS);
  return (
    <>
      <Composition
        id="lesson"
        component={LessonVideo}
        durationInFrames={duration}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={lesson_young_m1_l1}
      />
      <Composition
        id="test-b"
        component={HostTestB}
        durationInFrames={11 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="middle"
        component={MiddleScene}
        durationInFrames={36 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
