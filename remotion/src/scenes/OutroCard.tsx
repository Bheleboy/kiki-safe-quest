import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { brand } from "../theme";
import { Character } from "../components/Character";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shield = spring({ frame: frame - 10, fps, config: { damping: 10 } });
  const msg = spring({ frame: frame - 30, fps, config: { damping: 18 } });

  const shieldScale = interpolate(shield, [0, 1], [0, 1]);
  const msgY = interpolate(msg, [0, 1], [30, 0]);
  const msgO = interpolate(msg, [0, 1], [0, 1]);

  return (
    <AbsoluteFill>
      <Character src="images/kiki.png" entryFrame={0} side="left" fromX={-500} height={880} />

      <div
        style={{
          position: "absolute",
          right: "6%",
          top: "18%",
          textAlign: "right",
          maxWidth: 900,
        }}
      >
        <div
          style={{
            fontSize: 220,
            transform: `scale(${shieldScale}) rotate(${interpolate(shield, [0, 1], [-30, 0])}deg)`,
            transformOrigin: "right center",
          }}
        >
          🛡️
        </div>

        <div
          style={{
            marginTop: 20,
            opacity: msgO,
            transform: `translateY(${msgY}px)`,
          }}
        >
          <p
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 110,
              fontWeight: 700,
              color: brand.primary,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            Stay safe.
          </p>
          <p
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 110,
              fontWeight: 700,
              color: brand.trust,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            Be kind.
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 42,
              color: brand.ink,
              marginTop: 24,
              fontWeight: 500,
            }}
          >
            See you in the next lesson, warrior! 👋
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
