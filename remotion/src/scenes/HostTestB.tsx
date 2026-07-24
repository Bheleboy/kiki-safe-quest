import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { brand } from "../theme";

// Test B — Illustrated animated host. Richer motion: walk-in, gesture tilt,
// camera pans/zooms, supporting graphic slides in and gets highlighted.
export const HostTestB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // --- Camera (whole scene) ---
  // Slow push-in across full clip
  const camZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08]);
  // Pan right around midpoint to shift attention toward graphic
  const camPanX = interpolate(
    frame,
    [0, fps * 4, fps * 7, durationInFrames],
    [0, 0, -120, -160],
    { extrapolateRight: "clamp" }
  );

  // --- Kiki entrance (walk in from left) ---
  const kikiEntry = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90, mass: 1.1 },
  });
  const kikiX = interpolate(kikiEntry, [0, 1], [-700, 0]);
  const kikiOpacity = interpolate(kikiEntry, [0, 1], [0, 1]);
  // Walk bob during entrance
  const walkBob = frame < fps * 1.2 ? Math.sin(frame / 2.5) * 14 : 0;
  // Idle breathing after
  const idle = Math.sin(frame / 22) * 6;
  // Gesture tilt (points right around 2.5s)
  const gestureTilt = interpolate(
    frame,
    [fps * 2.2, fps * 2.8, fps * 4, fps * 4.6],
    [0, -6, -6, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  // After graphic appears (~4s), Kiki shrinks & moves further left
  const kikiShrink = interpolate(
    frame,
    [fps * 4, fps * 5.2],
    [1, 0.78],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const kikiSlide = interpolate(
    frame,
    [fps * 4, fps * 5.2],
    [0, -120],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Graphic entrance (bounce in from right ~3.8s) ---
  const gfxEntry = spring({
    frame: frame - fps * 3.8,
    fps,
    config: { damping: 10, stiffness: 120, mass: 0.9 },
  });
  const gfxScale = interpolate(gfxEntry, [0, 1], [0.4, 1]);
  const gfxOpacity = interpolate(gfxEntry, [0, 1], [0, 1]);
  const gfxRotate = interpolate(gfxEntry, [0, 1], [8, 0]);
  // Subtle float
  const gfxFloat = Math.sin(frame / 30) * 8;

  // Captions timed to snippet
  const caps: Array<{ text: string; start: number; end: number }> = [
    { text: "Hi, I'm Kiki!", start: 0.6, end: 2.4 },
    { text: "The internet is like a big library and playground —", start: 2.6, end: 6.6 },
    { text: "you can learn, play, and talk to friends!", start: 6.8, end: 10.8 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1400px 900px at 40% 30%, ${brand.cream}, ${brand.bg} 50%, ${brand.bgDeep})`,
        overflow: "hidden",
      }}
    >
      {/* Camera-transformed world */}
      <AbsoluteFill
        style={{
          transform: `translateX(${camPanX}px) scale(${camZoom})`,
          transformOrigin: "50% 55%",
        }}
      >
        {/* Ambient shapes (parallax dots) */}
        {[
          { x: 180, y: 220, s: 70, c: brand.trust, o: 0.28 },
          { x: 1620, y: 180, s: 110, c: brand.gold, o: 0.35 },
          { x: 300, y: 900, s: 50, c: brand.clay, o: 0.3 },
          { x: 1500, y: 940, s: 80, c: brand.primary, o: 0.28 },
        ].map((d, i) => {
          const pulse = interpolate(
            Math.sin((frame + i * 20) / 25),
            [-1, 1],
            [0.85, 1.15]
          );
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: d.x,
                top: d.y,
                width: d.s,
                height: d.s,
                borderRadius: "50%",
                background: d.c,
                opacity: d.o,
                transform: `scale(${pulse})`,
              }}
            />
          );
        })}

        {/* Supporting graphic (library + playground) — slides in ~3.8s */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: "50%",
            width: 900,
            height: 520,
            transform: `translateY(-50%) translateY(${gfxFloat}px) scale(${gfxScale}) rotate(${gfxRotate}deg)`,
            opacity: gfxOpacity,
            background: "white",
            borderRadius: 40,
            boxShadow: `0 30px 60px -20px ${brand.ink}55, inset 0 0 0 6px ${brand.primary}`,
            padding: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img
            src={staticFile("images/library-playground.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: 24,
            }}
          />
          {/* Label chip */}
          <div
            style={{
              position: "absolute",
              top: -28,
              left: 40,
              padding: "10px 24px",
              background: brand.primary,
              color: "white",
              borderRadius: 999,
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              letterSpacing: 2,
              fontSize: 26,
              textTransform: "uppercase",
              boxShadow: `0 10px 20px -6px ${brand.primary}80`,
            }}
          >
            Library + Playground
          </div>
        </div>

        {/* Kiki — walks in, gestures, then shifts to make room */}
        <div
          style={{
            position: "absolute",
            left: "8%",
            bottom: 40,
            opacity: kikiOpacity,
            transform: `translate(${kikiX + kikiSlide}px, ${walkBob + idle}px) scale(${kikiShrink}) rotate(${gestureTilt}deg)`,
            transformOrigin: "50% 90%",
          }}
        >
          <Img
            src={staticFile("images/kiki.png")}
            style={{
              height: 940,
              width: "auto",
              filter: "drop-shadow(0 30px 25px rgba(43,32,25,0.28))",
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Caption bubbles (outside camera transform so they read cleanly) */}
      {caps.map((c, i) => (
        <Sequence
          key={i}
          from={Math.round(c.start * fps)}
          durationInFrames={Math.round((c.end - c.start) * fps)}
        >
          <CaptionBubble text={c.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const CaptionBubble: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 180 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  const o = interpolate(s, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 90,
        transform: `translateX(-50%) translateY(${y}px)`,
        opacity: o,
        maxWidth: 1500,
        textAlign: "center",
        background: "rgba(255, 248, 236, 0.96)",
        border: `3px solid ${brand.primary}`,
        borderRadius: 28,
        padding: "24px 52px",
        boxShadow: `0 20px 40px -12px ${brand.ink}40`,
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.25,
          color: brand.ink,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
};
