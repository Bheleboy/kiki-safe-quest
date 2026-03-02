import { motion } from "framer-motion";
import { UserPlus, Users, PlayCircle, Award } from "lucide-react";

const steps = [
  { icon: <UserPlus className="w-7 h-7" />, title: "Create Parent Account", desc: "Sign up free with email verification." },
  { icon: <Users className="w-7 h-7" />, title: "Add Your Child", desc: "Create child profiles with name and age band." },
  { icon: <PlayCircle className="w-7 h-7" />, title: "Start Lessons", desc: "Interactive video lessons with quizzes and badges." },
  { icon: <Award className="w-7 h-7" />, title: "Earn Certificate", desc: "Complete the course and download your certificate." },
];

export default function HowItWorks() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-14">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
            How It Works
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-4"
            >
              <div className="relative inline-flex">
                <div className="w-16 h-16 rounded-full gradient-copper flex items-center justify-center text-primary-foreground">
                  {s.icon}
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground font-display text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide">
                {s.title}
              </h3>
              <p className="font-body text-xs text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
