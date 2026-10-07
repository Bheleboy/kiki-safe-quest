import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlayCircle, RotateCcw, Volume2 } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const CAPTIONS = [
  "Hi, I'm Kiki!",
  "Today we're learning about the internet, a big playground.",
];
const FACTS = ["40 video lessons", "Ages 6-9 and 10-13", "Parent dashboard included"];

type SoundState = "idle" | "playing" | "ended";

export default function HeroSection() {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [sound, setSound] = useState<SoundState>("idle");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCaptionIdx(v.currentTime >= 2.3 ? 1 : 0);
    const onEnded = () => setSound("ended");
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  const playWithSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    setCaptionIdx(0);
    setSound("playing");
    v.play().catch(() => setSound("idle"));
  };

  const container = reduce
    ? {}
    : {
        initial: "hidden",
        animate: "show",
        variants: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
      };
  const item = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
        },
      };

  const btnLabel =
    sound === "playing" ? "Playing..." : sound === "ended" ? "Hear Kiki again" : "Hear Kiki";

  return (
    <section className="relative lg:min-h-[88vh] flex items-center overflow-x-clip">
      <div className="max-w-6xl mx-auto px-4 py-16 lg:py-20 w-full grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        {/* Copy */}
        <motion.div {...container} className="space-y-6 min-w-0">
          <motion.div {...item}>
            <span className="inline-block rounded-full bg-primary/10 text-primary px-4 py-1.5 font-display text-xs uppercase tracking-widest">
              Pre-launch - join the first families
            </span>
          </motion.div>
          <motion.h1
            {...item}
            className="font-display normal-case text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight text-foreground"
          >
            Safe, smart and kind
            <br />
            <span className="text-primary">online.</span>
          </motion.h1>
          <motion.p {...item} className="font-body text-lg text-muted-foreground max-w-[34rem] leading-relaxed">
            Meet Kiki, the young warrior who teaches children aged 6 to 13 how to stay safe on the
            internet. Short talking video lessons, quick quizzes, and pieces of the Armour of God to
            earn along the way.
          </motion.p>
          <motion.div {...item} className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/courses/internet-safety"
              className="touch-target inline-flex items-center gap-2 btn-copper px-8 py-4 text-sm uppercase tracking-widest"
            >
              Watch a free lesson <PlayCircle className="w-5 h-5" />
            </Link>
            <Link
              to="/auth?mode=signup"
              className="touch-target inline-flex items-center gap-2 border-2 border-foreground/15 hover:border-primary rounded-xl px-8 py-4 text-sm font-display uppercase tracking-widest text-foreground transition-colors"
            >
              Join the pre-launch
            </Link>
          </motion.div>
          <motion.ul {...item} className="flex flex-wrap items-center gap-x-3 gap-y-2 font-body text-sm text-muted-foreground">
            {FACTS.map((f, i) => (
              <li key={f} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-primary" />}
                {f}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Stage */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="absolute -inset-y-10 inset-x-0 lg:-inset-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(25 85% 55% / 0.10) 0%, transparent 70%)" }}
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
            className="relative overflow-hidden rounded-[2rem] w-full h-[60vh] lg:h-auto lg:aspect-[4/5] lg:max-h-[70vh] mx-auto"
            style={{ backgroundColor: "#F1DDC4" }}
          >
            <video
              ref={videoRef}
              src="/hero/kiki-hello.mp4"
              poster="/hero/kiki-hello-poster.jpg"
              muted
              playsInline
              autoPlay={!reduce}
              preload="metadata"
              aria-label="Kiki says: Hi, I'm Kiki! Today we're learning about the internet, a big playground."
              className="absolute left-1/2 -translate-x-1/2 bottom-[28px] h-[calc(92%-28px)] w-full object-contain object-bottom"
            />

            <div className="absolute top-5 inset-x-0 flex justify-center px-4 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={captionIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/90 rounded-full px-4 py-2 font-body font-medium text-sm text-foreground shadow-sm text-center max-w-full"
                >
                  {CAPTIONS[captionIdx]}
                </motion.span>
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={playWithSound}
              disabled={sound === "playing"}
              aria-label={sound === "ended" ? "Replay Kiki's greeting with sound" : "Play Kiki's greeting with sound"}
              className="absolute right-4 bottom-[40px] inline-flex items-center gap-2 rounded-full bg-foreground text-white px-4 py-2 font-display text-xs uppercase tracking-widest shadow-sm disabled:opacity-80 transition-opacity"
            >
              {sound === "ended" ? <RotateCcw className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {btnLabel}
            </button>

            <svg aria-hidden className="absolute bottom-0 left-0 w-full h-[28px]">
              <defs>
                <pattern id="kiki-shield-band" width="28" height="28" patternUnits="userSpaceOnUse">
                  <rect width="28" height="28" fill="#5A3A28" />
                  <polygon points="0,28 14,4 28,28" fill="hsl(25 85% 55%)" />
                  <polygon points="14,4 28,28 28,4" fill="#5A3A28" />
                  <polygon points="-14,4 0,28 14,4" fill="#5A3A28" />
                </pattern>
              </defs>
              <rect width="100%" height="28" fill="url(#kiki-shield-band)" />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
