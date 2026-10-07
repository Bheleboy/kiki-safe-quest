import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Play, PlayCircle } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const LINES = [
  "Learn to be safe online.",
  "Stand strong against bullies and scams.",
  "Be kind wherever you click.",
  "Earn the Armour of God, one quest at a time.",
];
const STREAMS = {
  "6-9": { label: "Ages 6-9", count: 15, copy: "Short, playful video lessons on staying safe, smart and kind online." },
  "10-13": { label: "Ages 10-13", count: 25, copy: "Real-world skills: privacy, scams, cyberbullying and your digital footprint." },
} as const;
type Stream = keyof typeof STREAMS;

const wordBase = "font-display font-bold uppercase leading-[0.8] tracking-[-0.03em] select-none";

function KikiWord({ reduce, className }: { reduce: boolean; className: string }) {
  return (
    <div aria-hidden className={`${wordBase} text-primary flex ${className}`}>
      {"KIKI".split("").map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.04em]">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.05 }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

function Pill({ className = "" }: { className?: string }) {
  return (
    <span className={`items-center gap-2 rounded-full bg-white/70 border border-black/5 px-3 py-1 font-display text-[11px] uppercase tracking-widest text-foreground/70 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      Pre-launch - join the first families
    </span>
  );
}

function KikiFigure({ reduce }: { reduce: boolean }) {
  const [safari, setSafari] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<number>();

  useEffect(() => {
    setSafari(/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent));
    return () => window.clearTimeout(timer.current);
  }, []);

  const onEnded = () => {
    timer.current = window.setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = 0;
      v.play().catch(() => {});
    }, 3000);
  };

  const still = safari || reduce;

  return (
    <motion.div
      className="relative w-full h-full"
      initial={reduce ? false : { y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 16, delay: 0.35 }}
    >
      <div
        aria-hidden
        className="absolute z-10 left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] pointer-events-none"
        style={{ background: "radial-gradient(closest-side, hsl(25 85% 55% / 0.18), transparent)" }}
      />
      <div aria-hidden className="absolute z-10 left-1/2 -translate-x-1/2 bottom-[5%] w-[45%] h-[18px] rounded-[50%] bg-black/20 blur-xl pointer-events-none" />
      <div className="relative z-20 w-full h-full">
        {still ? (
          <motion.img
            src="/hero/kiki-full.png"
            alt="Kiki the young warrior with her spear and shield"
            className="w-full h-full object-contain object-bottom"
            animate={!reduce ? { y: [0, -8, 0] } : undefined}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <video
            ref={videoRef}
            src="/hero/kiki-idle.webm"
            poster="/hero/kiki-full.png"
            muted
            playsInline
            autoPlay
            preload="auto"
            onEnded={onEnded}
            aria-label="Kiki the young warrior with her spear and shield"
            className="w-full h-full object-contain object-bottom"
          />
        )}
      </div>
    </motion.div>
  );
}

function QuoteBlock({ reduce }: { reduce: boolean }) {
  const item = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay: 0.6 + i * 0.08 },
  });
  return (
    <div>
      <motion.div {...item(0)}><Pill className="hidden lg:inline-flex" /></motion.div>
      <motion.span {...item(1)} aria-hidden className="font-display text-6xl leading-none h-9 lg:h-7 block mt-4 lg:mt-2 text-primary/50">
        &ldquo;
      </motion.span>
      {LINES.map((l, i) => (
        <motion.p key={l} {...item(i + 2)} className="font-body text-[17px] lg:text-[15px] xl:text-[17px] leading-[1.6] text-foreground/80">
          {l}
        </motion.p>
      ))}
      <motion.div {...item(6)} className="mt-6 lg:mt-4 flex flex-wrap gap-3">
        <Link to="/courses/internet-safety" className="btn-copper inline-flex items-center gap-2 px-6 py-3.5 lg:py-3 xl:py-3.5 text-sm uppercase tracking-widest rounded-xl font-display">
          <PlayCircle size={18} /> Start your quest
        </Link>
        <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 bg-foreground text-background rounded-xl px-6 py-3.5 lg:py-3 xl:py-3.5 text-sm uppercase tracking-widest font-display hover:opacity-90 transition-opacity">
          Join the pre-launch
        </Link>
      </motion.div>
    </div>
  );
}

function HelloTile() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden shadow-xl bg-foreground/10">
      {playing ? (
        <video src="/hero/kiki-hello.mp4" autoPlay playsInline controls onEnded={() => setPlaying(false)} className="w-full h-full object-cover object-[center_18%]" />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label="Play video: hear Kiki say hello (with sound)" className="group block w-full h-full relative">
          <img src="/hero/kiki-hello-poster.jpg" alt="" className="w-full h-full object-cover object-[center_18%]" />
          <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="absolute left-5 bottom-4 text-white font-display text-xs uppercase tracking-widest">Hear Kiki say hello</span>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
            <Play size={24} className="text-primary fill-current ml-1" />
          </span>
        </button>
      )}
    </div>
  );
}

function useCountUp(target: number, reduce: boolean) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduce) { setVal(target); from.current = target; return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 600);
      setVal(Math.round(a + (target - a) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return val;
}

function QuestCard({ reduce }: { reduce: boolean }) {
  const [stream, setStream] = useState<Stream>("6-9");
  const count = useCountUp(STREAMS[stream].count, reduce);
  return (
    <div className="rounded-[2.25rem] bg-white border border-black/5 shadow-[0_40px_90px_-30px_rgba(70,45,20,0.35)] p-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs tracking-[0.3em] text-foreground/50">THE QUEST</span>
        <span aria-hidden className="w-4 h-4 bg-primary" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      </div>
      <div className="flex gap-2 mt-4" role="group" aria-label="Choose age group">
        {(Object.keys(STREAMS) as Stream[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={stream === k}
            onClick={() => setStream(k)}
            className={`rounded-full px-3 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors ${stream === k ? "bg-primary text-white" : "bg-black/5 text-foreground/70 hover:bg-black/10"}`}
          >
            {STREAMS[k].label}
          </button>
        ))}
      </div>
      <div className="relative mt-4 min-h-[3.75rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={stream}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="font-body text-sm text-foreground/70"
          >
            {STREAMS[stream].copy}
          </motion.p>
        </AnimatePresence>
      </div>
      <img src="/images/kiki-armour-of-god.png" alt="Kiki and the Armour of God book cover" className="h-44 object-contain mx-auto my-5 -rotate-3 drop-shadow-xl" />
      <p className="font-body text-xs text-foreground/50 text-center">Earn every piece of the Armour of God</p>
      <div className="flex items-end justify-between mt-5">
        <div>
          <p className="font-body text-xs text-foreground/50">Video lessons</p>
          <p className="font-display text-6xl font-bold leading-none" aria-live="polite">{count}</p>
        </div>
        <Link to="/courses/internet-safety" aria-label="Go to the Internet Safety course" className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center transition-transform hover:scale-105">
          <ArrowUpRight size={26} />
        </Link>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const reduce = !!useReducedMotion();
  const fade = (delay: number, x = 0, y = 0) => ({
    initial: reduce ? false : { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section className="relative overflow-hidden bg-[#F4EEE6] pt-10 pb-12 lg:pt-6 lg:pb-0 lg:h-[calc(100vh-58px)] lg:min-h-[700px] lg:max-h-[1000px]">
      <h1 className="sr-only">Kiki Warrior Online Academy</h1>
      <div className="max-w-[1400px] mx-auto px-6 h-full relative">
        {/* Mobile pill */}
        <div className="flex justify-center lg:hidden">
          <Pill className="inline-flex" />
        </div>

        {/* KIKI word */}
        <KikiWord
          reduce={reduce}
          className="justify-center mt-4 text-[40vw] lg:mt-0 lg:justify-start lg:absolute lg:top-[6%] lg:left-6 lg:text-[clamp(9rem,20vw,16rem)] xl:text-[clamp(9rem,20vw,22rem)]"
        />

        {/* WARRIOR word, desktop */}
        <motion.div
          {...fade(0.3, 0, 30)}
          aria-hidden
          className={`${wordBase} hidden lg:block absolute bottom-[-1%] left-0 right-0 text-center z-0 text-[#E6DBCC] text-[clamp(7rem,17vw,17rem)]`}
        >
          WARRIOR
        </motion.div>

        {/* Kiki */}
        <div className="relative mx-auto h-[min(70vh,130vw)] max-h-[640px] aspect-[2/3] -mt-[18vw] lg:mt-0 lg:max-h-none lg:absolute lg:bottom-0 lg:left-1/2 lg:-translate-x-[46%] lg:h-[86%] xl:h-[94%] z-20">
          <motion.div
            {...fade(0.3, 0, 30)}
            aria-hidden
            className={`${wordBase} lg:hidden absolute bottom-[4%] left-1/2 w-screen -ml-[50vw] text-center whitespace-nowrap text-[21vw] text-[#E6DBCC] z-0`}
          >
            WARRIOR
          </motion.div>
          <div className="relative z-10 w-full h-full">
            <KikiFigure reduce={reduce} />
          </div>
        </div>

        {/* Left column: quote then video tile (desktop stacks between KIKI and the bottom edge so they never collide) */}
        <div className="relative z-30 lg:absolute lg:left-6 lg:bottom-7 lg:top-[calc(6%+min(20vw,16rem)*0.8+20px)] xl:top-[calc(6%+min(20vw,22rem)*0.8+24px)] lg:flex lg:flex-col lg:gap-5">
          <div className="mt-8 lg:mt-0 lg:max-w-[20rem] xl:max-w-[22rem]">
            <QuoteBlock reduce={reduce} />
          </div>
          <motion.div {...fade(0.8, 0, 16)} className="mt-8 lg:mt-0 lg:flex-1 lg:min-h-[128px] lg:flex lg:items-end">
            <div className="w-full aspect-video lg:w-auto lg:h-full lg:max-h-[162px] xl:max-h-[187px] lg:aspect-[16/10]">
              <HelloTile />
            </div>
          </motion.div>
        </div>

        {/* Quest card */}
        <div className="relative z-30 mt-6 lg:mt-0 lg:absolute lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:w-[270px] xl:w-[300px]">
          <motion.div {...fade(0.7, 40)}>
            <QuestCard reduce={reduce} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
