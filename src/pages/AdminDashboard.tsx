import { useEffect, useState } from "react";
import { sitecheckerSupabase } from "@/integrations/sitechecker/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ShieldIcon } from "@/components/course/CourseIcons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Users, Baby, BookOpen, TrendingUp, Search, LogOut } from "lucide-react";

const KIKI_CLIENT_ID = "7a197200-b63e-4a04-80b7-6c3bdcfd93d7";

interface DayCount { date: string; count: number }
interface GscDaily { date: string; clicks: number; impressions: number; ctr: number; position: number }
interface GscRow { label: string; clicks: number; impressions: number; ctr: number; position: number }

interface PlatformStats {
  totalParents: number;
  newThisWeek: number;
  newThisMonth: number;
  ageVerified: number;
  agePending: number;
  consentCount: number;
  totalChildren: number;
  avgChildrenPerParent: number;
  courseStarters: number;
  avgCompletion: number;
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const { adminUser, adminLoading, clientId, signOut } = useAdminAuth();

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <AdminLoginGate />
      </div>
    );
  }

  if (clientId !== KIKI_CLIENT_ID) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="card-kiki p-8 max-w-md mx-auto text-center">
          <ShieldIcon size={40} className="stroke-primary mx-auto mb-4" />
          <h3 className="font-display text-lg uppercase tracking-wider mb-2">Admin Dashboard</h3>
          <p className="text-sm text-muted-foreground mb-5">
            You don't have admin access. This account is not linked to the Kiki Warrior admin workspace.
          </p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-xs uppercase tracking-widest font-display border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboardView />;
}

function AdminLoginGate() {
  const { sendMagicLink } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error } = await sendMagicLink(email.trim());
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="card-kiki p-8 max-w-md w-full text-center">
      <ShieldIcon size={40} className="stroke-primary mx-auto mb-4" />
      <h3 className="font-display text-lg uppercase tracking-wider mb-2">Admin Dashboard</h3>
      {sent ? (
        <p className="text-sm text-muted-foreground">
          Check your email for the login link.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-5">
            Sign in with a one-time link to access the admin dashboard.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-border text-sm outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={sending}
              className="btn-copper w-full px-5 py-3 text-xs uppercase tracking-widest font-display disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Login Link"}
            </button>
          </form>
          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        </>
      )}
    </div>
  );
}

function AdminDashboardView() {
  const { signOut } = useAdminAuth();
  const [stats, setStats] = useState<PlatformStats>({
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
    let mounted = true;
    (async () => {
      const { data: { session } } = await sitecheckerSupabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SITECHECKER_SUPABASE_URL}/functions/v1/kiki-admin-stats`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok || !mounted) return;
      const data = await res.json();

      const u = data.users ?? {};
      const c = data.children ?? {};
      const course = data.course ?? {};
      const trend = (data.trend ?? []) as { date: string; count: number }[];

      setStats({
        totalParents: u.totalParents ?? 0,
        newThisWeek: u.newThisWeek ?? 0,
        newThisMonth: u.newThisMonth ?? 0,
        ageVerified: u.ageVerified ?? 0,
        agePending: u.agePending ?? 0,
        consentCount: u.consentCount ?? 0,
        totalChildren: c.totalChildren ?? 0,
        avgChildrenPerParent: c.avgChildrenPerParent ?? 0,
        courseStarters: course.courseStarters ?? 0,
        avgCompletion: course.avgCompletion ?? 0,
      });
      setModuleRates(course.moduleRates ?? []);
      setRecentUsers(course.recentUsers ?? []);
      setSignupTrend(trend.map((t: { date: string; count: number }) => ({ date: String(t.date).slice(5), count: t.count })));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-overlay border-b border-border/40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldIcon size={28} className="stroke-primary" />
            <span className="font-display font-bold text-lg uppercase tracking-wider">Admin Dashboard</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-display border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="card-kiki p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
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
          </>
        )}

        {/* Section 5: Google Search Console */}
        <section>
          <h2 className="font-display text-xl uppercase tracking-wider mb-4 flex items-center gap-2">
            <Search size={20} className="text-primary" /> Google Search Console
          </h2>
          <GscPanel />
        </section>
      </main>
    </div>
  );
}

function GscPanel() {
  const [daily, setDaily] = useState<GscDaily[]>([]);
  const [queries, setQueries] = useState<GscRow[]>([]);
  const [pages, setPages] = useState<GscRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const since30 = daysAgoIso(30);
      const since7 = daysAgoIso(7);

      const [d, q, p] = await Promise.all([
        sitecheckerSupabase
          .from("gsc_daily_metrics")
          .select("date, clicks, impressions, ctr, position")
          .eq("client_id", KIKI_CLIENT_ID)
          .gte("date", since30)
          .order("date", { ascending: true }),
        sitecheckerSupabase
          .from("gsc_queries")
          .select("query, clicks, impressions, ctr, position")
          .eq("client_id", KIKI_CLIENT_ID)
          .gte("date", since7)
          .order("clicks", { ascending: false })
          .limit(200),
        sitecheckerSupabase
          .from("gsc_pages")
          .select("page, clicks, impressions, ctr, position")
          .eq("client_id", KIKI_CLIENT_ID)
          .gte("date", since7)
          .order("clicks", { ascending: false })
          .limit(200),
      ]);

      if (!mounted) return;
      setDaily(((d.data ?? []) as GscDaily[]));
      setQueries(aggregate((q.data ?? []) as Record<string, unknown>[], "query").slice(0, 20));
      setPages(aggregate((p.data ?? []) as Record<string, unknown>[], "page").slice(0, 10));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="card-kiki p-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (daily.length === 0 && queries.length === 0 && pages.length === 0) {
    return (
      <div className="card-kiki p-6 text-sm text-muted-foreground">
        No Google Search Console data yet. Data will appear after the daily sync runs and the GSC property for kikiwarrior.com is verified.
      </div>
    );
  }

  const totalClicks = daily.reduce((a, b) => a + (b.clicks || 0), 0);
  const totalImpressions = daily.reduce((a, b) => a + (b.impressions || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition = daily.length > 0
    ? daily.reduce((a, b) => a + (b.position || 0), 0) / daily.length
    : 0;

  const chartData = daily.map(d => ({
    date: d.date.slice(5),
    clicks: d.clicks || 0,
    impressions: d.impressions || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Total Impressions" value={totalImpressions.toLocaleString()} />
        <StatCard label="Avg CTR" value={`${avgCtr.toFixed(2)}%`} />
        <StatCard label="Avg Position" value={avgPosition.toFixed(1)} />
      </div>

      {chartData.length > 0 && (
        <div className="card-kiki p-4">
          <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-muted-foreground">
            Clicks and Impressions (30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Clicks" />
              <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Impressions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <GscTable title="Top Queries (7 Days)" firstCol="Query" rows={queries} />
      <GscTable title="Top Pages (7 Days)" firstCol="Page" rows={pages} />
    </div>
  );
}

function aggregate(rows: Record<string, unknown>[], key: string): GscRow[] {
  const map: Record<string, { clicks: number; impressions: number; posSum: number; n: number }> = {};
  rows.forEach(r => {
    const label = String(r[key] ?? "");
    if (!label) return;
    if (!map[label]) map[label] = { clicks: 0, impressions: 0, posSum: 0, n: 0 };
    map[label].clicks += Number(r.clicks) || 0;
    map[label].impressions += Number(r.impressions) || 0;
    map[label].posSum += Number(r.position) || 0;
    map[label].n += 1;
  });
  return Object.entries(map)
    .map(([label, v]) => ({
      label,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
      position: v.n > 0 ? v.posSum / v.n : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

function GscTable({ title, firstCol, rows }: { title: string; firstCol: string; rows: GscRow[] }) {
  return (
    <div className="card-kiki p-4">
      <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data for this period yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground font-display">
                <th className="py-2 pr-3">{firstCol}</th>
                <th className="py-2 px-3 text-right">Clicks</th>
                <th className="py-2 px-3 text-right">Impressions</th>
                <th className="py-2 px-3 text-right">CTR</th>
                <th className="py-2 pl-3 text-right">Avg Position</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border/40">
                  <td className="py-2 pr-3 max-w-[280px] truncate" title={r.label}>{r.label}</td>
                  <td className="py-2 px-3 text-right font-mono">{r.clicks.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono">{r.impressions.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono">{r.ctr.toFixed(2)}%</td>
                  <td className="py-2 pl-3 text-right font-mono">{r.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
