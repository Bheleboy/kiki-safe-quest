import { Link } from "react-router-dom";
import { ShieldIcon } from "@/components/course/CourseIcons";

export default function FooterSection() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldIcon size={20} className="stroke-primary" />
              <span className="font-display text-sm text-foreground uppercase tracking-wider font-bold">
                Kiki Warrior
              </span>
            </div>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              Building an online safety community for African children and families worldwide.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-display text-xs uppercase tracking-wider text-foreground font-semibold">
              Platform
            </h4>
            <div className="space-y-2">
              <Link to="/courses/internet-safety" className="block font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                Online Safety Course
              </Link>
              <Link to="/auth?mode=signup" className="block font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                Create Account
              </Link>
              <Link to="/auth" className="block font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link to="/privacy" className="block font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-display text-xs uppercase tracking-wider text-foreground font-semibold">
              Trust & Safety
            </h4>
            <div className="space-y-2">
              <p className="font-body text-xs text-muted-foreground">POPIA & GDPR Compliant</p>
              <p className="font-body text-xs text-muted-foreground">Parent-controlled access</p>
              <p className="font-body text-xs text-muted-foreground">No ads in child learning area</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-muted-foreground">
            © 2026 Kiki Warrior. All rights reserved.
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Safe learning for every child.
          </p>
        </div>
      </div>
    </footer>
  );
}
