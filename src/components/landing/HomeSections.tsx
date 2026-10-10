import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BookOpen, CheckCircle2, Clock, Lock, Mail, Star, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseData } from "@/data/courseData";
import { ONLINE_SAFETY_PIECES } from "@/data/armourData";
import { supabase } from "@/integrations/supabase/client";

const container = "max-w-7xl mx-auto px-4 sm:px-6";
const heading = "mt-4 font-display font-bold uppercase text-charcoal text-4xl sm:text-5xl lg:text-6xl leading-[0.95]";
const body = "font-body text-sm text-charcoal/70 leading-relaxed";

function RevealSection({ children, id, className }: { children: ReactNode; id: string; className: string }) {
  const reduce = useReducedMotion();
  return <motion.section id={id} className={className} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.55 }}>{children}</motion.section>;
}
function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return <p className="flex items-center gap-3 font-display text-xs uppercase tracking-[0.3em] text-charcoal/70"><span className="text-primary">{n}</span><span className="w-8 h-px bg-primary shrink-0" />{children}</p>;
}
function PrimaryPill({ to, children, className = "", book = false }: { to: string; children: ReactNode; className?: string; book?: boolean }) {
  return <Button asChild className={`adventure-button group h-auto inline-flex items-center gap-3 min-h-12 rounded-full bg-primary pl-6 pr-2 py-1.5 font-display text-sm uppercase tracking-wider text-charcoal hover:bg-primary/90 ${className}`}><Link to={to}>{book && <BookOpen className="w-4 h-4" />}{children}<span className="w-9 h-9 shrink-0 rounded-full bg-card flex items-center justify-center"><ArrowUpRight className="quest-arrow w-4 h-4" /></span></Link></Button>;
}
function lessonCount(id: string) {
  return courseData.find((stream) => stream.id === id)?.modules.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0;
}
const paths = [
  { id: "6-9", age: "Ages 6-9", title: "Young Warriors", note: "Narration plays automatically, so early readers can follow along.", image: "/images/young-warriors-kids.webp", alt: "Three young warriors ready for their first mission" },
  { id: "10-13", age: "Ages 10-13", title: "Warrior Trainees", note: "Deeper missions on privacy, scams and digital footprint.", image: "/images/kiki-safety-warrior.png", alt: "Kiki ready for an online safety adventure" },
];
export function AgePaths() {
  return <RevealSection id="paths" className="bg-background py-20 lg:py-28"><div className={container}>
    <Eyebrow n="01">Choose your path</Eyebrow><h2 className={`${heading} max-w-3xl`}>Two age paths. One brave warrior.</h2>
    <div className="grid md:grid-cols-2 gap-5 mt-10">
      {paths.map((path) => <Link key={path.id} to="/courses/internet-safety" className="adventure-card group relative overflow-hidden rounded-[2rem] bg-cream bg-tech-grid p-6 sm:p-8 min-h-[22rem] flex flex-col border border-primary/15 text-charcoal">
        <span className="self-start rounded-full bg-primary/15 px-3 py-1 font-display text-[11px] uppercase tracking-widest">{path.age}</span>
        <span aria-hidden className="absolute right-5 top-5 w-12 h-12 rounded-full bg-primary flex items-center justify-center"><ArrowUpRight className="quest-arrow w-5 h-5" /></span>
        <h3 className="relative z-10 font-display font-bold uppercase text-3xl leading-tight max-w-[60%] mt-5">{path.title}</h3>
        <p className={`${body} relative z-10 max-w-[55%] mt-3`}>{path.note}</p>
        <ul className="relative z-10 max-w-[55%] mt-5 space-y-2">
          {courseData.find((stream) => stream.id === path.id)?.modules.map((module) => <li key={module.id} className="flex gap-2 font-body text-xs text-charcoal/75 leading-relaxed"><CheckCircle2 aria-hidden className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>{module.title.replace(/[\u2013\u2014]/g, "-")}</span></li>)}
        </ul>
        <div className="relative z-10 mt-auto pt-6 max-w-[55%]"><span className="block font-display text-4xl font-bold">{lessonCount(path.id)}</span><span className="font-body text-xs text-charcoal/60">video quests</span></div>
        <img src={path.image} alt={path.alt} loading="lazy" className="absolute right-0 bottom-0 h-[85%] max-w-[42%] xl:max-w-[48%] max-[399px]:opacity-90 object-contain object-bottom motion-safe:transition-transform motion-safe:group-hover:-translate-y-1" />
      </Link>)}
    </div>
  </div></RevealSection>;
}
export function Missions() {
  const modules = courseData.flatMap((stream) => stream.modules.map((module) => ({ ...module, age: `Ages ${stream.id}` })));
  return <RevealSection id="missions" className="relative bg-peach bg-tech-grid py-20 lg:py-28 overflow-hidden">
    <div aria-hidden className="absolute -right-4 top-6 font-display font-bold uppercase text-[22vw] text-charcoal/[0.03] pointer-events-none select-none">Free</div>
    <div className={`${container} relative`}><div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
      <div className="lg:col-span-7"><Eyebrow n="02">Free online safety missions</Eyebrow><h2 className={heading}>Clear each mission. <span className="text-primary">Unlock the next.</span></h2></div>
      <p className={`${body} lg:col-span-5`}>Every mission is a set of short video lessons, each followed by a quiz. Score 70% or more to move on. Missed questions are reviewed so your child can try again.</p>
    </div><ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
      {modules.map((module, i) => <li key={module.id} className="rounded-2xl border border-primary/20 bg-card p-5 flex flex-col min-h-[9.5rem]">
        <div className="flex items-center justify-between gap-2"><span className="font-display text-xs uppercase tracking-widest text-primary">Mission {String(i + 1).padStart(2, "0")}</span><span className="font-body text-[10px] text-charcoal/60">{module.age}</span></div>
        <h3 className="font-display text-lg uppercase leading-tight text-charcoal mt-4 mb-4">{module.title.replace(/[\u2013\u2014]/g, "-")}</h3><p className="mt-auto font-body text-xs text-charcoal/60">{module.lessons.length} video lessons + quizzes</p>
      </li>)}
    </ol><PrimaryPill to="/courses/internet-safety" className="mt-10">View the free course</PrimaryPill></div>
  </RevealSection>;
}
export function Academy() {
  return <RevealSection id="academy" className="bg-cream py-20 lg:py-28"><div className={`${container} grid lg:grid-cols-2 gap-6`}>
    <article className="rounded-[2rem] bg-background p-6 sm:p-10 border border-primary/15 min-w-0">
      <Eyebrow n="03">Christian academy</Eyebrow><h2 className="mt-4 font-display font-bold uppercase text-charcoal text-4xl sm:text-5xl leading-[0.95]">Warrior Academy</h2>
      <p className={`${body} mt-5`}>A journey through biblical stories, character building and practical faith, designed for children ages 5-12, with weekly lessons and devotions.</p>
      <img src="/images/kiki-safety-course.png" alt="Kiki and a young learner exploring together" loading="lazy" className="w-full rounded-2xl aspect-[3/2] object-cover mt-6" />
      <span className="inline-flex items-center gap-2 mt-6 rounded-full bg-charcoal/[0.06] px-4 py-2 font-display text-xs uppercase tracking-widest text-charcoal/70"><Clock className="w-4 h-4" />Coming soon</span>
    </article>
    <article className="rounded-[2rem] bg-peach p-6 sm:p-10 flex flex-col sm:flex-row lg:flex-col gap-6 min-w-0">
      <div className="min-w-0"><p className="font-display text-xs uppercase tracking-[0.3em] text-primary">The companion book</p><h3 className="font-display font-bold uppercase text-3xl sm:text-4xl leading-[0.95] text-charcoal mt-4">Kiki's Armour of God</h3><p className={`${body} mt-5`}>A Christian-themed workbook teaching the armour of God through activities, Bible verses and prayers. Available on Amazon, Kobo and Barnes &amp; Noble.</p><PrimaryPill to="/books/armour-of-god" book className="mt-6">See the book</PrimaryPill></div>
      <img src="/images/kiki-armour-of-god.png" alt="Kiki's Armour of God workbook cover" loading="lazy" className="w-40 sm:w-48 self-center -rotate-3 rounded-lg shadow-2xl shrink-0 mt-auto" />
    </article>
  </div></RevealSection>;
}
export function Rewards() {
  return <RevealSection id="rewards" className="bg-background py-20 lg:py-28"><div className={`${container} grid lg:grid-cols-12 gap-10 items-center`}>
    <div className="lg:col-span-5"><Eyebrow n="04">Rewards</Eyebrow><h2 className={heading}>Collect the full Armour of God.</h2><p className={`${body} mt-6`}>Completing missions unlocks armour pieces, and your child's avatar changes as it fills up. Finishing the course unlocks a printable certificate of completion.</p><div className="mt-6 flex items-center gap-3 rounded-2xl bg-cream p-4"><Trophy className="w-6 h-6 text-primary shrink-0" /><p className="font-body text-sm text-charcoal">6 armour pieces, 1 completion certificate per course</p></div></div>
    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ONLINE_SAFETY_PIECES.map((piece) => <div key={piece.id} className="group rounded-2xl bg-cream bg-tech-grid border border-primary/15 p-4 text-center flex flex-col items-center"><img src={`/images/armour/${piece.id}.webp`} alt={piece.name} loading="lazy" width={112} height={112} className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_12px_rgba(60,35,15,0.18)] motion-safe:transition-transform motion-safe:duration-300 group-hover:-translate-y-1 group-hover:scale-105" /><h3 className="font-display text-sm uppercase text-charcoal mt-4 min-h-10 flex items-center justify-center">{piece.name}</h3><p className="text-[11px] font-body text-charcoal/60 mt-1">{piece.verse}</p></div>)}
    </div>
  </div></RevealSection>;
}
const parentFeatures = [
  { icon: Users, title: "Parent-managed profiles", description: "You create the account and add a profile for each child. Children never sign up alone." },
  { icon: Lock, title: "Private by design", description: "Child data stays inside your family account. Built with POPIA and GDPR in mind, with age verification and consent." },
  { icon: Trophy, title: "See their progress", description: "Your dashboard shows completed lessons, quiz scores, armour earned and time spent." },
  { icon: Mail, title: "Parent tips in every lesson", description: "Each lesson has a parent tip to help you continue the conversation at home." },
];
type PublicReview = { id: string; display_name: string | null; overall_rating: number | null; feedback: string | null; created_at: string };
let reviewsPromise: Promise<PublicReview[]> | null = null;
function loadReviews() {
  reviewsPromise ??= Promise.resolve(supabase.rpc("get_public_parent_reviews")).then(({ data, error }) => (error || !data ? [] : (data as PublicReview[])), () => []);
  return reviewsPromise;
}
function usePublicReviews() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  useEffect(() => { let alive = true; loadReviews().then((r) => { if (alive) setReviews(r); }); return () => { alive = false; }; }, []);
  return reviews;
}
export function ParentReviews() {
  const reviews = usePublicReviews();
  if (reviews.length === 0) return null;
  return <RevealSection id="reviews" className="bg-background py-20 lg:py-28"><div className={container}>
    <Eyebrow n="05">What parents say</Eyebrow><h2 className={`${heading} max-w-3xl`}>Real families. Real missions.</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">{reviews.map((review) => {
      const rating = Math.max(0, Math.min(5, review.overall_rating ?? 0));
      return <article key={review.id} className="rounded-2xl bg-cream bg-tech-grid border border-primary/15 p-6 flex flex-col">
        {rating > 0 && <div className="flex gap-1" role="img" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} aria-hidden className={`w-4 h-4 ${n <= rating ? "text-primary fill-primary" : "text-charcoal/20"}`} />)}</div>}
        <blockquote className={`${body} mt-4 flex-1`}>"{review.feedback?.replace(/[\u2013\u2014]/g, "-")}"</blockquote>
        <p className="font-display text-xs uppercase tracking-widest text-charcoal mt-5">{review.display_name || "Kiki Warrior parent"}</p>
      </article>;
    })}</div>
    <Button asChild variant="outline" className="mt-8 h-auto rounded-full border-2 border-primary/35 px-6 min-h-12 font-display uppercase text-charcoal bg-transparent hover:bg-primary/10"><a href="https://www.trustpilot.com/review/kikiwarrior.com" target="_blank" rel="noopener noreferrer">Read more on Trustpilot</a></Button>
  </div></RevealSection>;
}
export function Parents() {
  const hasReviews = usePublicReviews().length > 0;
  return <RevealSection id="parents" className="bg-cream py-20 lg:py-28"><div className={container}>
    <Eyebrow n={hasReviews ? "06" : "05"}>For parents</Eyebrow><h2 className={`${heading} max-w-3xl`}>You stay in control of the adventure.</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">{parentFeatures.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl bg-background p-6 border border-primary/15"><span className="w-11 h-11 rounded-full bg-trust/10 flex items-center justify-center"><Icon aria-hidden className="w-5 h-5 text-trust" /></span><h3 className="font-display uppercase tracking-wide text-charcoal mt-5">{title}</h3><p className={`${body} mt-3`}>{description}</p></article>)}</div>
    <div className="mt-8 rounded-[2rem] bg-peach p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6"><p className="font-display uppercase text-2xl sm:text-3xl text-charcoal leading-tight md:max-w-md">Create your free family account and start the first mission together.</p><div className="flex flex-wrap items-center gap-3 shrink-0"><PrimaryPill to="/auth?mode=signup">Create account</PrimaryPill><Button asChild variant="outline" className="h-auto rounded-full border-2 border-primary/35 px-6 min-h-12 font-display uppercase text-charcoal bg-transparent hover:bg-primary/10"><Link to="/auth">Login</Link></Button></div></div>
  </div></RevealSection>;
}
