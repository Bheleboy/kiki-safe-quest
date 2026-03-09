import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <motion.div
        className="absolute inset-0 scale-125 md:scale-110 origin-center"
        animate={{ 
          scale: [1.25, 1.35, 1.25],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src="/images/kiki-warrior-3d.png"
          alt=""
          className="w-full h-full object-cover object-[center_20%]"
          loading="eager"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/20" />

      {/* Glowing shield orb */}
      <motion.div
        className="absolute top-1/3 right-[20%] w-40 h-40 md:w-64 md:h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(25 85% 55% / 0.12) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[28%] right-[22%] w-20 h-20 md:w-32 md:h-32 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(40 70% 52% / 0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1.1, 0.9, 1.1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

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
            Learn to be safe, smart and strong online. Earn pieces of the Armour of God
            through fun, interactive courses designed for children ages 6–13.
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
              className="touch-target inline-flex items-center gap-2 bg-foreground text-primary-foreground rounded-xl px-8 py-4 text-sm font-display uppercase tracking-widest hover:bg-foreground/90 transition-colors"
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
