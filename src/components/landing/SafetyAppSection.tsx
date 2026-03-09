import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, BarChart3, Award, Users } from "lucide-react";

const features = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Parent Dashboard",
    desc: "Monitor your child's learning journey, quiz scores, and time spent on each module.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Kids Learning Area",
    desc: "Child-friendly interface with video lessons, narration support, and interactive quizzes.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Progress Tracking",
    desc: "Real-time progress bars, star ratings, and module completion tracking per child.",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Armour of God Rewards",
    desc: "Children earn pieces of the Armour of God as they pass quizzes — collect all 6 across both courses.",
  },
];

export default function SafetyAppSection() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-14">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Platform Features
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
            Everything a Parent Needs
          </h2>
          <p className="font-body text-muted-foreground max-w-lg mx-auto">
            A safe, ad-free learning environment with full parental control.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-kiki text-center space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
                {f.title}
              </h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/auth?mode=signup"
            className="touch-target inline-flex items-center gap-2 btn-copper px-10 py-4 text-sm uppercase tracking-widest"
          >
            Create Free Parent Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
