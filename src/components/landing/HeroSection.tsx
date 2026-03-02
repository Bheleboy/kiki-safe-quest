import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/kiki-warrior-3d.png"
          alt=""
          className="w-full h-full object-cover object-top scale-110"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 w-full">
        <div className="max-w-xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block font-display text-xs uppercase tracking-[0.3em] text-primary mb-4">
              Online Learning & Safety
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1]">
              Welcome To{" "}
              <span className="text-primary">Kiki Warrior</span>
              <br />
              Online Academy
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-body text-lg text-muted-foreground max-w-md leading-relaxed"
          >
            Learn to be safe, smart and strong online. Fun, interactive courses
            designed for children ages 6–13.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <Link
              to="/courses/internet-safety"
              className="touch-target inline-flex items-center gap-2 btn-copper px-8 py-4 text-sm uppercase tracking-widest"
            >
              Try the Course Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/auth?mode=signup"
              className="touch-target inline-flex items-center gap-2 border border-border rounded-xl px-8 py-4 text-sm font-display uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
            >
              Create Parent Account
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </motion.div>
    </section>
  );
}
