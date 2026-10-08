import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { label: "Missions", href: "/#missions" },
  { label: "Academy", href: "/#academy" },
  { label: "Rewards", href: "/#rewards" },
  { label: "For Parents", href: "/#parents" },
];

export default function Navbar() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : previous;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);
  const primary = user ? { to: "/family", label: "My Dashboard" } : { to: "/courses/internet-safety", label: "Start Your Adventure" };
  return (
    <>
      <header className={`sticky top-0 z-50 transition-colors ${scrolled || open ? "bg-cream/95 backdrop-blur-md border-b border-charcoal/10" : "bg-cream"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 lg:h-[72px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 min-h-11" aria-label="Kiki Warrior home">
            <img src="/favicon.png" alt="" className="w-9 h-9 rounded-full ring-2 ring-primary/70 bg-card object-cover" />
            <span className="font-display font-bold text-lg uppercase tracking-wider text-charcoal leading-none">Kiki<span className="text-primary">Warrior</span></span>
          </Link>
          <nav aria-label="Main" className="hidden lg:flex items-center gap-1 rounded-full bg-charcoal/[0.04] border border-charcoal/10 p-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-4 py-2 min-h-11 inline-flex items-center font-display text-[13px] uppercase tracking-[0.14em] text-charcoal/75 hover:text-charcoal hover:bg-background transition-colors">{n.label}</a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            {profile?.is_admin && (<Link to="/admin" className="px-3 py-2 min-h-11 inline-flex items-center font-display text-[13px] uppercase tracking-[0.14em] text-primary">Admin</Link>)}
            {!user && (<Link to="/auth" className="px-4 py-2 min-h-11 inline-flex items-center font-display text-[13px] uppercase tracking-[0.14em] text-charcoal/80 hover:text-charcoal">Login</Link>)}
            <Button asChild className="adventure-button group h-auto min-h-11 inline-flex items-center gap-2 rounded-full bg-primary/15 text-charcoal pl-5 pr-1.5 py-1.5 font-display text-[13px] uppercase tracking-[0.14em] hover:bg-primary/25">
              <Link to={primary.to}>{primary.label}<span className="w-8 h-8 rounded-full bg-primary text-charcoal flex items-center justify-center transition-transform group-hover:translate-x-0.5"><ArrowRight className="w-4 h-4" /></span></Link>
            </Button>
          </div>
          <Button variant="ghost" type="button" className="lg:hidden w-11 h-11 rounded-full bg-primary/15 text-charcoal flex items-center justify-center" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>
      {open && (
        <div id="mobile-menu" className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-cream bg-tech-grid overflow-y-auto">
          <nav aria-label="Mobile" className="px-4 py-6 flex flex-col gap-2">
            {NAV.map((n, i) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-2xl bg-background border border-charcoal/10 px-5 py-4 font-display text-xl uppercase tracking-wider text-charcoal">
                <span><span className="text-primary text-sm mr-3">0{i + 1}</span>{n.label}</span><ArrowRight className="w-5 h-5 text-primary" />
              </a>
            ))}
            <div className="grid gap-2 mt-4">
              {!user && (<Link to="/auth" onClick={() => setOpen(false)} className="text-center rounded-full border-2 border-primary/30 px-5 py-3.5 font-display uppercase tracking-widest text-charcoal">Login</Link>)}
              {profile?.is_admin && (<Link to="/admin" onClick={() => setOpen(false)} className="text-center rounded-full border-2 border-primary/30 px-5 py-3.5 font-display uppercase tracking-widest text-primary">Admin</Link>)}
              <Link to={primary.to} onClick={() => setOpen(false)} className="text-center rounded-full bg-primary px-5 py-3.5 font-display uppercase tracking-widest text-charcoal">{primary.label}</Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
