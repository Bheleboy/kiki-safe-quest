import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { CaptionSegment } from "../lessonData";
import { brand } from "../theme";

interface Props {
  segments: CaptionSegment[];
}

export const Caption: React.FC<Props> = ({ segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const active = segments.find((s) => currentMs >= s.startMs && currentMs < s.endMs);
  if (!active) return null;

  const startFrame = Math.round((active.startMs / 1000) * fps);
  const local = frame - startFrame;
  const enter = spring({ frame: local, fps, config: { damping: 20, stiffness: 180 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 120,
        transform: `translateX(-50%) translateY(${y}px)`,
        opacity,
        maxWidth: 1500,
        textAlign: "center",
        background: "rgba(255, 248, 236, 0.94)",
        border: `3px solid ${brand.primary}`,
        borderRadius: 28,
        padding: "28px 56px",
        boxShadow: `0 20px 40px -12px ${brand.ink}40`,
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.25,
          color: brand.ink,
          margin: 0,
        }}
      >
        {active.text}
      </p>
    </div>
  );
};
