import { Link } from "react-router-dom";
const cols = [
  { h: "Adventure", links: [["Missions", "/#missions", 1], ["Academy", "/#academy", 1], ["Rewards", "/#rewards", 1], ["Free course", "/courses/internet-safety", 0]] },
  { h: "Family", links: [["For parents", "/#parents", 1], ["Create account", "/auth?mode=signup", 0], ["Login", "/auth", 0], ["Armour of God book", "/books/armour-of-god", 0]] },
  { h: "Trust", links: [["Privacy policy", "/privacy", 0], ["Terms of service", "/terms", 0]] },
] as const;
export default function FooterSection() {
  return (
    <footer className="relative bg-card text-charcoal border-t border-primary/15 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2.5 min-h-11">
              <img src="/favicon.png" alt="" className="w-10 h-10 rounded-full ring-2 ring-primary/70" />
              <span className="font-display font-bold text-xl uppercase tracking-wider">Kiki<span className="text-primary">Warrior</span></span>
            </Link>
            <p className="mt-4 font-body text-sm text-charcoal/70 max-w-sm leading-relaxed">Building an online safety community for African children and families worldwide.</p>
          </div>
          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2">
              <p className="font-display text-xs uppercase tracking-[0.25em] text-primary">{c.h}</p>
              <ul className="mt-4 space-y-1">
                {c.links.map(([l, href, anchor]) => (
                  <li key={l}>{anchor ? (<a href={href} className="inline-flex items-center min-h-11 min-w-11 py-1.5 font-body text-sm text-charcoal/75 hover:text-charcoal">{l}</a>) : (<Link to={href} className="inline-flex items-center min-h-11 min-w-11 py-1.5 font-body text-sm text-charcoal/75 hover:text-charcoal">{l}</Link>)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div aria-hidden className="mt-12 font-display font-bold uppercase leading-none text-charcoal/[0.06] text-6xl sm:text-8xl lg:text-[10rem] select-none">Warrior</div>
        <p className="mt-4 font-body text-xs text-charcoal/60">© {new Date().getFullYear()} Kiki Warrior. All rights reserved.</p>
      </div>
    </footer>
  );
}
