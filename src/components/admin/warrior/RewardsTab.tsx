import { useCallback, useEffect, useMemo, useState } from "react";
import { PENDING_SHIPMENT_STATUSES, SHIPPABLE_STATUSES, pendingShipmentsCsv, type RewardRow } from "../../../../supabase/functions/_shared/warrior-admin";
import { KIT_STATUS } from "@/lib/warriorPass";
import { cardCls, downloadCsv, field, fmtDate, h3Cls, pillOutline, pillPrimary, useAdminOrders } from "./adminOrdersApi";

type Item = RewardRow & {
  kit_id: string; shipment_id: string | null; delivery_point: string | null; courier: string | null; waybill: string | null;
  tracking_url: string | null; shipped_at: string | null; delivered_at: string | null; earned_at: string | null; order_status: string | null;
};
type Group = { group_id: string; items: Item[] };

const SHIPMENT_LABEL: Record<string, string> = {
  draft: "Ready to pack", submitted: "Submitted", booked: "Booked", collected: "Collected",
  in_transit: "Sent", delivered: "Delivered", failed: "Delivery failed",
};

export default function RewardsTab() {
  const { call, ready } = useAdminOrders();
  const [groups, setGroups] = useState<Group[]>([]);
  const [lockedCount, setLockedCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await call<{ groups: Group[]; locked_count: number }>({ action: "list_rewards" });
    setLoading(false);
    if (!r.ok) { setError(r.message); return; }
    setError("");
    setGroups(r.data.groups);
    setLockedCount(r.data.locked_count);
  }, [call]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const isOpen = (g: Group) => g.items.some((i) => i.kit_status !== "delivered" && i.shipment_status !== "in_transit");
  const visible = useMemo(() => (showAll ? groups : groups.filter(isOpen)), [groups, showAll]);
  const allItems = groups.flatMap((g) => g.items);
  const pendingCount = allItems.filter((i) => i.shipment_status && PENDING_SHIPMENT_STATUSES.includes(i.shipment_status)).length;

  return (
    <div className="space-y-6">
      <div className={`${cardCls} flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="flex-1 font-body text-sm text-charcoal/80">
          <p><span className="font-bold text-charcoal">{pendingCount}</span> parcel{pendingCount === 1 ? "" : "s"} to pack. {lockedCount} kit{lockedCount === 1 ? "" : "s"} still locked until those children finish the course.</p>
        </div>
        <label className="flex items-center gap-2 font-body text-sm text-charcoal/80 min-h-11">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="w-4 h-4" /> Show sent and delivered
        </label>
        <button type="button" className={pillOutline} disabled={pendingCount === 0}
          onClick={() => downloadCsv(`kiki-parcels-${new Date().toISOString().slice(0, 10)}.csv`, pendingShipmentsCsv(allItems))}>
          Export parcels to pack
        </button>
      </div>

      {error && <p className="font-body text-sm text-destructive">{error}</p>}
      {loading && <p className="font-body text-sm text-charcoal/70">Loading rewards...</p>}
      {!loading && visible.length === 0 && !error && <p className="font-body text-sm text-charcoal/70">Nothing to send right now.</p>}
      {visible.map((g) => <GroupCard key={g.group_id} group={g} onDone={load} />)}
    </div>
  );
}

function GroupCard({ group, onDone }: { group: Group; onDone: () => void }) {
  const { call } = useAdminOrders();
  const first = group.items[0];
  const shippable = group.items.filter((i) => i.shipment_id && i.shipment_status && SHIPPABLE_STATUSES.includes(i.shipment_status));
  const sent = group.items.filter((i) => i.shipment_id && i.shipment_status === "in_transit");
  const [courier, setCourier] = useState("The Courier Guy");
  const [waybill, setWaybill] = useState("");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async (action: "mark_shipped" | "mark_delivered", items: Item[]) => {
    setBusy(true); setMsg("");
    const r = await call({
      action, shipment_ids: items.map((i) => i.shipment_id),
      ...(action === "mark_shipped" ? { courier, waybill, tracking_url: tracking || null } : {}),
    });
    setBusy(false);
    if (!r.ok) { setMsg(r.message); return; }
    onDone();
  };

  return (
    <article className={cardCls}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`${h3Cls} mb-1`}>{first.parent_name || "Family"}</h3>
          <p className="font-body text-xs text-charcoal/60 break-all">{first.parent_email}</p>
        </div>
        <div className="font-body text-sm text-charcoal/80 sm:text-right">
          <p className="font-display uppercase text-[11px] tracking-widest text-charcoal/60">{first.delivery_method === "locker" ? "Courier Guy locker" : "Delivery address"}</p>
          <p className="break-words">{first.delivery_point || "No delivery details yet"}</p>
          {first.recipient_name && <p className="text-xs text-charcoal/60">{first.recipient_name}, {first.phone}</p>}
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {group.items.map((i) => (
          <li key={i.kit_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 px-4 py-3 font-body text-sm">
            <span className="text-charcoal font-medium">{i.child_name || "Child"}</span>
            <span className="text-charcoal/70 text-right">
              {i.shipment_status ? SHIPMENT_LABEL[i.shipment_status] ?? i.shipment_status : KIT_STATUS[i.kit_status] ?? i.kit_status}
              {i.earned_at && <span className="block text-xs text-charcoal/50">Earned {fmtDate(i.earned_at)}</span>}
              {i.waybill && <span className="block text-xs text-charcoal/50">{i.courier} {i.waybill}</span>}
              {i.order_status === "refunded" && <span className="block text-xs text-destructive font-bold">Order refunded, check before sending</span>}
            </span>
          </li>
        ))}
      </ul>

      {shippable.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input className={field} aria-label="Courier" placeholder="Courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
          <input className={field} aria-label="Waybill number" placeholder="Waybill number" value={waybill} onChange={(e) => setWaybill(e.target.value)} />
          <input className={field} aria-label="Tracking link" placeholder="https://tracking link" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <button type="button" className={pillPrimary} disabled={busy || !courier || !waybill} onClick={() => run("mark_shipped", shippable)}>{busy ? "Saving..." : "Mark sent"}</button>
        </div>
      )}
      {sent.length > 0 && (
        <button type="button" className={`${pillOutline} mt-2`} disabled={busy} onClick={() => run("mark_delivered", sent)}>Mark delivered</button>
      )}
      {shippable.length === 0 && sent.length === 0 && group.items.some((i) => i.kit_status === "address_needed") && (
        <p className="font-body text-sm text-charcoal/70">Waiting for the parent to add delivery details.</p>
      )}
      {msg && <p className="font-body text-sm text-destructive mt-2">{msg}</p>}
    </article>
  );
}
