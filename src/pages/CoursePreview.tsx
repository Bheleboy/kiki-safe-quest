import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Award, CheckCircle } from "lucide-react";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { courseData } from "@/data/courseData";

export default function CoursePreview() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Only the internet-safety course is available
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

  // Combine both age streams for a preview
  const youngStream = courseData.find((s) => s.id === "6-9");
  const teenStream = courseData.find((s) => s.id === "10-13");
  const totalModules = (youngStream?.modules.length || 0) + (teenStream?.modules.length || 0);
  const totalLessons = courseData.reduce(
    (sum, s) => sum + s.modules.reduce((ms, m) => ms + m.lessons.length, 0),
    0
  );

  const highlights = [
    "Age-appropriate content for 6–9 and 10–13 year olds",
    "Interactive quizzes with 70% pass requirement",
    "Earn stars and badges for achievements",
    "Parent dashboard to track progress",
    "Downloadable completion certificates",
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
            Sign Up Free
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8 items-start"
        >
          <div className="w-20 h-20 rounded-2xl gradient-copper flex items-center justify-center shrink-0">
            <ShieldIcon size={40} className="stroke-primary-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary font-display text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                Featured Course
              </span>
              <span className="bg-success/10 text-success font-display text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                Free
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
              Internet Safety for Kids
            </h1>
            <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-2xl">
              A comprehensive, fun-filled course teaching children aged 6–13 how to stay safe, smart, and strong online. 
              Through animated lessons, interactive quizzes, and rewarding badges, young warriors learn essential digital safety skills.
            </p>
            <div className="flex flex-wrap gap-6 text-sm font-body text-muted-foreground">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> ~2 hours</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-accent" /> Certificate</span>
            </div>
          </div>
        </motion.div>

        {/* What You'll Learn */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-kiki space-y-4"
        >
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
            What's Included
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {highlights.map((h) => (
              <div key={h} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="font-body text-sm text-foreground">{h}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Module Preview */}
        {[youngStream, teenStream].filter(Boolean).map((stream) => (
          <motion.div
            key={stream!.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">
              {stream!.label} — {stream!.description}
            </h2>
            <div className="grid gap-3">
              {stream!.modules.map((mod, i) => (
                <div key={mod.id} className="card-kiki flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg gradient-earth flex items-center justify-center shrink-0">
                    <span className="text-lg">{mod.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide truncate">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body">
                      {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center space-y-4 py-8"
        >
          <h2 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">
            Ready to Start?
          </h2>
          <p className="font-body text-muted-foreground">
            Create a free parent account and enrol your children today.
          </p>
          <Link
            to="/auth?mode=signup"
            className="touch-target inline-flex items-center gap-2 btn-copper px-10 py-4 text-sm uppercase tracking-widest"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
