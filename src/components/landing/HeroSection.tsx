import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Play, PlayCircle, ShieldCheck, Star, Target } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const MANIFESTO = [
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

const tri = "polygon(50% 0%, 100% 100%, 0% 100%)";

function Triangle({ className }: { className: string }) {
  return <div aria-hidden className={`absolute bg-primary ${className}`} style={{ clipPath: tri }} />;
}

function Warrior({ reduce }: { reduce: boolean }) {
  return (
    <div
      aria-hidden
      className="font-display font-bold uppercase text-primary leading-[0.82] tracking-[-0.02em] text-[22vw] lg:text-[clamp(5.5rem,14vw,15rem)] flex select-none"
    >
      {"WARRIOR".split("").map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.04em]">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: EASE }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

function Kiki({ reduce }: { reduce: boolean }) {
  const [safari, setSafari] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    setSafari(/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent));
  }, []);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onEnded = () => {
      t = setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
      }, 2500);
    };
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("ended", onEnded);
      if (t) clearTimeout(t);
    };
  }, [safari, reduce]);

  const useImg = safari || reduce;
  return (
    <div className="relative w-full h-full">
      <div aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-8 rounded-[50%] bg-black/10 blur-2xl" />
      {useImg ? (
        <motion.img
          src="/images/kiki-warrior-3d.png"
          alt="Kiki, the young warrior, holding a shield"
          className="relative w-full h-full object-contain object-bottom"
          animate={safari && !reduce ? { y: [0, -6, 0] } : undefined}
          transition={safari && !reduce ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      ) : (
        <video
          ref={ref}
          src="/hero/kiki-idle.webm"
          poster="/images/kiki-warrior-3d.png"
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-label="Kiki, the young warrior, smiling"
          className="relative w-full h-full object-contain object-bottom"
        />
      )}
    </div>
  );
}

function HearKiki() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative mt-8 w-full lg:w-[260px] aspect-video lg:aspect-[16/10] rounded-3xl overflow-hidden shadow-lg bg-black/10">
      {playing ? (
        <video
          src="/hero/kiki-hello.mp4"
          autoPlay
          playsInline
          onEnded={() => setPlaying(false)}
          aria-label="Kiki says: Hi, I'm Kiki! Today we're learning about the internet, a big playground."
          className="w-full h-full object-cover object-[center_20%]"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label="Play Kiki's hello message with sound" className="group absolute inset-0 w-full h-full">
          <img src="/hero/kiki-hello-poster.jpg" alt="" className="w-full h-full object-cover object-[center_20%]" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute left-4 bottom-3 font-display text-xs uppercase tracking-widest text-white">Hear Kiki say hello</span>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
            <Play className="w-5 h-5 text-primary fill-primary ml-0.5" />
          </span>
        </button>
      )}
    </div>
  );
}

function CountUp({ value, reduce }: { value: number; reduce: boolean }) {
  const [n, setN] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (reduce) { setN(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.6, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    prev.current = value;
    return () => c.stop();
  }, [value, reduce]);
  return <>{n}</>;
}

function QuestCard({ reduce }: { reduce: boolean }) {
  const [stream, setStream] = useState<Stream>("6-9");
  const s = STREAMS[stream];
  return (
    <motion.div
      initial={reduce ? false : { x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
      className="rounded-[2rem] bg-white/85 backdrop-blur-md border border-black/5 shadow-[0_30px_80px_-20px_rgba(60,40,20,0.25)] p-5 flex gap-4"
    >
      <div aria-hidden className="flex flex-col gap-5 pt-1">
        <Star className="w-4 h-4 text-foreground/40" />
        <Target className="w-4 h-4 text-foreground/40" />
        <ShieldCheck className="w-4 h-4 text-foreground/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-xs tracking-[0.3em] text-foreground/50">THE QUEST</p>
        <div className="flex gap-2 mt-3">
          {(Object.keys(STREAMS) as Stream[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={stream === k}
              onClick={() => setStream(k)}
              className={`rounded-full px-3 py-1.5 font-display text-[11px] uppercase tracking-wider transition-colors ${
                stream === k ? "bg-primary text-white" : "bg-black/5 text-foreground/70 hover:bg-black/10"
              }`}
            >
              {STREAMS[k].label}
            </button>
          ))}
        </div>
        <div className="relative mt-3 min-h-[3.75rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={stream}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="font-body text-sm text-foreground/70"
            >
              {s.copy}
            </motion.p>
          </AnimatePresence>
        </div>
        <img
          src="/images/kiki-armour-of-god.png"
          alt="Kiki and the Armour of God book cover"
          className="h-36 object-contain mx-auto my-4 -rotate-[4deg] drop-shadow-xl"
        />
        <div className="flex items-end justify-between">
          <div>
            <p className="font-body text-xs text-foreground/50">Video lessons</p>
            <p className="font-display text-5xl font-bold text-foreground leading-none mt-1">
              <CountUp value={s.count} reduce={reduce} />
            </p>
          </div>
          <Link
            to="/courses/internet-safety"
            aria-label="Explore the internet safety course"
            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center transition-transform hover:scale-105"
          >
            <ArrowUpRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const reduce = !!useReducedMotion();

  const pill = (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-black/5 px-3 py-1 font-display text-[11px] uppercase tracking-widest text-foreground/70">
      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      Pre-launch - join the first families
    </span>
  );

  const copy = (
    <>
      <h1 className="font-display text-sm uppercase tracking-[0.3em] text-foreground/50 mt-4">Kiki Warrior Online Academy</h1>
      <div className="mt-4">
        <span aria-hidden className="block font-display text-5xl leading-none text-primary/60 h-8">&ldquo;</span>
        {MANIFESTO.map((l) => (
          <p key={l} className="font-body text-[17px] leading-relaxed text-foreground/80">{l}</p>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-6">
        <Link to="/courses/internet-safety" className="btn-copper inline-flex items-center gap-2 px-7 py-3.5 text-sm uppercase tracking-widest">
          <PlayCircle className="w-5 h-5" /> Start your quest
        </Link>
        <Link
          to="/auth?mode=signup"
          className="inline-flex items-center rounded-xl px-7 py-3.5 text-sm font-display uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          Join the pre-launch
        </Link>
      </div>
      <HearKiki />
    </>
  );

  const kikiMotion = {
    initial: reduce ? false : { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: "spring" as const, stiffness: 90, damping: 18, delay: 0.25 },
  };

  return (
    <section className="relative overflow-hidden bg-[#F4EEE6] pt-24 lg:pt-20">
      {/* Ghost word */}
      <motion.div
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute bottom-[-2%] right-4 z-0 font-display font-bold uppercase leading-[0.82] tracking-[-0.02em] text-[22vw] lg:text-[clamp(5.5rem,16vw,16rem)] text-[hsl(30_20%_20%/0.06)] select-none pointer-events-none"
      >
        ONLINE
      </motion.div>

      {/* Mobile / tablet */}
      <div className="lg:hidden relative max-w-7xl mx-auto px-4 pb-16">
        <Triangle className="w-4 h-4 opacity-30 right-6 top-2" />
        {pill}
        <div className="relative z-10 mt-4"><Warrior reduce={reduce} /></div>
        <motion.div {...kikiMotion} className="relative z-20 mx-auto h-[62vh] aspect-[2/3] max-w-full -mt-[6vw]">
          <Kiki reduce={reduce} />
        </motion.div>
        <div className="relative z-30 mt-6">{copy}</div>
        <div className="relative z-30 mt-10"><QuestCard reduce={reduce} /></div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block relative max-w-7xl mx-auto px-4 h-[92vh] min-h-[880px] xl:min-h-[780px]">
        <div className="absolute top-[4%] left-4 z-10"><Warrior reduce={reduce} /></div>
        <Triangle className="w-5 h-5 opacity-40 top-[6%] left-[58%]" />
        <Triangle className="w-[14px] h-[14px] opacity-25 top-[52%] left-1" />
        <Triangle className="w-[22px] h-[22px] opacity-30 top-[8%] right-[340px]" />

        <div className="absolute bottom-0 z-20 aspect-[2/3] left-1/2 -translate-x-1/2 h-[min(64vh,560px)] xl:h-[min(72vh,640px)]">
          <motion.div {...kikiMotion} className="w-full h-full">
            <Kiki reduce={reduce} />
          </motion.div>
        </div>

        <div className="absolute left-4 bottom-[6%] z-30 max-w-[20rem] xl:max-w-[24rem]">
          {pill}
          {copy}
        </div>

        <div className="absolute right-4 top-[12%] z-30 w-[300px]">
          <QuestCard reduce={reduce} />
        </div>
      </div>
    </section>
  );
}
