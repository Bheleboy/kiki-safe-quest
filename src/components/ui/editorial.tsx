import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import FooterSection from "@/components/landing/FooterSection";
import { Button } from "@/components/ui/button";

export const MotionButton = motion(Button);

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" />
    <p className="editorial-eyebrow mb-4 flex items-center gap-3 font-display text-[11px] uppercase tracking-[0.3em] text-charcoal/70">
      <span aria-hidden="true" className="h-px w-8 shrink-0 bg-primary" />
      {children}
    </p>
    </>
  );
}

export function PublicPage({ children }: { children: ReactNode }) {
  return <div className="editorial-page min-h-screen bg-cream text-charcoal"><Navbar />{children}<FooterSection /></div>;
}