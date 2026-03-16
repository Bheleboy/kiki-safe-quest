import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Shield, CheckCircle, ShieldCheck, PlayCircle, Hourglass } from "lucide-react";
import { ShieldIcon, CourseIcon } from "@/components/course/CourseIcons";
import { VideoPlayer } from "@/components/course/VideoPlayer";
import { ArmourPieceIcon } from "@/components/armour/ArmourPieceIcon";
import { KikiWarriorAvatar } from "@/components/armour/KikiWarriorAvatar";
import { ONLINE_SAFETY_PIECES, CHRISTIAN_ACADEMY_PIECES } from "@/data/armourData";
import { courseData } from "@/data/courseData";

export default function CoursePreview() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  if (courseId !== "internet-safety") {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground uppercase">Course Not Found</h1>
          <Link to="/" className="btn-copper inline-flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest">
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  const youngStream = courseData.find((s) => s.id === "6-9");
  const teenStream = courseData.find((s) => s.id === "10-13");
  
  // Calculate time totals
  const totalLessons = courseData.reduce(
    (sum, s) => sum + s.modules.reduce((ms, m) => ms + m.lessons.length, 0),
    0
  );
  const totalVideoMinutes = courseData.reduce(
    (sum, s) => sum + s.modules.reduce((ms, m) => ms + m.lessons.reduce((ls, l) => ls + l.videoDurationMinutes, 0), 0),
    0
  );
  const totalEstimatedMinutes = courseData.reduce(
    (sum, s) => sum + s.modules.reduce((ms, m) => ms + m.lessons.reduce((ls, l) => ls + l.estimatedMinutes, 0), 0),
    0
  );
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  const highlights = [
    "Age-appropriate content for 6–9 and 10–13 year olds",
    "Interactive quizzes with 70% pass requirement",
    "Your child earns 3 pieces of the Armour of God as rewards",
    "Parent dashboard to track progress",
    "Collect all 6 pieces across both courses",
    "Video lessons with narration support",
  ];

  return (
    <div className="min-h-screen gradient-dark">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-overlay border-b border-border/40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-body text-sm">Back</span>
          </button>
          <Link to="/auth?mode=signup" className="btn-copper px-5 py-2 text-xs uppercase tracking-widest font-display">
            Start Free Course
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-20 h-20 rounded-2xl gradient-copper flex items-center justify-center shrink-0">
            <ShieldIcon size={40} className="stroke-primary-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary font-display text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Featured Course</span>
              <span className="bg-success/10 text-success font-display text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Free</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
              Internet Safety for Kids
            </h1>
            <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-2xl">
              A comprehensive, fun-filled course teaching children aged 6–13 how to stay safe, smart, and strong online.
              Through animated lessons, interactive quizzes, and the Armour of God reward system, young warriors earn heroic armour pieces as they learn essential digital safety skills.
            </p>
            <div className="flex flex-wrap gap-6 text-sm font-body text-muted-foreground">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-secondary" /> {formatTime(totalVideoMinutes)} video</span>
              <span className="flex items-center gap-1.5"><Hourglass className="w-4 h-4 text-accent" /> {formatTime(totalEstimatedMinutes)} total</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-coral" /> 3 Armour Pieces</span>
            </div>
          </div>
        </motion.div>

        {/* Armour Reward Highlight */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-kiki border-primary/30 bg-gradient-to-b from-primary/5 to-card space-y-5">
          <div className="text-center space-y-2">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">Reward System</span>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground uppercase tracking-wide">
              Earn the Armour of God
            </h2>
            <p className="font-body text-sm text-muted-foreground max-w-lg mx-auto">
              As your child completes lessons and passes quizzes, they earn pieces of the Armour of God — a set of six collectible rewards inspired by Ephesians 6. This free course awards the first 3 pieces!
            </p>
          </div>

          {/* Kiki Warrior preview */}
          <div className="flex flex-col items-center">
            <KikiWarriorAvatar earnedPieces={[]} size="lg" showLabel={false} />
            <p className="font-body text-xs text-muted-foreground mt-2 italic">Your warrior starts here — earn armour as you learn!</p>
          </div>

          {/* Free course pieces */}
          <div>
            <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-3">This Course Awards</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {ONLINE_SAFETY_PIECES.map((piece) => (
                <div key={piece.id} className="text-center space-y-2">
                  <div className="mx-auto">
                    <ArmourPieceIcon pieceId={piece.id} earned size={44} />
                  </div>
                  <p className="font-display text-[10px] uppercase tracking-wide text-foreground font-semibold">{piece.name}</p>
                  <p className="font-body text-[9px] text-muted-foreground italic">{piece.verse}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining pieces teaser */}
          <div className="border-t border-border/40 pt-4">
            <p className="font-display text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-3">Complete the Set in Kiki Christian Academy</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto opacity-50">
              {CHRISTIAN_ACADEMY_PIECES.map((piece) => (
                <div key={piece.id} className="text-center space-y-2">
                  <div className="mx-auto">
                    <ArmourPieceIcon pieceId={piece.id} earned={false} size={36} />
                  </div>
                  <p className="font-display text-[10px] uppercase tracking-wide text-muted-foreground/60 font-semibold">{piece.name}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Video Placeholder */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-kiki space-y-3">
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide mb-1">Why We Use the Internet</h2>
          <VideoPlayer
            videoUrl="https://www.youtube.com/embed/xCEpBjb7_bE"
            fallbackUrl="https://www.youtube.com/watch?v=xCEpBjb7_bE"
            title="Making the Internet Safe for Children – UNICEF"
            videoCredit="UNICEF · Making the Internet Safe for Children"
          />
        </motion.div>

        {/* What's Included */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-kiki space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {highlights.map((h) => (
              <div key={h} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="font-body text-sm text-foreground">{h}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pass Requirement */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-kiki flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide mb-1">70% Pass Requirement</h3>
            <p className="font-body text-sm text-muted-foreground">Your child must achieve a minimum score of 70% on each quiz to unlock the next lesson and progress toward earning their armour pieces.</p>
          </div>
        </motion.div>

        {/* Module Preview */}
        {[youngStream, teenStream].filter(Boolean).map((stream) => (
          <motion.div key={stream!.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
              {stream!.label} — {stream!.description}
            </h2>
            <div className="grid gap-3">
              {stream!.modules.map((mod) => (
                <div key={mod.id} className="card-kiki flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <CourseIcon name={mod.icon || "shield"} size={20} className="stroke-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide truncate">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground font-body">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Armour Reward CTA (replaces certificate preview) */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-kiki text-center space-y-4 border-primary/20">
          <div className="flex justify-center gap-3">
            {ONLINE_SAFETY_PIECES.map((piece) => (
              <ArmourPieceIcon key={piece.id} pieceId={piece.id} earned size={36} />
            ))}
          </div>
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">Earn Your Armour</h2>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
            Complete each module and pass the quizzes to earn the Belt of Truth, Shield of Faith, and Helmet of Salvation. Then continue to Kiki Christian Academy to collect the full Armour of God!
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center space-y-4 py-8">
          <h2 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">Ready to Start?</h2>
          <p className="font-body text-muted-foreground">Create a free parent account and begin your child's Armour of God journey today.</p>
          <Link to="/auth?mode=signup" className="touch-target inline-flex items-center gap-2 btn-copper px-10 py-4 text-sm uppercase tracking-widest">
            Start Free Course <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
