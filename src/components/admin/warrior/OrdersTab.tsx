import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  ORDER_KIND_LABEL, ORDER_STATUS_LABEL, cardCls, field, fmtDate, fmtDateTime, h3Cls, pillDanger, pillOutline, pillPrimary,
  rands, useAdminOrders,
} from "./adminOrdersApi";

type OrderRow = {
  id: string; reference: string; kind: string; amount_cents: number; status: string; created_at: string; paid_at: string | null;
  parent_name: string | null; parent_email: string | null;
};
type Stats = {
  paid_passes: number; launch_limit: number; founding_places_left: number; revenue_cents: number;
  children_reached_gate: number; families_reached_gate: number; families_paid_after_gate: number;
};

export function StatsStrip({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  const tiles = [
    { label: "Paid passes", value: stats.paid_passes },
    { label: "Founding Family places left", value: stats.founding_places_left, sub: `of ${stats.launch_limit}` },
    { label: "Revenue", value: rands(stats.revenue_cents) },
    { label: "Children at the gate", value: stats.children_reached_gate, sub: `${stats.families_reached_gate} families` },
    { label: "Paid after the gate", value: stats.families_paid_after_gate, sub: "families" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="card-kiki border-primary/15 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-display">{t.label}</p>
          <p className="text-2xl font-bold mt-1">{t.value}</p>
          {t.sub && <p className="text-xs text-muted-foreground mt-1">{t.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export default function OrdersTab() {
  const { call, ready } = useAdminOrders();
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({ status: "", kind: "", from: "", to: "", search: "" });
  const [applied, setApplied] = useState(filters);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, st] = await Promise.all([
      call<{ rows: OrderRow[]; total: number; page_size: number }>({ action: "list_orders", page, ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)) }),
      call<Stats>({ action: "stats" }),
    ]);
    setLoading(false);
    if (!list.ok) { setError(list.message); return; }
    setError("");
    setRows(list.data.rows);
    setTotal(list.data.total);
    setPageSize(list.data.page_size);
    if (st.ok) setStats(st.data);
  }, [call, page, applied]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <StatsStrip stats={stats} />

      <div className={cardCls}>
        <h3 className={h3Cls}>Orders</h3>
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(0); setApplied(filters); }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-4"
        >
          <input className={`${field} lg:col-span-2`} placeholder="Parent email or order reference" aria-label="Search orders"
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className={field} aria-label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Any status</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={field} aria-label="Type" value={filters.kind} onChange={(e) => setFilters({ ...filters, kind: e.target.value })}>
            <option value="">Any type</option>
            {Object.entries(ORDER_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" className={field} aria-label="From date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className={field} aria-label="To date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <div className="sm:col-span-2 lg:col-span-6 flex gap-2">
            <button type="submit" className={pillPrimary}>Filter</button>
            <button type="button" className={pillOutline} onClick={() => { const empty = { status: "", kind: "", from: "", to: "", search: "" }; setFilters(empty); setApplied(empty); setPage(0); }}>Clear</button>
          </div>
        </form>

        {error && <p className="font-body text-sm text-destructive mb-3">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal/60 font-display">
                <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Reference</th><th className="py-2 pr-3">Parent</th>
                <th className="py-2 pr-3">Type</th><th className="py-2 pr-3 text-right">Amount</th><th className="py-2 pr-3">Status</th><th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-primary/10 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-charcoal/70">{fmtDate(o.created_at)}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{o.reference}</td>
                  <td className="py-2 pr-3 break-all">{o.parent_name || "-"}<span className="block text-xs text-charcoal/60">{o.parent_email}</span></td>
                  <td className="py-2 pr-3">{ORDER_KIND_LABEL[o.kind] ?? o.kind}</td>
                  <td className="py-2 pr-3 text-right font-mono">{rands(o.amount_cents)}</td>
                  <td className="py-2 pr-3"><StatusPill status={o.status} /></td>
                  <td className="py-2 text-right"><button type="button" onClick={() => setOpenId(o.id)} className="font-display text-xs uppercase tracking-wider text-primary hover:underline min-h-11 px-2">Details</button></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="py-3 text-charcoal/70">No orders match.</td></tr>}
              {loading && <tr><td colSpan={7} className="py-3 text-charcoal/70">Loading orders...</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 font-body text-sm text-charcoal/70">
          <span>{total} order{total === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-2">
            <button type="button" className={pillOutline} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page + 1} of {pages}</span>
            <button type="button" className={pillOutline} disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>

      <SupportCard />

      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "paid" ? "bg-primary/20" : status === "refunded" ? "bg-destructive/15" : "bg-muted";
  return <span className={`rounded-full ${tone} px-3 py-1 font-display text-[11px] uppercase tracking-widest text-charcoal`}>{ORDER_STATUS_LABEL[status] ?? status}</span>;
}

function OrderDrawer({ orderId, onClose, onChanged }: { orderId: string | null; onClose: () => void; onChanged: () => void }) {
  const { call } = useAdminOrders();
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!orderId) return;
    setDetail(null); setError(""); setConfirmText(""); setMsg("");
    void call({ action: "order_detail", order_id: orderId }).then((r) => {
      if (r.ok) setDetail(r.data); else setError(r.message);
    });
  }, [orderId, call]);

  const refund = async () => {
    if (!detail) return;
    setBusy(true); setMsg("");
    const r = await call({ action: "refund_order", order_id: detail.order.id, confirm: confirmText.trim() });
    setBusy(false);
    if (!r.ok) { setMsg(r.message); return; }
    setMsg("Refund sent to Yoco. The parent has been emailed.");
    onChanged();
    const again = await call({ action: "order_detail", order_id: detail.order.id });
    if (again.ok) setDetail(again.data);
  };

  const o = detail?.order;
  return (
    <Sheet open={!!orderId} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="bg-cream overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display uppercase tracking-wider text-charcoal">{o?.reference ?? "Order"}</SheetTitle>
          <SheetDescription className="font-body">{o ? `${ORDER_KIND_LABEL[o.kind] ?? o.kind}, ${rands(o.amount_cents)}` : "Loading..."}</SheetDescription>
        </SheetHeader>
        {error && <p className="font-body text-sm text-destructive mt-4">{error}</p>}
        {o && (
          <div className="mt-6 space-y-5 font-body text-sm text-charcoal">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-charcoal/60">Status</dt><dd><StatusPill status={o.status} /></dd>
              <dt className="text-charcoal/60">Parent</dt><dd className="break-all">{detail.parent?.first_name || "-"} ({detail.parent?.email || "no email"})</dd>
              <dt className="text-charcoal/60">Created</dt><dd>{fmtDateTime(o.created_at)}</dd>
              <dt className="text-charcoal/60">Paid</dt><dd>{fmtDateTime(o.paid_at)}</dd>
              <dt className="text-charcoal/60">Yoco checkout</dt><dd className="font-mono text-xs break-all">{o.provider_checkout_id || "-"}</dd>
              <dt className="text-charcoal/60">Yoco payment</dt><dd className="font-mono text-xs break-all">{o.provider_payment_id || "-"}</dd>
            </dl>

            {Array.isArray(o.metadata?.lines) && (
              <div>
                <p className="font-display uppercase text-xs tracking-widest text-charcoal/70 mb-2">Items</p>
                <ul className="space-y-1">
                  {o.metadata.lines.map((l: any, i: number) => {
                    const kit = detail.kits.find((k: any) => k.child_id === l.child_id);
                    return <li key={i}>{l.type === "family_pass" ? "Family Warrior Pass" : l.type === "book" ? "Family library book" : "Extra Armour Kit"}{kit?.child_name ? ` (${kit.child_name})` : ""}: {rands(l.amount_cents)}</li>;
                  })}
                </ul>
              </div>
            )}

            {detail.entitlements.length > 0 && (
              <div>
                <p className="font-display uppercase text-xs tracking-widest text-charcoal/70 mb-2">Access from this order</p>
                {detail.entitlements.map((e: any) => (
                  <p key={e.id}>{e.kind === "family_pass" ? "Warrior Pass" : "Book"}: {e.revoked_at ? `removed ${fmtDate(e.revoked_at)}` : `active since ${fmtDate(e.granted_at)}`}</p>
                ))}
              </div>
            )}

            <div>
              <p className="font-display uppercase text-xs tracking-widest text-charcoal/70 mb-2">Payment events</p>
              {detail.events.length === 0 ? <p className="text-charcoal/70">No events from Yoco yet.</p> : (
                <ul className="space-y-1">
                  {detail.events.map((e: any) => (
                    <li key={e.id} className="text-xs">{fmtDateTime(e.received_at)}: {e.type ?? "event"}{e.mode ? ` (${e.mode})` : ""}{typeof e.amount === "number" ? `, ${rands(e.amount)}` : ""}</li>
                  ))}
                </ul>
              )}
            </div>

            {o.status === "paid" && (
              <div className="rounded-2xl border border-destructive/30 p-4 space-y-3">
                <p className="font-display uppercase text-xs tracking-widest text-charcoal">Refund</p>
                {!detail.refunds_available ? (
                  <p className="text-charcoal/70">Refunds are only available once a live Yoco key is set up.</p>
                ) : (
                  <>
                    <p className="text-charcoal/80">This refunds the full amount through Yoco, removes the access that came from this order and emails the parent. Type <span className="font-mono font-bold">{o.reference}</span> to confirm.</p>
                    <input className={field} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} aria-label="Type the order reference to confirm" placeholder={o.reference} />
                    <button type="button" className={pillDanger} disabled={busy || confirmText.trim() !== o.reference} onClick={refund}>{busy ? "Refunding..." : "Refund order"}</button>
                  </>
                )}
              </div>
            )}
            {msg && <p className="text-sm text-charcoal/80">{msg}</p>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SupportCard() {
  const { call } = useAdminOrders();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async (action: "grant_pass" | "revoke_pass") => {
    const verb = action === "grant_pass" ? "Give" : "Remove";
    if (!email || !window.confirm(`${verb} the Warrior Pass for ${email}?`)) return;
    setBusy(true); setMsg("");
    const r = await call({ action, email });
    setBusy(false);
    setMsg(r.ok ? (action === "grant_pass" ? `Warrior Pass given to ${r.data.email}.` : `Warrior Pass removed for ${r.data.email}.`) : r.message);
  };

  return (
    <div className={cardCls}>
      <h3 className={h3Cls}>Support: give or remove a pass</h3>
      <p className="font-body text-sm text-charcoal/70 mb-3">For support cases only. Paid passes can only be removed with a refund.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input type="email" className={`${field} flex-1`} placeholder="parent@example.com" aria-label="Parent email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" className={pillPrimary} disabled={busy || !email} onClick={() => run("grant_pass")}>Give pass</button>
        <button type="button" className={pillOutline} disabled={busy || !email} onClick={() => run("revoke_pass")}>Remove pass</button>
      </div>
      {msg && <p className="font-body text-sm text-charcoal/80 mt-3">{msg}</p>}
    </div>
  );
}
