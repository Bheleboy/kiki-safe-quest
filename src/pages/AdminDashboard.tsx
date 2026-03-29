import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, Baby, BookOpen, TrendingUp, ArrowLeft } from "lucide-react";

interface DayCount { date: string; count: number }

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalParents: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    ageVerified: 0,
    agePending: 0,
    consentCount: 0,
    totalChildren: 0,
    avgChildrenPerParent: 0,
    courseStarters: 0,
    avgCompletion: 0,
  });
  const [moduleRates, setModuleRates] = useState<{ module: string; rate: number }[]>([]);
  const [recentUsers, setRecentUsers] = useState<{ name: string; lastActive: string }[]>([]);
  const [signupTrend, setSignupTrend] = useState<DayCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.is_admin) return;
    fetchAll();
  }, [profile]);

  async function fetchAll() {
    setLoading(true);
    try {
      await Promise.all([fetchUserStats(), fetchChildStats(), fetchCourseStats(), fetchSignupTrend()]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserStats() {
    const { data: profiles } = await supabase.from("profiles").select("created_at, age_verified, consent_accepted_at");
    if (!profiles) return;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    setStats(s => ({
      ...s,
      totalParents: profiles.length,
      newThisWeek: profiles.filter(p => new Date(p.created_at) >= weekAgo).length,
      newThisMonth: profiles.filter(p => new Date(p.created_at) >= monthAgo).length,
      ageVerified: profiles.filter(p => p.age_verified).length,
      agePending: profiles.filter(p => !p.age_verified).length,
      consentCount: profiles.filter(p => p.consent_accepted_at).length,
    }));
  }

  async function fetchChildStats() {
    const { data: children } = await supabase.from("children").select("parent_id");
    if (!children) return;
    const uniqueParents = new Set(children.map(c => c.parent_id)).size;
    setStats(s => ({
      ...s,
      totalChildren: children.length,
      avgChildrenPerParent: uniqueParents > 0 ? Math.round((children.length / uniqueParents) * 10) / 10 : 0,
    }));
  }

  async function fetchCourseStats() {
    const { data: progress } = await supabase.from("progress").select("user_id, child_id, lesson_id, completed_at");
    if (!progress) return;

    // Unique starters
    const starters = new Set(progress.map(p => p.child_id || p.user_id));
    
    // For module rates, we need lesson counts from courseData
    // Using a simplified approach: count unique lessons completed per user
    const userLessons: Record<string, Set<string>> = {};
    progress.forEach(p => {
      const key = p.child_id || p.user_id;
      if (!userLessons[key]) userLessons[key] = new Set();
      userLessons[key].add(p.lesson_id);
    });

    // Module completion rates based on lesson prefixes
    const moduleMap: Record<string, { total: number; completed: Set<string> }> = {};
    progress.forEach(p => {
      // Extract module prefix e.g. "young-m1" from "young-m1-l1"
      const parts = p.lesson_id.split("-");
      if (parts.length >= 2) {
        const moduleId = parts.slice(0, 2).join("-");
        if (!moduleMap[moduleId]) moduleMap[moduleId] = { total: 0, completed: new Set() };
        moduleMap[moduleId].completed.add(`${p.child_id || p.user_id}::${p.lesson_id}`);
      }
    });

    const rates = Object.entries(moduleMap).map(([mod, data]) => ({
      module: mod,
      rate: Math.round((data.completed.size / Math.max(starters.size, 1)) * 100),
    }));

    // Recent active users
    const userActivity: Record<string, { lastActive: string }> = {};
    progress.forEach(p => {
      const key = p.user_id;
      if (!userActivity[key] || p.completed_at > userActivity[key].lastActive) {
        userActivity[key] = { lastActive: p.completed_at };
      }
    });

    const sortedUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b.lastActive.localeCompare(a.lastActive))
      .slice(0, 10);

    // Fetch names for these users
    const userIds = sortedUsers.map(([id]) => id);
    const { data: userProfiles } = await supabase.from("profiles").select("id, first_name").in("id", userIds);
    const nameMap: Record<string, string> = {};
    userProfiles?.forEach(p => { nameMap[p.id] = p.first_name || "Unknown"; });

    setRecentUsers(sortedUsers.map(([id, data]) => ({
      name: nameMap[id] || "Unknown",
      lastActive: new Date(data.lastActive).toLocaleDateString(),
    })));

    // Average completion: total unique lessons per user / approximate total lessons
    const totalLessonIds = new Set(progress.map(p => p.lesson_id)).size;
    const completionRates = Object.values(userLessons).map(s => (s.size / Math.max(totalLessonIds, 1)) * 100);
    const avgCompletion = completionRates.length > 0
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;

    setStats(s => ({ ...s, courseStarters: starters.size, avgCompletion }));
    setModuleRates(rates);
  }

  async function fetchSignupTrend() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (!profiles) return;
    const dayCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - (29 - i) * 86400000);
      dayCounts[d.toISOString().slice(0, 10)] = 0;
    }
    profiles.forEach(p => {
      const day = p.created_at.slice(0, 10);
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    });
    setSignupTrend(Object.entries(dayCounts).map(([date, count]) => ({ date: date.slice(5), count })));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-overlay border-b border-border/40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/family" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <ShieldIcon size={28} className="stroke-primary" />
            <span className="font-display font-bold text-lg uppercase tracking-wider">Admin Dashboard</span>
          </div>
          <Link to="/family" className="btn-copper px-5 py-2 text-xs uppercase tracking-widest font-display">
            Family View
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Section 1: User Overview */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" /> User Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total Parents" value={stats.totalParents} />
            <StatCard label="New This Week" value={stats.newThisWeek} />
            <StatCard label="New This Month" value={stats.newThisMonth} />
            <StatCard label="Age Verified" value={stats.ageVerified} sub={`${stats.agePending} pending`} />
            <StatCard label="Consent Given" value={stats.consentCount} />
          </div>
        </section>

        {/* Section 2: Child Accounts */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wider mb-4 flex items-center gap-2">
            <Baby size={20} className="text-primary" /> Child Accounts
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Children" value={stats.totalChildren} />
            <StatCard label="Avg per Parent" value={stats.avgChildrenPerParent} />
          </div>
        </section>

        {/* Section 3: Course Engagement */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-primary" /> Course Engagement
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Course Starters" value={stats.courseStarters} />
            <StatCard label="Avg Completion" value={`${stats.avgCompletion}%`} />
          </div>

          {moduleRates.length > 0 && (
            <div className="card-kiki p-4 mb-6">
              <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                Module Completion Rates
              </h3>
              <div className="space-y-2">
                {moduleRates.map(m => (
                  <div key={m.module} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{m.module}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(m.rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-10 text-right">{m.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentUsers.length > 0 && (
            <div className="card-kiki p-4">
              <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-muted-foreground">
                Recent Active Users
              </h3>
              <div className="space-y-2">
                {recentUsers.map((u, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{u.name}</span>
                    <span className="text-muted-foreground">{u.lastActive}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Signup Trend */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Signup Trend (30 Days)
          </h2>
          <div className="card-kiki p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={signupTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  name="Signups"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-kiki p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-display">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
