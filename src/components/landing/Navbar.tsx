import { Link } from "react-router-dom";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, profile } = useAuth();

  return (
    <nav className="sticky top-0 z-50 glass-overlay border-b border-border/40 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ShieldIcon size={28} className="stroke-primary" />
          <span className="font-display font-bold text-lg text-foreground uppercase tracking-wider">
            Kiki Warrior
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {profile?.is_admin && (
                <Link
                  to="/admin"
                  className="font-body text-sm text-primary hover:text-primary/80 transition-colors hidden sm:block"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                to="/family"
                className="btn-copper px-5 py-2 text-xs uppercase tracking-widest font-display"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                to="/courses/internet-safety"
                className="btn-copper px-5 py-2 text-xs uppercase tracking-widest font-display"
              >
                Try Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
