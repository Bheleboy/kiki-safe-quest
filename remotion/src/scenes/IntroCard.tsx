import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { brand } from "../theme";
import { Character } from "../components/Character";

interface Props {
  title: string;
}

export const IntroCard: React.FC<Props> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badge = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const titleIn = spring({ frame: frame - 40, fps, config: { damping: 18, stiffness: 120 } });

  const badgeScale = interpolate(badge, [0, 1], [0.4, 1]);
  const titleY = interpolate(titleIn, [0, 1], [40, 0]);
  const titleO = interpolate(titleIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill>
      <Character src="images/kiki.png" entryFrame={0} side="right" fromX={600} height={900} />

      <div
        style={{
          position: "absolute",
          left: "6%",
          top: "22%",
          maxWidth: 900,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: brand.primary,
            color: "white",
            borderRadius: 999,
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 600,
            letterSpacing: 2,
            fontSize: 28,
            textTransform: "uppercase",
            transform: `scale(${badgeScale})`,
            transformOrigin: "left center",
            boxShadow: `0 10px 25px -8px ${brand.primary}80`,
          }}
        >
          Kiki Warrior · Lesson 1
        </div>

        <h1
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 130,
            lineHeight: 1.02,
            color: brand.ink,
            marginTop: 32,
            textTransform: "uppercase",
            letterSpacing: 1,
            opacity: titleO,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
