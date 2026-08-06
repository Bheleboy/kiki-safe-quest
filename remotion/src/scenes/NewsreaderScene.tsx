import {
  AbsoluteFill,
  Video,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";

loadOswald("normal", { weights: ["500", "600", "700"] });
loadDMSans("normal", { weights: ["400", "500", "700", "900"] });
const { fontFamily: emojiFont } = loadEmoji();
const EMOJI_STACK = `'DM Sans', ${emojiFont}, 'Noto Color Emoji', sans-serif`;
const OSWALD = `'Oswald', sans-serif`;
const DMSANS = `'DM Sans', sans-serif`;

const FPS = 30;

/**
 * NewsreaderScene — client-approval cut of young-m1-l1.
 *
 * Feedback applied:
 *  1. More character motion → HeyGen Avatar IV (motion_prompt + high expressiveness)
 *  2. Brighter, more vibrant colors → saturated playful palette below
 *  3. Fun animations → sparkle bursts, confetti, pop-in icons at every beat
 *  4. Dynamic camera → whole-composition push-ins at key beats (CameraRig)
 *  5. Animated text → spring-stamped keyword cards instead of static captions
 *  6/7. Music + SFX → synthesized beds muxed in ffmpeg (this render stays muted)
 *
 * Beat map (frames @30fps), aligned to The_Internet.m4a caption timings.
 */
export const BEATS = {
  greeting: [0, 42],
  title: [42, 198],
  libraryPlayground: [198, 325],
  learnPlayTalk: [325, 439],
  rules: [439, 622],
  needToKnow: [622, 721],
  globe: [721, 835],
  iconGrid: [835, 1061],
  amazing: [1061, 1188],
  greatJob: [1188, 1245],
  keywords: [1245, 1457],
  outro: [1457, 1549],
} as const;

// Vibrant palette — energetic, not muted
export const vibe = {
  sky1: "#8FE3FF",
  sky2: "#3FA9F0",
  sky3: "#1E7FE0",
  orange: "#FF8A2A",
  orangeDeep: "#F26D00",
  yellow: "#FFD54F",
  pink: "#FF5DA2",
  green: "#2FD58A",
  purple: "#8B5CF6",
  blue: "#2EA8E0",
  ink: "#16305B",
  cream: "#FFFDF6",
};

// Deterministic pseudo-random (stable across frames)
const hash = (n: number) => {
  let t = n + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const NewsreaderScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: vibe.sky2 }}>
      <CameraRig>
        <StudioBackdrop />
        <FloatingShapes />
        <BigScreen />
        <LogoBug />
        <KikiPresenter />
        <FloorShadow />
        <FrontConfetti />
        <FrontSparkles />
      </CameraRig>
    </AbsoluteFill>
  );
};

// ============================================================
// Camera rig — piecewise push-ins at key beats, biased toward Kiki
// ============================================================
const CameraRig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(
    frame,
    [0, 439, 540, 622, 721, 835, 1061, 1150, 1188, 1245, 1457, 1548],
    [1.0, 1.03, 1.075, 1.075, 1.04, 1.04, 1.08, 1.08, 1.1, 1.07, 1.05, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    }
  );
  const driftX = Math.sin(frame / 210) * 6;
  const driftY = Math.cos(frame / 260) * 4;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translate(${driftX}px, ${driftY}px)`,
        transformOrigin: "74% 52%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ============================================================
// Bright studio backdrop
// ============================================================
const StudioBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const glowPulse = interpolate(Math.sin(frame / 55), [-1, 1], [0.5, 0.8]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${vibe.sky1} 0%, ${vibe.sky2} 48%, ${vibe.sky3} 100%)`,
      }}
    >
      {/* sun glow behind screen */}
      <div
        style={{
          position: "absolute",
          left: -260,
          top: -300,
          width: 1250,
          height: 1250,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,213,79,${glowPulse}), transparent 62%)`,
        }}
      />
      {/* pink glow behind presenter */}
      <div
        style={{
          position: "absolute",
          right: -320,
          bottom: -360,
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,93,162,${glowPulse * 0.55}), transparent 64%)`,
        }}
      />
      {/* floor */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 190,
          background: `linear-gradient(180deg, #FFE9B8, #FFD98E)`,
          borderTop: `6px solid rgba(255,255,255,0.65)`,
        }}
      />
      {/* playful floor stripes */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 40 + i * 46,
            left: -80,
            right: -80,
            height: 14,
            background: [vibe.orange, vibe.pink, vibe.green][i],
            opacity: 0.35,
            transform: "rotate(-1.2deg)",
            borderRadius: 8,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// ============================================================
// Floating background shapes (parallax drift, vibrant confetti)
// ============================================================
const SHAPES = Array.from({ length: 22 }, (_, i) => ({
  x: hash(i * 3 + 1) * 1920,
  y: hash(i * 3 + 2) * 860,
  size: 14 + hash(i * 3 + 3) * 34,
  speed: 0.14 + hash(i * 5 + 4) * 0.5,
  rot: hash(i * 7 + 5) * 360,
  color: [vibe.yellow, vibe.pink, vibe.orange, vibe.green, vibe.purple, "#FFFFFF"][i % 6],
  kind: i % 3, // 0 circle, 1 star, 2 triangle
  opacity: 0.35 + hash(i * 11) * 0.4,
}));

const FloatingShapes: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {SHAPES.map((s, i) => {
        const y = ((s.y - frame * s.speed) % 920) + (s.y - frame * s.speed < -40 ? 920 : 0);
        const wobble = Math.sin(frame / 40 + i) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x + wobble,
              top: y,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              transform: `rotate(${s.rot + frame * 0.12 * (i % 2 ? 1 : -1)}deg)`,
              background: s.kind === 1 ? "transparent" : s.color,
              borderRadius: s.kind === 0 ? "50%" : s.kind === 2 ? 4 : 0,
              clipPath:
                s.kind === 1
                  ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                  : s.kind === 2
                    ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                    : undefined,
              backgroundColor: s.kind === 1 ? s.color : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================
// The big wall-mounted screen (left ~60% of frame)
// ============================================================
const SCREEN = { left: 54, top: 84, width: 1130, height: 830 };

const BigScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useFrameConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });
  const scale = interpolate(s, [0, 1], [0.92, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: SCREEN.left,
        top: SCREEN.top,
        width: SCREEN.width,
        height: SCREEN.height,
        borderRadius: 46,
        padding: 16,
        background: `linear-gradient(155deg, ${vibe.orange}, ${vibe.orangeDeep})`,
        boxShadow: `0 40px 80px -24px rgba(22,48,91,0.5), 0 0 0 6px rgba(255,255,255,0.85)`,
        transform: `scale(${scale})`,
        transformOrigin: "50% 60%",
        opacity,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 32,
          overflow: "hidden",
          background: vibe.cream,
        }}
      >
        <ScreenContent />
        {/* glare */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 26%, transparent 46%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

const useFrameConfig = () => ({ fps: FPS });

const ScreenContent: React.FC = () => {
  const f = useCurrentFrame();
  const B = BEATS;
  if (f < B.greeting[1]) return <GreetingCard local={f - B.greeting[0]} />;
  if (f < B.title[1]) return <TitleCard local={f - B.title[0]} />;
  if (f < B.libraryPlayground[1]) return <LibraryPlaygroundCard local={f - B.libraryPlayground[0]} />;
  if (f < B.learnPlayTalk[1]) return <LearnPlayTalkCard local={f - B.learnPlayTalk[0]} />;
  if (f < B.rules[1]) return <RulesCard local={f - B.rules[0]} />;
  if (f < B.needToKnow[1]) return <NeedToKnowCard local={f - B.needToKnow[0]} />;
  if (f < B.globe[1]) return <GlobeCard local={f - B.globe[0]} />;
  if (f < B.iconGrid[1]) return <IconGridCard local={f - B.iconGrid[0]} />;
  if (f < B.amazing[1]) return <AmazingCard local={f - B.amazing[0]} />;
  if (f < B.greatJob[1]) return <GreatJobCard local={f - B.greatJob[0]} />;
  if (f < B.keywords[1]) return <KeywordsCard local={f - B.keywords[0]} />;
  return <OutroCard local={f - B.outro[0]} />;
};

// ---------- shared card shell ----------
const CardShell: React.FC<{ children: React.ReactNode; tint?: string }> = ({ children, tint }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(1200px 850px at 50% 34%, #FFFFFF, ${tint ?? "#EAF6FF"})`,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 30,
    }}
  >
    {children}
  </AbsoluteFill>
);

const popIn = (local: number, delay: number) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 10, stiffness: 160 } });
  return {
    transform: `scale(${interpolate(s, [0, 1], [0.4, 1])}) rotate(${interpolate(s, [0, 1], [-6, 0])}deg)`,
    opacity: interpolate(s, [0, 1], [0, 1]),
  };
};

const IconBubble: React.FC<{ icon: string; local: number; delay: number; size?: number; ring?: string }> = ({
  icon,
  local,
  delay,
  size = 210,
  ring = vibe.orange,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "#FFFFFF",
      boxShadow: `0 18px 36px -12px rgba(22,48,91,0.35), inset 0 0 0 8px ${ring}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.52,
      fontFamily: EMOJI_STACK,
      ...popIn(local, delay),
    }}
  >
    {icon}
  </div>
);

const Keyword: React.FC<{
  text: string;
  local: number;
  delay: number;
  color?: string;
  size?: number;
}> = ({ text, local, delay, color = vibe.ink, size = 92 }) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 9, stiffness: 150 } });
  const sc = interpolate(s, [0, 1], [1.7, 1]);
  const op = interpolate(s, [0, 0.35, 1], [0, 1, 1], { extrapolateRight: "clamp" });
  const rot = interpolate(s, [0, 1], [5, 0]);
  return (
    <div
      style={{
        fontFamily: OSWALD,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 3,
        textTransform: "uppercase",
        color,
        textShadow: "0 6px 0 rgba(22,48,91,0.12)",
        transform: `scale(${sc}) rotate(${rot}deg)`,
        opacity: op,
      }}
    >
      {text}
    </div>
  );
};

// ---------- beat cards ----------
const GreetingCard: React.FC<{ local: number }> = ({ local }) => (
  <CardShell tint="#FFF3D9">
    <div style={{ fontSize: 150, fontFamily: EMOJI_STACK, ...popIn(local, 2) }}>👋</div>
    <Keyword text="Hi! I'm Kiki!" local={local} delay={6} color={vibe.orange} size={110} />
  </CardShell>
);

const TitleCard: React.FC<{ local: number }> = ({ local }) => {
  const float = Math.sin(local / 22) * 12;
  return (
    <CardShell tint="#E3F4FF">
      <div
        style={{
          fontSize: 190,
          lineHeight: 1,
          fontFamily: EMOJI_STACK,
          transform: `translateY(${float}px)`,
          ...popIn(local, 0),
        }}
      >
        🌐
      </div>
      <div style={{ textAlign: "center" }}>
        <Keyword text="The Internet" local={local} delay={8} size={150} />
        <div style={{ ...popIn(local, 18) }}>
          <div
            style={{
              fontFamily: DMSANS,
              fontWeight: 900,
              fontSize: 74,
              color: vibe.blue,
              marginTop: 10,
            }}
          >
            A Big Playground!
          </div>
        </div>
      </div>
    </CardShell>
  );
};

const LibraryPlaygroundCard: React.FC<{ local: number }> = ({ local }) => (
  <CardShell tint="#F3ECFF">
    <div style={{ display: "flex", gap: 80 }}>
      <IconBubble icon="📚" local={local} delay={2} ring={vibe.purple} />
      <div style={{ fontSize: 110, fontFamily: DMSANS, fontWeight: 900, color: vibe.ink, alignSelf: "center", ...popIn(local, 14) }}>
        +
      </div>
      <IconBubble icon="🛝" local={local} delay={26} ring={vibe.green} />
    </div>
    <Keyword text="Library + Playground" local={local} delay={38} color={vibe.purple} size={88} />
  </CardShell>
);

const LearnPlayTalkCard: React.FC<{ local: number }> = ({ local }) => (
  <CardShell tint="#E8FBF1">
    <div style={{ display: "flex", gap: 60 }}>
      <IconBubble icon="📖" local={local} delay={2} ring={vibe.blue} />
      <IconBubble icon="🎮" local={local} delay={22} ring={vibe.pink} />
      <IconBubble icon="💬" local={local} delay={42} ring={vibe.orange} />
    </div>
    <div style={{ display: "flex", gap: 46, ...popIn(local, 52) }}>
      {["LEARN", "PLAY", "TALK"].map((w, i) => (
        <div
          key={w}
          style={{
            fontFamily: OSWALD,
            fontWeight: 700,
            fontSize: 62,
            letterSpacing: 2,
            color: [vibe.blue, vibe.pink, vibe.orange][i],
          }}
        >
          {w}
        </div>
      ))}
    </div>
  </CardShell>
);

const RulesCard: React.FC<{ local: number }> = ({ local }) => {
  const underline = interpolate(local, [70, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <CardShell tint="#FFECEF">
      <div style={{ display: "flex", gap: 70 }}>
        <IconBubble icon="🛡️" local={local} delay={2} ring={vibe.orange} size={240} />
        <IconBubble icon="🔒" local={local} delay={18} ring={vibe.blue} size={240} />
      </div>
      <div style={{ position: "relative", textAlign: "center" }}>
        <Keyword text="Rules keep us safe!" local={local} delay={30} color={vibe.orangeDeep} size={100} />
        <div
          style={{
            position: "absolute",
            left: "6%",
            bottom: -16,
            height: 14,
            width: `${underline * 88}%`,
            background: vibe.yellow,
            borderRadius: 8,
          }}
        />
      </div>
    </CardShell>
  );
};

const NeedToKnowCard: React.FC<{ local: number }> = ({ local }) => {
  const wipe = interpolate(local, [0, 22], [-110, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <CardShell tint="#FFF3D9">
      <div style={{ transform: `translateX(${wipe}%)`, opacity: interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" }) }}>
        <div style={{ fontSize: 120, fontFamily: EMOJI_STACK, textAlign: "center" }}>🧭</div>
        <Keyword text="Here's what you" local={local} delay={8} size={96} />
        <Keyword text="need to know" local={local} delay={16} color={vibe.orange} size={96} />
      </div>
    </CardShell>
  );
};

const GlobeCard: React.FC<{ local: number }> = ({ local }) => {
  const draw = interpolate(local, [10, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const nodes = [
    { x: 140, y: 300, e: "💻" },
    { x: 920, y: 240, e: "📱" },
    { x: 260, y: 660, e: "🖥️" },
    { x: 880, y: 620, e: "💻" },
  ];
  const C = { x: 530, y: 420 };
  const path = (n: { x: number; y: number }) =>
    `M ${n.x} ${n.y} Q ${(n.x + C.x) / 2} ${(n.y + C.y) / 2 - 130} ${C.x} ${C.y}`;
  return (
    <CardShell tint="#E3F4FF">
      <div style={{ position: "relative", width: 1098, height: 620 }}>
        <svg width={1098} height={620} style={{ position: "absolute", inset: 0 }}>
          {nodes.map((n, i) => {
            const d = path(n);
            const start = [0.08, 0.28, 0.48, 0.68][i];
            const p = interpolate(draw, [start, start + 0.3], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={[vibe.pink, vibe.green, vibe.purple, vibe.orange][i]}
                strokeWidth={9}
                strokeLinecap="round"
                strokeDasharray={1400}
                strokeDashoffset={1400 * (1 - p)}
                opacity={0.9}
              />
            );
          })}
        </svg>
        {nodes.map((n, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x - 66,
              top: n.y - 66,
              fontSize: 104,
              fontFamily: EMOJI_STACK,
              ...popIn(local, 6 + i * 20),
            }}
          >
            {n.e}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: C.x - 140,
            top: C.y - 140,
            fontSize: 250,
            fontFamily: EMOJI_STACK,
            transform: `scale(${interpolate(local, [0, 30], [0.9, 1], { extrapolateRight: "clamp" }) + Math.sin(local / 18) * 0.02})`,
          }}
        >
          🌐
        </div>
      </div>
      <Keyword text="All around the world!" local={local} delay={60} color={vibe.blue} size={84} />
    </CardShell>
  );
};

const IconGridCard: React.FC<{ local: number }> = ({ local }) => {
  const items = [
    { icon: "📺", label: "WATCH", color: vibe.pink, delay: 2 },
    { icon: "🎮", label: "PLAY", color: vibe.purple, delay: 52 },
    { icon: "🧠", label: "LEARN", color: vibe.green, delay: 130 },
    { icon: "💬", label: "CHAT", color: vibe.orange, delay: 185 },
  ];
  return (
    <CardShell tint="#F3ECFF">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 46 }}>
        {items.map((it) => (
          <div
            key={it.label}
            style={{
              width: 420,
              background: "#FFFFFF",
              borderRadius: 34,
              padding: "26px 18px",
              textAlign: "center",
              boxShadow: `0 22px 44px -18px rgba(22,48,91,0.35), inset 0 0 0 7px ${it.color}`,
              ...popIn(local, it.delay),
            }}
          >
            <div style={{ fontSize: 128, lineHeight: 1, fontFamily: EMOJI_STACK }}>{it.icon}</div>
            <div
              style={{
                fontFamily: OSWALD,
                fontWeight: 700,
                fontSize: 52,
                letterSpacing: 3,
                color: it.color,
                marginTop: 8,
              }}
            >
              {it.label}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
};

const AmazingCard: React.FC<{ local: number }> = ({ local }) => {
  const flash = interpolate(local, [0, 10, 26], [0.55, 0.25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <CardShell tint="#FFF3D9">
      <div style={{ position: "absolute", inset: 0, background: vibe.yellow, opacity: flash }} />
      <div style={{ fontSize: 170, fontFamily: EMOJI_STACK, ...popIn(local, 0) }}>✨</div>
      <Keyword text="Amazing!" local={local} delay={6} color={vibe.orange} size={150} />
      <div style={{ ...popIn(local, 55) }}>
        <div
          style={{
            fontFamily: DMSANS,
            fontWeight: 900,
            fontSize: 76,
            color: vibe.ink,
            background: vibe.yellow,
            padding: "10px 42px",
            borderRadius: 26,
            transform: "rotate(-1.5deg)",
          }}
        >
          but be careful too!
        </div>
      </div>
    </CardShell>
  );
};

const GreatJobCard: React.FC<{ local: number }> = ({ local }) => (
  <CardShell tint="#E8FBF1">
    <div style={{ fontSize: 150, fontFamily: EMOJI_STACK, ...popIn(local, 0) }}>🏆</div>
    <Keyword text="Great job," local={local} delay={4} color={vibe.green} size={130} />
    <Keyword text="Warrior!" local={local} delay={12} color={vibe.orange} size={150} />
  </CardShell>
);

const KeywordsCard: React.FC<{ local: number }> = ({ local }) => {
  const words = [
    { w: "SAFE", icon: "🛡️", color: vibe.green, delay: 8 },
    { w: "KIND", icon: "💛", color: vibe.orange, delay: 50 },
    { w: "TELL a grown-up", icon: "🙋", color: vibe.pink, delay: 105 },
  ];
  return (
    <CardShell tint="#EAF6FF">
      <Keyword text="Remember" local={local} delay={0} color={vibe.ink} size={86} />
      <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>
        {words.map((k) => (
          <div key={k.w} style={{ display: "flex", alignItems: "center", gap: 34 }}>
            <div style={{ fontSize: 96, fontFamily: EMOJI_STACK, ...popIn(local, k.delay) }}>{k.icon}</div>
            <Keyword text={k.w} local={local} delay={k.delay + 4} color={k.color} size={110} />
          </div>
        ))}
      </div>
    </CardShell>
  );
};

const OutroCard: React.FC<{ local: number }> = ({ local }) => {
  const float = Math.sin(local / 16) * 10;
  return (
    <CardShell tint="#FFF3D9">
      <div style={{ fontSize: 170, fontFamily: EMOJI_STACK, transform: `translateY(${float}px)`, ...popIn(local, 0) }}>
        👋
      </div>
      <Keyword text="See you in the" local={local} delay={6} size={104} />
      <Keyword text="next lesson!" local={local} delay={14} color={vibe.orange} size={120} />
    </CardShell>
  );
};

// ============================================================
// Logo bug (top-right)
// ============================================================
const LogoBug: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [12, 30], [0, 0.95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 34,
        left: 54,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 999,
        padding: "12px 26px",
        fontFamily: OSWALD,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: 3,
        color: vibe.ink,
        boxShadow: "0 10px 24px -10px rgba(22,48,91,0.45)",
        opacity: op,
      }}
    >
      KIKI <span style={{ color: vibe.orange }}>WARRIOR</span> · LESSON 1
    </div>
  );
};

// ============================================================
// Kiki presenter — HeyGen Avatar IV transparent WebM
// ============================================================
// HeyGen output: 616x1080 portrait transparent WebM (full-body, feet at bottom edge)
const KikiPresenter: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: 1218,
        top: 0,
        width: 616,
        height: 1080,
        transform: "scale(0.96) translateY(-54px)",
        transformOrigin: "50% 100%",
      }}
    >
      <Video
        src={staticFile("kiki-newsreader.webm")}
        transparent
        muted
        style={{ width: 616, height: 1080 }}
      />
    </div>
  );
};

const FloorShadow: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = interpolate(Math.sin(frame / 38), [-1, 1], [0.95, 1.05]);
  return (
    <div
      style={{
        position: "absolute",
        left: 1290,
        bottom: 78,
        width: 470,
        height: 74,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(22,48,91,0.4), transparent 66%)",
        transform: `scale(${breathe})`,
        filter: "blur(7px)",
      }}
    />
  );
};

// ============================================================
// Front layers — confetti at "Great job", sparkles at key beats
// ============================================================
const CONFETTI = Array.from({ length: 46 }, (_, i) => ({
  angle: hash(i * 13 + 1) * Math.PI * 2,
  speed: 0.55 + hash(i * 13 + 2) * 0.75,
  size: 12 + hash(i * 13 + 3) * 20,
  color: [vibe.orange, vibe.yellow, vibe.pink, vibe.green, vibe.purple, vibe.blue][i % 6],
  spin: (hash(i * 13 + 4) - 0.5) * 14,
  delay: Math.floor(hash(i * 13 + 5) * 12),
  round: i % 4 === 0,
}));

const FrontConfetti: React.FC = () => {
  const frame = useCurrentFrame();
  const start = BEATS.greatJob[0] + 4;
  const local = frame - start;
  if (local < 0 || local > 150) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CONFETTI.map((c, i) => {
        const t = (local - c.delay) / FPS;
        if (t <= 0) return null;
        const v = c.speed * 900;
        const x = 1460 + Math.cos(c.angle) * v * t * 0.9;
        const y = 480 + Math.sin(c.angle) * v * t * 0.55 + 1150 * t * t;
        const op = interpolate(local - c.delay, [90, 140], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: c.size,
              height: c.round ? c.size : c.size * 0.55,
              background: c.color,
              borderRadius: c.round ? "50%" : 3,
              transform: `rotate(${frame * c.spin}deg)`,
              opacity: op,
            }}
          />
        );
      })}
      {/* big celebratory stars */}
      {["⭐", "🌟", "✨", "🎉"].map((e, i) => {
        const t = (local - i * 6) / FPS;
        if (t <= 0) return null;
        const x = 1290 + i * 130 + Math.sin(i * 9) * 40;
        const y = 330 + Math.cos(i * 7) * 60 + 520 * t * t;
        const s = spring({ frame: local - i * 6, fps: FPS, config: { damping: 9, stiffness: 170 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontSize: 90,
              fontFamily: EMOJI_STACK,
              transform: `scale(${interpolate(s, [0, 1], [0.3, 1])}) rotate(${frame * 4 * (i % 2 ? 1 : -1)}deg)`,
              opacity: interpolate(local, [100, 140], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {e}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const SPARKLE_HITS = [
  { at: BEATS.greeting[0] + 10, x: 1330, y: 260 },
  { at: BEATS.title[0] + 8, x: 620, y: 240 },
  { at: BEATS.rules[0] + 100, x: 1240, y: 300 },
  { at: BEATS.amazing[0] + 6, x: 560, y: 300 },
  { at: BEATS.outro[0] + 10, x: 1350, y: 280 },
];

const SparkleBurst: React.FC<{ local: number; x: number; y: number; seed: number }> = ({ local, x, y, seed }) => {
  if (local < 0 || local > 34) return null;
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + hash(seed * 31 + i) * 0.5;
        const dist = interpolate(local, [0, 26], [10, 120 + hash(seed + i * 7) * 70], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const sc = interpolate(local, [0, 8, 26, 34], [0, 1, 0.7, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.cos(a) * dist,
              top: y + Math.sin(a) * dist,
              fontSize: 26 + hash(seed + i * 3) * 26,
              fontFamily: EMOJI_STACK,
              transform: `scale(${sc}) rotate(${local * 8}deg)`,
              opacity: interpolate(local, [24, 34], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {i % 3 === 0 ? "✨" : i % 3 === 1 ? "⭐" : "💫"}
          </div>
        );
      })}
    </>
  );
};

const FrontSparkles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {SPARKLE_HITS.map((h, i) => (
        <SparkleBurst key={i} local={frame - h.at} x={h.x} y={h.y} seed={i * 97 + 13} />
      ))}
    </AbsoluteFill>
  );
};
