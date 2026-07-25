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
import { MiddleScene } from "./MiddleScene";

loadOswald("normal", { weights: ["500", "600", "700"] });
loadDMSans("normal", { weights: ["400", "500", "700"] });
const { fontFamily: emojiFont } = loadEmoji();
const EMOJI_STACK = `'DM Sans', ${emojiFont}, 'Noto Color Emoji', sans-serif`;

const FPS = 30;

/**
 * BigScreenScene — studio set background for the HeyGen presenter composite.
 *
 * Layout: a wall-mounted "big screen" display fills the left ~62% of frame.
 * The right ~38% is intentionally kept clean (soft studio wall + floor) so the
 * keyed HeyGen Kiki presenter can be composited there in ffmpeg.
 *
 * Total duration: 51.6s (matching The_Internet.m4a).
 *   0.0 – 7.0s   title slide on screen
 *   7.0 – 43.0s  MiddleScene explainer package (36s) shown on screen
 *  43.0 – 51.6s  recap / sign-off slide on screen
 */
export const BigScreenScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <StudioRoom />
      <ScreenFrame>
        <Sequence from={0} durationInFrames={7 * FPS}>
          <TitleSlide />
        </Sequence>
        <Sequence from={7 * FPS} durationInFrames={36 * FPS}>
          <MiddleScene />
        </Sequence>
        <Sequence from={43 * FPS} durationInFrames={Math.round(8.6 * FPS)}>
          <RecapSlide />
        </Sequence>
      </ScreenFrame>
      <FloorShadow />
    </AbsoluteFill>
  );
};

// ============================================================
// Studio room: warm wall gradient, soft light pool, floor line
// ============================================================
const StudioRoom: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 12;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${brand.bgDeep} 0%, ${brand.bg} 45%, ${brand.bg} 100%)`,
      }}
    >
      {/* warm light pool behind the presenter side */}
      <div
        style={{
          position: "absolute",
          right: -200 + drift,
          top: -260,
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brand.gold}33, transparent 62%)`,
        }}
      />
      {/* cool light pool behind screen */}
      <div
        style={{
          position: "absolute",
          left: -320,
          bottom: -420,
          width: 1400,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${brand.trust}22, transparent 62%)`,
        }}
      />
      {/* floor */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 210,
          background: `linear-gradient(180deg, ${brand.bgDeep}, #E6D6BC)`,
          borderTop: `2px solid ${brand.ink}18`,
        }}
      />
      <VignetteEdges />
    </AbsoluteFill>
  );
};

const VignetteEdges: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 100% at 50% 45%, transparent 55%, rgba(43,32,25,0.18) 100%)",
    }}
  />
);

// ============================================================
// The wall-mounted display
// ============================================================
const SCREEN = { left: 70, top: 92, width: 1150, height: 780 };

const ScreenFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const scale = interpolate(s, [0, 1], [0.94, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const glow = interpolate(Math.sin(frame / 45), [-1, 1], [0.35, 0.55]);

  return (
    <>
      {/* wall mount arm */}
      <div
        style={{
          position: "absolute",
          left: SCREEN.left + SCREEN.width / 2 - 26,
          top: SCREEN.top + SCREEN.height + 18,
          width: 52,
          height: 120,
          background: `linear-gradient(180deg, ${brand.ink}cc, ${brand.ink}88)`,
          borderRadius: 10,
          opacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SCREEN.left + SCREEN.width / 2 - 150,
          top: SCREEN.top + SCREEN.height + 128,
          width: 300,
          height: 24,
          background: `${brand.ink}bb`,
          borderRadius: 14,
          opacity,
          filter: "blur(0.4px)",
        }}
      />
      {/* bezel */}
      <div
        style={{
          position: "absolute",
          left: SCREEN.left,
          top: SCREEN.top,
          width: SCREEN.width,
          height: SCREEN.height,
          borderRadius: 40,
          padding: 18,
          background: `linear-gradient(160deg, #3A2C22, ${brand.ink})`,
          boxShadow: `0 46px 90px -30px rgba(43,32,25,${glow}), 0 0 0 3px ${brand.gold}55`,
          transform: `scale(${scale})`,
          transformOrigin: "50% 60%",
          opacity,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 26,
            overflow: "hidden",
            background: brand.cream,
          }}
        >
          {/* inner content is authored at 1920x1080 then scaled to fit */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1920,
              height: 1080,
              transform: `scale(${(SCREEN.width - 36) / 1920}, ${(SCREEN.height - 36) / 1080})`,
              transformOrigin: "0 0",
            }}
          >
            {children}
          </div>
          {/* screen glare */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(115deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 26%, transparent 48%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </>
  );
};

// ============================================================
// Presenter floor shadow (under the composited HeyGen Kiki)
// ============================================================
const FloorShadow: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = interpolate(Math.sin(frame / 40), [-1, 1], [0.94, 1.04]);
  return (
    <div
      style={{
        position: "absolute",
        left: 1330,
        bottom: 96,
        width: 480,
        height: 90,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(43,32,25,0.34), transparent 68%)",
        transform: `scale(${breathe})`,
        filter: "blur(6px)",
      }}
    />
  );
};

// ============================================================
// On-screen slides
// ============================================================
const TitleSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 130 } });
  const y = interpolate(s, [0, 1], [70, 0]);
  const o = interpolate(s, [0, 1], [0, 1]);
  const float = Math.sin(frame / 26) * 10;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1400px 900px at 50% 40%, ${brand.cream}, ${brand.bg} 60%, ${brand.bgDeep})`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <div
        style={{
          fontSize: 300,
          lineHeight: 1,
          fontFamily: EMOJI_STACK,
          transform: `translateY(${float}px)`,
          opacity: o,
        }}
      >
        🌐
      </div>
      <div style={{ transform: `translateY(${y}px)`, opacity: o, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: brand.primary,
          }}
        >
          Lesson 1 · Ages 6–9
        </div>
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 132,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: brand.ink,
            lineHeight: 1.05,
            marginTop: 12,
          }}
        >
          The Internet
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: 60,
            color: brand.trust,
            marginTop: 6,
          }}
        >
          A Big Playground!
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RecapSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { icon: "🔎", text: "Explore" },
    { icon: "🛡", text: "Stay safe" },
    { icon: "🙋", text: "Ask an adult" },
  ];
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1400px 900px at 50% 40%, ${brand.cream}, ${brand.bg} 60%, ${brand.bgDeep})`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 56,
      }}
    >
      <div
        style={{
          fontFamily: "'Oswald', sans-serif",
          fontWeight: 700,
          fontSize: 96,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: brand.ink,
        }}
      >
        Remember
      </div>
      <div style={{ display: "flex", gap: 70 }}>
        {items.map((it, i) => {
          const s = spring({
            frame: frame - i * 8,
            fps,
            config: { damping: 11, stiffness: 130 },
          });
          const sc = interpolate(s, [0, 1], [0.55, 1]);
          const op = interpolate(s, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                width: 400,
                background: "white",
                borderRadius: 36,
                padding: "44px 24px",
                textAlign: "center",
                boxShadow: `0 30px 60px -22px ${brand.ink}55, inset 0 0 0 5px ${brand.primary}`,
                transform: `scale(${sc})`,
                opacity: op,
              }}
            >
              <div style={{ fontSize: 170, lineHeight: 1, fontFamily: EMOJI_STACK }}>
                {it.icon}
              </div>
              <div
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  fontSize: 56,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: brand.ink,
                  marginTop: 16,
                }}
              >
                {it.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
