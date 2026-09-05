import React from "react";
import { Composition } from "remotion";
import { LessonVideo } from "./LessonVideo";
import { lesson_young_m1_l1 } from "./lessonData";
import { HostTestB } from "./scenes/HostTestB";
import { MiddleScene } from "./scenes/MiddleScene";
import { BigScreenScene } from "./scenes/BigScreenScene";
import { NewsreaderScene } from "./scenes/NewsreaderScene";
import { LessonScene } from "./scenes/LessonScene";

const FPS = 30;

import { LESSON_CONFIGS } from "./configs";

export const RemotionRoot: React.FC = () => {
  const duration = Math.round(lesson_young_m1_l1.durationSeconds * FPS);
  return (
    <>
      <Composition
        id="lesson"
        component={LessonVideo as unknown as React.FC<Record<string, unknown>>}
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
        id="bigscreen"
        component={BigScreenScene}
        durationInFrames={Math.round(51.6 * FPS)}
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
      <Composition
        id="newsreader"
        component={NewsreaderScene}
        durationInFrames={Math.round(51.63 * FPS)}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {LESSON_CONFIGS.map((c) => (
        <Composition
          key={c.id}
          id={c.id}
          component={() => <LessonScene config={c} />}
          durationInFrames={Math.ceil(c.durationSec * 30) + 30}
          fps={30}
          width={1920}
          height={1080}
        />
      ))}
    </>
  );
};
