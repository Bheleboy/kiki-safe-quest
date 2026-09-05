import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import type { BeatCard, CardIcon, KeywordItem, ModulePalette } from "../types";

loadOswald("normal", { weights: ["500", "600", "700"] });
loadDMSans("normal", { weights: ["400", "500", "700", "900"] });
const { fontFamily: emojiFont } = loadEmoji();

const EMOJI_STACK = `'DM Sans', ${emojiFont}, 'Noto Color Emoji', sans-serif`;
const OSWALD = `'Oswald', sans-serif`;
const DMSANS = `'DM Sans', sans-serif`;
const FPS = 30;

const CardShell: React.FC<{ children: React.ReactNode; tint?: string }> = ({ children, tint }) => (
  <AbsoluteFill style={{ background: `radial-gradient(1200px 850px at 50% 34%, #FFFFFF, ${tint ?? "#EAF6FF"})`, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>{children}</AbsoluteFill>
);

const popIn = (local: number, delay: number) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 10, stiffness: 160 } });
  return { transform: `scale(${interpolate(s, [0, 1], [0.4, 1])}) rotate(${interpolate(s, [0, 1], [-6, 0])}deg)`, opacity: interpolate(s, [0, 1], [0, 1]) };
};

const IconBubble: React.FC<{ icon: string; local: number; delay: number; size?: number; ring?: string }> = ({ icon, local, delay, size = 210, ring = "#FF8A2A" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "#FFFFFF", boxShadow: `0 18px 36px -12px rgba(22,48,91,0.35), inset 0 0 0 8px ${ring}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.52, fontFamily: EMOJI_STACK, ...popIn(local, delay) }}>{icon}</div>
);

const Keyword: React.FC<{ text: string; local: number; delay: number; color?: string; size?: number }> = ({ text, local, delay, color = "#16305B", size = 92 }) => {
  const s = spring({ frame: local - delay, fps: FPS, config: { damping: 9, stiffness: 150 } });
  return (<div style={{ fontFamily: OSWALD, fontWeight: 700, fontSize: size, letterSpacing: 3, textTransform: "uppercase", color, textShadow: "0 6px 0 rgba(22,48,91,0.12)", transform: `scale(${interpolate(s, [0, 1], [1.7, 1])}) rotate(${interpolate(s, [0, 1], [5, 0])}deg)`, opacity: interpolate(s, [0, 0.35, 1], [0, 1, 1], { extrapolateRight: "clamp" }) }}>{text}</div>);
};

const GreetingCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => (
  <CardShell tint="#FFF3D9"><div style={{ fontSize: 150, fontFamily: EMOJI_STACK, ...popIn(local, 2) }}>{beat.icons?.[0]?.emoji ?? "👋"}</div><Keyword text={beat.heading ?? "Hi! I'm Kiki!"} local={local} delay={6} color={palette.secondary} size={110} /></CardShell>
);

const TitleCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const float = Math.sin(local / 22) * 12;
  return (<CardShell tint={palette.tint}><div style={{ fontSize: 190, lineHeight: 1, fontFamily: EMOJI_STACK, transform: `translateY(${float}px)`, ...popIn(local, 0) }}>{beat.icons?.[0]?.emoji ?? "🌐"}</div><div style={{ textAlign: "center" }}><Keyword text={beat.heading ?? ""} local={local} delay={8} size={130} />{beat.subheading && <div style={popIn(local, 18)}><div style={{ fontFamily: DMSANS, fontWeight: 900, fontSize: 68, color: palette.primary, marginTop: 10 }}>{beat.subheading}</div></div>}</div></CardShell>);
};

const IconPairCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const icons = beat.icons ?? [];
  return (<CardShell tint={beat.tint ?? palette.tint}><div style={{ display: "flex", gap: 80 }}>{icons[0] && <IconBubble icon={icons[0].emoji} local={local} delay={2} ring={icons[0].ring ?? palette.primary} />}<div style={{ fontSize: 110, fontFamily: DMSANS, fontWeight: 900, color: "#16305B", alignSelf: "center", ...popIn(local, 14) }}>+</div>{icons[1] && <IconBubble icon={icons[1].emoji} local={local} delay={26} ring={icons[1].ring ?? palette.accent} />}</div>{beat.heading && <Keyword text={beat.heading} local={local} delay={38} color={palette.primary} size={88} />}</CardShell>);
};

const IconTrioCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const icons = beat.icons ?? [];
  const colors = [palette.primary, palette.secondary, palette.accent];
  return (<CardShell tint={beat.tint ?? "#E8FBF1"}><div style={{ display: "flex", gap: 60 }}>{icons.map((ic, i) => <IconBubble key={i} icon={ic.emoji} local={local} delay={2 + i * 20} ring={ic.ring ?? colors[i % 3]} />)}</div>{icons.some(ic => ic.label) && <div style={{ display: "flex", gap: 46, ...popIn(local, 52) }}>{icons.map((ic, i) => <div key={i} style={{ fontFamily: OSWALD, fontWeight: 700, fontSize: 62, letterSpacing: 2, color: ic.ring ?? colors[i % 3] }}>{ic.label ?? ""}</div>)}</div>}</CardShell>);
};

const IconGridCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const items = beat.icons ?? [];
  const colors = [palette.secondary, palette.primary, palette.accent, "#FF8A2A"];
  return (<CardShell tint={beat.tint ?? "#F3ECFF"}><div style={{ display: "grid", gridTemplateColumns: items.length <= 2 ? "1fr" : "1fr 1fr", gap: 46 }}>{items.map((it, i) => <div key={i} style={{ width: 420, background: "#FFFFFF", borderRadius: 34, padding: "26px 18px", textAlign: "center", boxShadow: `0 22px 44px -18px rgba(22,48,91,0.35), inset 0 0 0 7px ${it.ring ?? colors[i % 4]}`, ...popIn(local, i * 50 + 2) }}><div style={{ fontSize: 128, lineHeight: 1, fontFamily: EMOJI_STACK }}>{it.emoji}</div>{it.label && <div style={{ fontFamily: OSWALD, fontWeight: 700, fontSize: 52, letterSpacing: 3, color: it.ring ?? colors[i % 4], marginTop: 8 }}>{it.label}</div>}</div>)}</div></CardShell>);
};

const KeywordStampCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => (
  <CardShell tint={beat.tint ?? "#FFF3D9"}>{beat.icons?.[0] && <div style={{ fontSize: 170, fontFamily: EMOJI_STACK, ...popIn(local, 0) }}>{beat.icons[0].emoji}</div>}<Keyword text={beat.heading ?? ""} local={local} delay={6} color={palette.secondary} size={130} />{beat.subheading && <div style={popIn(local, 55)}><div style={{ fontFamily: DMSANS, fontWeight: 900, fontSize: 76, color: "#16305B", background: "#FFD54F", padding: "10px 42px", borderRadius: 26, transform: "rotate(-1.5deg)" }}>{beat.subheading}</div></div>}</CardShell>
);

const RulesCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const icons = beat.icons ?? [{ emoji: "🛡️" }, { emoji: "🔒" }];
  const underline = interpolate(local, [70, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (<CardShell tint={beat.tint ?? "#FFECEF"}><div style={{ display: "flex", gap: 70 }}>{icons.map((ic, i) => <IconBubble key={i} icon={ic.emoji} local={local} delay={2 + i * 16} size={240} ring={ic.ring ?? (i === 0 ? palette.secondary : palette.primary)} />)}</div><div style={{ position: "relative", textAlign: "center" }}><Keyword text={beat.heading ?? "Stay safe!"} local={local} delay={30} color={palette.secondary} size={100} /><div style={{ position: "absolute", left: "6%", bottom: -16, height: 14, width: `${underline * 88}%`, background: "#FFD54F", borderRadius: 8 }} /></div></CardShell>);
};

const TransitionCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const wipe = interpolate(local, [0, 22], [-110, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (<CardShell tint="#FFF3D9"><div style={{ transform: `translateX(${wipe}%)`, opacity: interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" }), textAlign: "center" }}>{beat.icons?.[0] && <div style={{ fontSize: 120, fontFamily: EMOJI_STACK }}>{beat.icons[0].emoji}</div>}<Keyword text={beat.heading ?? ""} local={local} delay={8} size={96} />{beat.subheading && <Keyword text={beat.subheading} local={local} delay={16} color={palette.secondary} size={96} />}</div></CardShell>);
};

const GlobeCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const draw = interpolate(local, [10, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const nodes = [{ x: 140, y: 300, e: "💻" }, { x: 920, y: 240, e: "📱" }, { x: 260, y: 660, e: "🖥️" }, { x: 880, y: 620, e: "💻" }];
  const C = { x: 530, y: 420 };
  const colors = [palette.secondary, palette.accent, palette.primary, "#FF8A2A"];
  return (<CardShell tint={palette.tint}><div style={{ position: "relative", width: 1098, height: 620 }}><svg width={1098} height={620} style={{ position: "absolute", inset: 0 }}>{nodes.map((n, i) => { const d = `M ${n.x} ${n.y} Q ${(n.x + C.x) / 2} ${(n.y + C.y) / 2 - 130} ${C.x} ${C.y}`; const start = [0.08, 0.28, 0.48, 0.68][i]; const p = interpolate(draw, [start, start + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return <path key={i} d={d} fill="none" stroke={colors[i]} strokeWidth={9} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - p)} opacity={0.9} />; })}</svg>{nodes.map((n, i) => <div key={i} style={{ position: "absolute", left: n.x - 66, top: n.y - 66, fontSize: 104, fontFamily: EMOJI_STACK, ...popIn(local, 6 + i * 20) }}>{n.e}</div>)}<div style={{ position: "absolute", left: C.x - 140, top: C.y - 140, fontSize: 250, fontFamily: EMOJI_STACK, transform: `scale(${interpolate(local, [0, 30], [0.9, 1], { extrapolateRight: "clamp" }) + Math.sin(local / 18) * 0.02})` }}>🌐</div></div>{beat.heading && <Keyword text={beat.heading} local={local} delay={60} color={palette.primary} size={84} />}</CardShell>);
};

const CelebrationCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => (
  <CardShell tint="#E8FBF1"><div style={{ fontSize: 150, fontFamily: EMOJI_STACK, ...popIn(local, 0) }}>{beat.icons?.[0]?.emoji ?? "🏆"}</div><Keyword text={beat.heading ?? "Great job,"} local={local} delay={4} color={palette.accent} size={130} />{beat.subheading && <Keyword text={beat.subheading} local={local} delay={12} color={palette.secondary} size={150} />}</CardShell>
);

const KeywordsListCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const words = beat.keywords ?? [];
  return (<CardShell tint={palette.tint}>{beat.heading && <Keyword text={beat.heading} local={local} delay={0} color="#16305B" size={86} />}<div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>{words.map((k, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 34 }}><div style={{ fontSize: 96, fontFamily: EMOJI_STACK, ...popIn(local, 8 + i * 42) }}>{k.icon}</div><Keyword text={k.word} local={local} delay={12 + i * 42} color={k.color} size={110} /></div>)}</div></CardShell>);
};

const OutroCard: React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }> = ({ beat, local, palette }) => {
  const float = Math.sin(local / 16) * 10;
  return (<CardShell tint="#FFF3D9"><div style={{ fontSize: 170, fontFamily: EMOJI_STACK, transform: `translateY(${float}px)`, ...popIn(local, 0) }}>{beat.icons?.[0]?.emoji ?? "👋"}</div><Keyword text={beat.heading ?? "See you in the"} local={local} delay={6} size={104} /><Keyword text={beat.subheading ?? "next lesson!"} local={local} delay={14} color={palette.secondary} size={120} /></CardShell>);
};

const CARD_MAP: Record<string, React.FC<{ beat: BeatCard; local: number; palette: ModulePalette }>> = {
  greeting: GreetingCard, title: TitleCard, "icon-pair": IconPairCard, "icon-trio": IconTrioCard, "icon-grid": IconGridCard, "keyword-stamp": KeywordStampCard, rules: RulesCard, transition: TransitionCard, globe: GlobeCard, celebration: CelebrationCard, "keywords-list": KeywordsListCard, outro: OutroCard,
};

export const CardRenderer: React.FC<{ beat: BeatCard; localFrame: number; palette: ModulePalette }> = ({ beat, localFrame, palette }) => {
  const Component = CARD_MAP[beat.type];
  if (!Component) return null;
  return <Component beat={beat} local={localFrame} palette={palette} />;
};
