import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { Plus, Trash2, ArrowRight, LogOut, Users, BookOpen, ExternalLink } from "lucide-react";
import { ChildArmourAvatar } from "@/components/armour/ChildArmourAvatar";
import { courseData } from "@/data/courseData";
import type { Tables } from "@/integrations/supabase/types";

type Child = Pick<Tables<"children">, "id" | "first_name" | "age_band" | "avatar_color">;
type BookPurchase = Tables<"book_purchases">;

const AVATAR_COLORS = [
  "hsl(25 70% 50%)",
  "hsl(40 55% 42%)",
  "hsl(15 40% 45%)",
  "hsl(145 40% 38%)",
  "hsl(200 50% 45%)",
  "hsl(280 40% 50%)",
];

export default function ManageChildren() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [bookPurchases, setBookPurchases] = useState<BookPurchase[]>([]);
  const [childProgress, setChildProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState<"6-9" | "10-13">("6-9");
  const [submitting, setSubmitting] = useState(false);

  const fetchChildProgress = useCallback(async (childList: Child[]) => {
    if (!user || childList.length === 0) return;
    const { data } = await supabase
      .from("progress")
      .select("child_id, lesson_id")
      .eq("user_id", user.id);
    if (!data) return;

    const progressMap: Record<string, number> = {};
    for (const child of childList) {
      const stream = courseData.find((s) => s.id === child.age_band);
      if (!stream) { progressMap[child.id] = 0; continue; }
      const totalLessons = stream.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const completedLessons = data.filter((p) => p.child_id === child.id).length;
      progressMap[child.id] = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    }
    setChildProgress(progressMap);
  }, [user]);

  const fetchChildren = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });
    if (data) {
      setChildren(data);
      fetchChildProgress(data);
    }
    setLoading(false);
  }, [user, fetchChildProgress]);

  const fetchBookPurchases = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("book_purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });
    if (data) setBookPurchases(data);
  }, [user]);

  useEffect(() => {
    fetchChildren();
    fetchBookPurchases();
  }, [fetchChildren, fetchBookPurchases]);

  const addChild = async () => {
    if (!user || !newName.trim()) return;
    setSubmitting(true);
    const color = AVATAR_COLORS[children.length % AVATAR_COLORS.length];
    const { error } = await supabase.from("children").insert({
      parent_id: user.id,
      first_name: newName.trim(),
      age_band: newAge,
      avatar_color: color,
    });
    if (!error) {
      setNewName("");
      setShowAdd(false);
      await fetchChildren();
    }
    setSubmitting(false);
  };

  const removeChild = async (id: string) => {
    await supabase.from("children").delete().eq("id", id);
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const startCourse = (child: Child) => {
    navigate(`/course?child=${child.id}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark">
      <header className="sticky top-0 z-50 glass-overlay border-b border-border/40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldIcon size={24} className="stroke-primary" />
            <span className="font-display font-bold text-sm text-foreground uppercase tracking-wider hidden sm:inline">
              Kiki Warrior
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/parent")} className="text-muted-foreground hover:text-foreground transition-colors p-2" title="Parent Dashboard">
              <Users className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wide">
            Welcome, {profile?.first_name || "Parent"}
          </h1>
          <p className="font-body text-muted-foreground mt-1">
            {children.length === 0
              ? "Add your children to get started with their learning journey."
              : "Choose a learner to start or continue their course."}
          </p>
        </motion.div>

        <div className="grid gap-4">
          <AnimatePresence>
            {children.map((child, i) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="card-kiki flex items-center gap-4"
              >
                {user && (
                  <div className="shrink-0">
                    <ChildArmourAvatar
                      userId={user.id}
                      childId={child.id}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground uppercase tracking-wide truncate">
                      {child.first_name}
                    </h3>
                    <span className="font-display text-sm font-bold text-primary shrink-0">
                      {childProgress[child.id] ?? 0}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Ages {child.age_band}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-copper rounded-full transition-all duration-500"
                      style={{ width: `${childProgress[child.id] ?? 0}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeChild(child.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove child"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCourse(child)}
                  className="btn-copper px-4 py-2 text-xs uppercase tracking-widest flex items-center gap-1.5"
                >
                  Learn <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="card-kiki space-y-4"
            >
              <h3 className="font-display text-base font-semibold text-foreground uppercase tracking-wide">
                Add a Child
              </h3>
              <div>
                <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                  Child's First Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 font-body text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-muted-foreground block mb-1.5">
                  Age Band
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["6-9", "10-13"] as const).map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setNewAge(band)}
                      className={`rounded-lg border-2 px-4 py-3 font-display font-semibold text-sm tracking-wide transition-all ${
                        newAge === band
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      AGES {band}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-xl border border-border py-3 font-display text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addChild}
                  disabled={submitting || !newName.trim()}
                  className="flex-1 btn-copper py-3 text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? "..." : "Add Child"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showAdd && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAdd(true)}
            className="w-full card-kiki flex items-center justify-center gap-2 py-4 text-primary hover:border-primary/40 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-display text-sm uppercase tracking-widest">Add Child</span>
          </motion.button>
        )}

        {bookPurchases.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-8">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide">My Books</h2>
            </div>
            <div className="grid gap-3">
              {Array.from(new Set(bookPurchases.map((p) => p.book_id))).map((bookId) => {
                const purchases = bookPurchases.filter((p) => p.book_id === bookId);
                const title = purchases[0].book_title;
                return (
                  <div key={bookId} className="card-kiki space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wide truncate">{title}</h3>
                        <p className="text-xs text-muted-foreground font-body">
                          Purchased from {purchases.length} store{purchases.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Link
                        to={`/books/${bookId}`}
                        className="text-xs text-primary hover:underline font-display uppercase tracking-wide"
                      >
                        View
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {purchases.map((p) => (
                        <a
                          key={p.id}
                          href={p.store_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-display uppercase tracking-wide text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        >
                          {p.store_name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
