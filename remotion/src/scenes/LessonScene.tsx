import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, Easing, Audio, staticFile } from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import type { LessonConfig, ModulePalette } from "../types";
import { MODULE_PALETTES } from "../types";
import { CardRenderer } from "../components/CardRenderer";

loadOswald("normal", { weights: ["500", "600", "700"] });
const { fontFamily: emojiFont } = loadEmoji();
const EMOJI_STACK = `'DM Sans', ${emojiFont}, 'Noto Color Emoji', sans-serif`;
const OSWALD = `'Oswald', sans-serif`;
const FPS = 30;

const hash = (n: number) => { let t = n + 0x6d2b79f5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export const LessonScene: React.FC<{ config: LessonConfig }> = ({ config }) => {
  const palette = MODULE_PALETTES[config.module] ?? MODULE_PALETTES["Internet Safety & Privacy"];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: palette.primary }}>
      {config.audioFile && <Audio src={staticFile(`audio/${config.audioFile}`)} />}
      <CameraRig config={config}><StudioBackdrop palette={palette} /><FloatingShapes palette={palette} /><BigScreen config={config} palette={palette} /><LogoBug config={config} palette={palette} /><PresenterImage config={config} /><FloorShadow /><FrontConfetti config={config} palette={palette} /><FrontSparkles config={config} /></CameraRig>
    </AbsoluteFill>
  );
};

const CameraRig: React.FC<{ config: LessonConfig; children: React.ReactNode }> = ({ config, children }) => {
  const frame = useCurrentFrame();
  const keyframes: number[] = []; const scales: number[] = [];
  config.beats.forEach((beat, i) => { const sf = Math.round(beat.startSec * FPS); const ef = Math.round(beat.endSec * FPS); keyframes.push(sf, ef); const push = beat.type === "celebration" ? 0.1 : beat.type === "rules" ? 0.075 : beat.type === "keyword-stamp" ? 0.08 : i % 2 === 0 ? 0.03 : 0.05; scales.push(1.0 + push, 1.0 + push); });
  const scale = keyframes.length > 0 ? interpolate(frame, keyframes, scales, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }) : 1.0;
  return <AbsoluteFill style={{ transform: `scale(${scale}) translate(${Math.sin(frame / 210) * 6}px, ${Math.cos(frame / 260) * 4}px)`, transformOrigin: "74% 52%" }}>{children}</AbsoluteFill>;
};

const StudioBackdrop: React.FC<{ palette: ModulePalette }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(Math.sin(frame / 55), [-1, 1], [0.5, 0.8]);
  return (<AbsoluteFill style={{ background: `linear-gradient(165deg, ${palette.tint} 0%, ${palette.primary}88 48%, ${palette.primary} 100%)` }}><div style={{ position: "absolute", left: -260, top: -300, width: 1250, height: 1250, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,213,79,${glow}), transparent 62%)` }} /><div style={{ position: "absolute", right: -320, bottom: -360, width: 1300, height: 1300, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,93,162,${glow * 0.55}), transparent 64%)` }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 190, background: "linear-gradient(180deg, #FFE9B8, #FFD98E)", borderTop: "6px solid rgba(255,255,255,0.65)" }} /></AbsoluteFill>);
};

const SHAPES = Array.from({ length: 22 }, (_, i) => ({ x: hash(i*3+1)*1920, y: hash(i*3+2)*860, size: 14+hash(i*3+3)*34, speed: 0.14+hash(i*5+4)*0.5, rot: hash(i*7+5)*360, kind: i%3, opacity: 0.35+hash(i*11)*0.4 }));
const FloatingShapes: React.FC<{ palette: ModulePalette }> = ({ palette }) => {
  const frame = useCurrentFrame();
  const colors = ["#FFD54F", palette.secondary, palette.accent, palette.primary, "#8B5CF6", "#FFFFFF"];
  return (<AbsoluteFill>{SHAPES.map((s, i) => { const y = ((s.y - frame * s.speed) % 920) + (s.y - frame * s.speed < -40 ? 920 : 0); return <div key={i} style={{ position: "absolute", left: s.x + Math.sin(frame/40+i)*12, top: y, width: s.size, height: s.size, opacity: s.opacity, transform: `rotate(${s.rot + frame*0.12*(i%2?1:-1)}deg)`, background: s.kind === 1 ? "transparent" : colors[i%6], borderRadius: s.kind === 0 ? "50%" : s.kind === 2 ? 4 : 0, clipPath: s.kind === 1 ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : s.kind === 2 ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined, backgroundColor: s.kind === 1 ? colors[i%6] : undefined }} />; })}</AbsoluteFill>);
};

const BigScreen: React.FC<{ config: LessonConfig; palette: ModulePalette }> = ({ config, palette }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame, fps: FPS, config: { damping: 16, stiffness: 110 } });
  const currentSec = frame / FPS;
  const idx = config.beats.findIndex(b => currentSec >= b.startSec && currentSec < b.endSec);
  const activeBeat = idx >= 0 ? config.beats[idx] : config.beats[config.beats.length - 1];
  const localFrame = frame - Math.round((activeBeat?.startSec ?? 0) * FPS);
  return (<div style={{ position: "absolute", left: 54, top: 84, width: 1130, height: 830, borderRadius: 46, padding: 16, background: `linear-gradient(155deg, ${palette.secondary}, ${palette.primary})`, boxShadow: "0 40px 80px -24px rgba(22,48,91,0.5), 0 0 0 6px rgba(255,255,255,0.85)", transform: `scale(${interpolate(s, [0,1], [0.92,1])})`, transformOrigin: "50% 60%", opacity: interpolate(s, [0,1], [0,1]) }}><div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 32, overflow: "hidden", background: "#FFFDF6" }}>{activeBeat && <CardRenderer beat={activeBeat} localFrame={localFrame} palette={palette} />}<div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 26%, transparent 46%)", pointerEvents: "none" }} /></div></div>);
};

const PresenterImage: React.FC<{ config: LessonConfig }> = ({ config }) => {
  const src = config.presenter === "nonala" ? staticFile("images/nala.png") : staticFile("images/kiki.png");
  return (<div style={{ position: "absolute", right: 20, bottom: 80, width: 540, height: 900, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><Img src={src} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(22,48,91,0.4))" }} /></div>);
};

const LogoBug: React.FC<{ config: LessonConfig; palette: ModulePalette }> = ({ config, palette }) => {
  const frame = useCurrentFrame();
  const name = config.presenter === "nonala" ? "NONALA" : "KIKI";
  return (<div style={{ position: "absolute", bottom: 34, left: 54, background: "rgba(255,255,255,0.92)", borderRadius: 999, padding: "12px 26px", fontFamily: OSWALD, fontWeight: 600, fontSize: 30, letterSpacing: 3, color: "#16305B", boxShadow: "0 10px 24px -10px rgba(22,48,91,0.45)", opacity: interpolate(frame, [12,30], [0,0.95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{name} <span style={{ color: palette.secondary }}>WARRIOR</span> - LESSON {config.lessonNumber}</div>);
};

const FloorShadow: React.FC = () => { const frame = useCurrentFrame(); return <div style={{ position: "absolute", left: 1290, bottom: 78, width: 470, height: 74, borderRadius: "50%", background: "radial-gradient(circle, rgba(22,48,91,0.4), transparent 66%)", transform: `scale(${interpolate(Math.sin(frame/38), [-1,1], [0.95,1.05])})`, filter: "blur(7px)" }} />; };

const CONFETTI = Array.from({ length: 46 }, (_, i) => ({ angle: hash(i*13+1)*Math.PI*2, speed: 0.55+hash(i*13+2)*0.75, size: 12+hash(i*13+3)*20, spin: (hash(i*13+4)-0.5)*14, delay: Math.floor(hash(i*13+5)*12), round: i%4===0 }));
const FrontConfetti: React.FC<{ config: LessonConfig; palette: ModulePalette }> = ({ config, palette }) => {
  const frame = useCurrentFrame();
  const celebBeat = config.beats.find(b => b.type === "celebration");
  if (!celebBeat) return null;
  const startFrame = Math.round(celebBeat.startSec * FPS) + 4;
  const local = frame - startFrame;
  if (local < 0 || local > 150) return null;
  const cc = [palette.secondary, "#FFD54F", palette.accent, palette.primary, "#8B5CF6", "#2EA8E0"];
  return (<AbsoluteFill style={{ pointerEvents: "none" }}>{CONFETTI.map((c, i) => { const t = (local - c.delay) / FPS; if (t <= 0) return null; const v = c.speed * 900; return <div key={i} style={{ position: "absolute", left: 1460+Math.cos(c.angle)*v*t*0.9, top: 480+Math.sin(c.angle)*v*t*0.55+1150*t*t, width: c.size, height: c.round ? c.size : c.size*0.55, background: cc[i%6], borderRadius: c.round ? "50%" : 3, transform: `rotate(${frame*c.spin}deg)`, opacity: interpolate(local-c.delay, [90,140], [1,0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />; })}</AbsoluteFill>);
};

const FrontSparkles: React.FC<{ config: LessonConfig }> = ({ config }) => {
  const frame = useCurrentFrame();
  const sparkleTypes = new Set(["greeting", "title", "rules", "keyword-stamp", "outro"]);
  const hits = config.beats.filter(b => sparkleTypes.has(b.type)).slice(0, 5).map((b, i) => ({ at: Math.round(b.startSec * FPS) + 10, x: 1200 + (i%3)*130, y: 240 + (i%2)*80 }));
  return (<AbsoluteFill style={{ pointerEvents: "none" }}>{hits.map((h, i) => { const local = frame - h.at; if (local < 0 || local > 34) return null; return <React.Fragment key={i}>{Array.from({ length: 9 }, (_, j) => { const a = (j/9)*Math.PI*2 + hash(i*31+j)*0.5; const dist = interpolate(local, [0,26], [10, 120+hash(i+j*7)*70], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }); const sc = interpolate(local, [0,8,26,34], [0,1,0.7,0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); return <div key={j} style={{ position: "absolute", left: h.x+Math.cos(a)*dist, top: h.y+Math.sin(a)*dist, fontSize: 26+hash(i+j*3)*26, fontFamily: EMOJI_STACK, transform: `scale(${sc}) rotate(${local*8}deg)`, opacity: interpolate(local, [24,34], [1,0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{j%3===0 ? "✨" : j%3===1 ? "⭐" : "💫"}</div>; })}</React.Fragment>; })}</AbsoluteFill>);
};
