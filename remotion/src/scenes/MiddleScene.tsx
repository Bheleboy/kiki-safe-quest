import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { brand } from "../theme";

loadOswald("normal", { weights: ["500", "600", "700"] });
loadDMSans("normal", { weights: ["400", "500", "700"] });
const { fontFamily: emojiFont } = loadEmoji();
const EMOJI_STACK = `'DM Sans', ${emojiFont}, 'Noto Color Emoji', sans-serif`;

/**
 * MiddleScene — 36s explainer package for young-m1-l1 "The Internet".
 * Covers narration beats:
 *   0-6s   library + playground metaphor
 *   6-12s  learn / play / talk (3 icons)
 *  12-17s  playground has rules (shield/safety)
 *  17-20s  "here is what you need to know" chip
 *  20-26s  globe + network (computers connect the world)
 *  26-32s  4-icon grid (videos, games, learn, people)
 *  32-36s  "amazing but be careful" warning
 *
 * Uses the same motion language as HostTestB: subtle camera push+pan,
 * spring bounce entrances, floating idle, staggered elements.
 */
export const MiddleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Global slow camera push across the whole middle
  const camZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.06]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1500px 1000px at 45% 35%, ${brand.cream}, ${brand.bg} 55%, ${brand.bgDeep})`,
        overflow: "hidden",
      }}
    >
      {/* Ambient parallax dots */}
      <AmbientDots />

      <AbsoluteFill
        style={{
          transform: `scale(${camZoom})`,
          transformOrigin: "50% 50%",
        }}
      >
        <Sequence from={0} durationInFrames={180}>
          <BeatLibraryPlayground />
        </Sequence>
        <Sequence from={180} durationInFrames={180}>
          <BeatLearnPlayTalk />
        </Sequence>
        <Sequence from={360} durationInFrames={150}>
          <BeatRulesSafety />
        </Sequence>
        <Sequence from={510} durationInFrames={90}>
          <BeatCallout />
        </Sequence>
        <Sequence from={600} durationInFrames={180}>
          <BeatGlobeNetwork />
        </Sequence>
        <Sequence from={780} durationInFrames={180}>
          <BeatFourThings />
        </Sequence>
        <Sequence from={960} durationInFrames={120}>
          <BeatBeCareful />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================
// Ambient background
// ============================================================
const AmbientDots: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = [
    { x: 140, y: 200, s: 70, c: brand.trust, o: 0.25 },
    { x: 1660, y: 160, s: 110, c: brand.gold, o: 0.32 },
    { x: 240, y: 900, s: 60, c: brand.clay, o: 0.28 },
    { x: 1520, y: 940, s: 90, c: brand.primary, o: 0.26 },
    { x: 900, y: 100, s: 40, c: brand.primary, o: 0.22 },
    { x: 960, y: 990, s: 50, c: brand.trust, o: 0.24 },
  ];
  return (
    <AbsoluteFill>
      {dots.map((d, i) => {
        const pulse = interpolate(Math.sin((frame + i * 20) / 30), [-1, 1], [0.85, 1.15]);
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
    </AbsoluteFill>
  );
};

// ============================================================
// Shared UI atoms
// ============================================================
const LabelChip: React.FC<{ text: string; color?: string; top?: number; left?: number }> = ({
  text,
  color = brand.primary,
  top = -28,
  left = 40,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left,
      padding: "10px 24px",
      background: color,
      color: "white",
      borderRadius: 999,
      fontFamily: "'Oswald', sans-serif",
      fontWeight: 700,
      letterSpacing: 2,
      fontSize: 24,
      textTransform: "uppercase",
      boxShadow: `0 10px 20px -6px ${color}80`,
    }}
  >
    {text}
  </div>
);

const Caption: React.FC<{ text: string; accent?: string }> = ({ text, accent = brand.primary }) => {
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
        bottom: 80,
        transform: `translateX(-50%) translateY(${y}px)`,
        opacity: o,
        maxWidth: 1500,
        textAlign: "center",
        background: "rgba(255, 248, 236, 0.96)",
        border: `3px solid ${accent}`,
        borderRadius: 28,
        padding: "22px 48px",
        boxShadow: `0 20px 40px -12px ${brand.ink}40`,
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 48,
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

const Card: React.FC<{
  children: React.ReactNode;
  entryFrame?: number;
  style?: React.CSSProperties;
  bounce?: boolean;
}> = ({ children, entryFrame = 0, style, bounce = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - entryFrame,
    fps,
    config: bounce
      ? { damping: 10, stiffness: 120, mass: 0.9 }
      : { damping: 18, stiffness: 140 },
  });
  const scale = interpolate(s, [0, 1], [0.5, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const rot = interpolate(s, [0, 1], [6, 0]);
  const float = Math.sin((frame - entryFrame) / 30) * 6;

  return (
    <div
      style={{
        position: "absolute",
        background: "white",
        borderRadius: 32,
        boxShadow: `0 30px 60px -20px ${brand.ink}55, inset 0 0 0 5px ${brand.primary}`,
        padding: 24,
        opacity,
        transform: `translateY(${float}px) scale(${scale}) rotate(${rot}deg)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ============================================================
// BEAT 1 — Library + Playground
// ============================================================
const BeatLibraryPlayground: React.FC = () => (
  <AbsoluteFill>
    <Card
      entryFrame={4}
      style={{
        left: 120,
        top: 140,
        width: 780,
        height: 560,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LabelChip text="Library" color={brand.trust} />
      <div style={{ fontSize: 380, lineHeight: 1 }}>📚</div>
    </Card>
    <Card
      entryFrame={18}
      style={{
        right: 120,
        top: 140,
        width: 780,
        height: 560,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 30px 60px -20px ${brand.ink}55, inset 0 0 0 5px ${brand.gold}`,
      }}
    >
      <LabelChip text="Playground" color={brand.gold} />
      <div style={{ fontSize: 360, lineHeight: 1 }}>🎡</div>
    </Card>
    <Caption text="The internet is like a big library AND a playground." accent={brand.trust} />
  </AbsoluteFill>
);

// ============================================================
// BEAT 2 — Learn / Play / Talk (3 icons)
// ============================================================
const BeatLearnPlayTalk: React.FC = () => {
  const items = [
    { icon: "📖", label: "Learn", color: brand.trust },
    { icon: "🎮", label: "Play", color: brand.primary },
    { icon: "💬", label: "Talk", color: brand.gold },
  ];
  return (
    <AbsoluteFill>
      {items.map((it, i) => (
        <Card
          key={i}
          entryFrame={4 + i * 10}
          style={{
            left: 200 + i * 540,
            top: 260,
            width: 420,
            height: 460,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            boxShadow: `0 30px 60px -20px ${brand.ink}55, inset 0 0 0 5px ${it.color}`,
          }}
        >
          <div style={{ fontSize: 220, lineHeight: 1 }}>{it.icon}</div>
          <div
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: 62,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: it.color,
            }}
          >
            {it.label}
          </div>
        </Card>
      ))}
      <Caption text="You can learn, play, and talk to friends." />
    </AbsoluteFill>
  );
};

// ============================================================
// BEAT 3 — Rules / Safety
// ============================================================
const BeatRulesSafety: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 6, fps, config: { damping: 8 } });
  const scale = interpolate(s, [0, 1], [0, 1]);
  const rot = interpolate(s, [0, 1], [-25, 0]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontSize: 480,
          lineHeight: 1,
          transform: `scale(${scale}) rotate(${rot}deg)`,
          filter: `drop-shadow(0 30px 40px ${brand.primary}55)`,
          marginTop: -40,
        }}
      >
        🛡️
      </div>
      <Caption text="But just like a real playground, there are RULES to stay safe!" accent={brand.clay} />
    </AbsoluteFill>
  );
};

// ============================================================
// BEAT 4 — Callout chip
// ============================================================
const BeatCallout: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const scale = interpolate(s, [0, 1], [0.6, 1]);
  const o = interpolate(s, [0, 1], [0, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity: o,
          padding: "40px 80px",
          background: brand.primary,
          color: "white",
          borderRadius: 40,
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 120,
          textTransform: "uppercase",
          letterSpacing: 4,
          textAlign: "center",
          boxShadow: `0 40px 80px -20px ${brand.primary}80`,
          lineHeight: 1.05,
        }}
      >
        Here's what
        <br />
        you need to know
      </div>
    </AbsoluteFill>
  );
};

// ============================================================
// BEAT 5 — Globe + Network
// ============================================================
const BeatGlobeNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spin = interpolate(frame, [0, 180], [0, 30]);
  const s = spring({ frame: frame - 4, fps, config: { damping: 12 } });
  const scale = interpolate(s, [0, 1], [0.4, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  // Orbiting dots representing computers around the world
  const orbits = [0, 60, 120, 180, 240, 300];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: 700,
          height: 700,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            fontSize: 620,
            lineHeight: 1,
            textAlign: "center",
            transform: `rotate(${spin}deg)`,
            filter: `drop-shadow(0 20px 30px ${brand.trust}55)`,
          }}
        >
          🌍
        </div>
        {orbits.map((deg, i) => {
          const a = ((deg + frame * 0.8) * Math.PI) / 180;
          const r = 420;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r * 0.55;
          const pop = spring({ frame: frame - 20 - i * 6, fps, config: { damping: 10 } });
          const ps = interpolate(pop, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 90,
                height: 90,
                marginLeft: -45,
                marginTop: -45,
                borderRadius: 20,
                background: "white",
                boxShadow: `0 15px 30px -8px ${brand.ink}60, inset 0 0 0 4px ${brand.trust}`,
                transform: `translate(${x}px, ${y}px) scale(${ps})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}
            >
              💻
            </div>
          );
        })}
      </div>
      <Caption text="The internet connects computers all around the world." accent={brand.trust} />
    </AbsoluteFill>
  );
};

// ============================================================
// BEAT 6 — Four things you can do
// ============================================================
const BeatFourThings: React.FC = () => {
  const items = [
    { icon: "📺", label: "Watch videos", color: brand.primary },
    { icon: "🎮", label: "Play games", color: brand.gold },
    { icon: "🧠", label: "Learn new things", color: brand.trust },
    { icon: "🗣️", label: "Talk to people", color: brand.clay },
  ];
  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <Card
            key={i}
            entryFrame={4 + i * 8}
            style={{
              left: 200 + col * 780,
              top: 100 + row * 420,
              width: 720,
              height: 360,
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "20px 40px",
              boxShadow: `0 30px 60px -20px ${brand.ink}55, inset 0 0 0 5px ${it.color}`,
            }}
          >
            <div style={{ fontSize: 180, lineHeight: 1 }}>{it.icon}</div>
            <div
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                fontSize: 54,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: it.color,
                lineHeight: 1.05,
              }}
            >
              {it.label}
            </div>
          </Card>
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================
// BEAT 7 — Amazing but careful
// ============================================================
const BeatBeCareful: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10 } });
  const scale = interpolate(s, [0, 1], [0.5, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const wobble = Math.sin(frame / 8) * 4;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
      <div
        style={{
          fontSize: 340,
          lineHeight: 1,
          transform: `scale(${scale}) rotate(${wobble}deg)`,
          opacity,
          filter: `drop-shadow(0 30px 40px ${brand.clay}55)`,
        }}
      >
        ⚠️
      </div>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 110,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: brand.clay,
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        Amazing —
        <br />
        <span style={{ color: brand.primary }}>but be careful!</span>
      </div>
    </AbsoluteFill>
  );
};
