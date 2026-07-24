import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { brand } from "../theme";

// Warm playground/library backdrop: soft gradient sky, drifting books, playground shapes
export const BackdropInternet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1400px 900px at 30% 20%, ${brand.cream} 0%, ${brand.bg} 45%, ${brand.bgDeep} 100%)`,
      }}
    >
      {/* soft sun */}
      <div
        style={{
          position: "absolute",
          top: 90,
          right: 140,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 40%, ${brand.gold}, ${brand.primary}00 70%)`,
          filter: "blur(2px)",
          opacity: 0.75,
        }}
      />

      {/* Drifting book icons (library motif) */}
      {[
        { x: 180, y: 720, c: brand.clay,    d: 0 },
        { x: 320, y: 820, c: brand.gold,    d: 20 },
        { x: 1580, y: 760, c: brand.trust,  d: 40 },
        { x: 1720, y: 860, c: brand.primary, d: 60 },
      ].map((b, i) => {
        const drift = Math.sin((frame + b.d) / 25) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y + drift,
              width: 90,
              height: 70,
              background: b.c,
              borderRadius: 8,
              boxShadow: `0 12px 0 ${brand.ink}15, inset 8px 0 0 rgba(255,255,255,0.25)`,
            }}
          />
        );
      })}

      {/* Playground swirl shapes */}
      {[
        { x: 100, y: 200, size: 60, c: brand.primary },
        { x: 1720, y: 240, size: 80, c: brand.trust },
        { x: 1450, y: 140, size: 40, c: brand.gold },
        { x: 260, y: 380, size: 30, c: brand.clay },
      ].map((s, i) => {
        const pulse = interpolate(
          Math.sin((frame + i * 15) / 20),
          [-1, 1],
          [0.85, 1.1]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: s.c,
              opacity: 0.35,
              transform: `scale(${pulse})`,
            }}
          />
        );
      })}

      {/* Ground line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
          background: `linear-gradient(180deg, transparent, ${brand.bgDeep})`,
        }}
      />
    </AbsoluteFill>
  );
};
