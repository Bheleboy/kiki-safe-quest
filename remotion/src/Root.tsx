import { Composition } from "remotion";
import { LessonVideo } from "./LessonVideo";
import { lesson_young_m1_l1 } from "./lessonData";

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
    </>
  );
};
