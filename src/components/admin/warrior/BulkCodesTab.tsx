import { useCallback, useEffect, useState } from "react";
import { cardCls, downloadCsv, field, fmtDate, h3Cls, pillDanger, pillOutline, pillPrimary, useAdminOrders } from "./adminOrdersApi";

type Batch = {
  id: string; name: string; organisation: string | null; seats: number; expires_at: string | null; notes: string | null;
  created_at: string; seats_used: number; seats_remaining: number; active: boolean;
};

const ERRORS: Record<string, string> = {
  invalid_name: "Give the batch a name.",
  invalid_seats: "Seats must be a whole number from 1 to 2000.",
  invalid_expiry: "The expiry date must be in the future.",
};

export default function BulkCodesTab() {
  const { call, ready } = useAdminOrders();
  const [rows, setRows] = useState<Batch[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", organisation: "", seats: "", expires_at: "", notes: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await call<{ rows: Batch[] }>({ action: "list_batches" });
    setLoading(false);
    if (!r.ok) { setError(r.message); return; }
    setError("");
    setRows(r.data.rows);
  }, [call]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create"); setMsg("");
    const r = await call<{ batch_id: string }>({
      action: "create_batch",
      name: form.name, organisation: form.organisation || null, seats: Number(form.seats),
      expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null, notes: form.notes || null,
    });
    setBusy(null);
    if (!r.ok) { setMsg(ERRORS[r.error] ?? r.message); return; }
    setMsg(`Created ${form.seats} codes. Use Export CSV to download them.`);
    setForm({ name: "", organisation: "", seats: "", expires_at: "", notes: "" });
    void load();
  };

  const exportBatch = async (b: Batch) => {
    setBusy(b.id);
    const r = await call<{ csv: string; filename: string }>({ action: "export_batch", batch_id: b.id });
    setBusy(null);
    if (!r.ok) { setError(r.message); return; }
    downloadCsv(r.data.filename, r.data.csv);
  };

  const disable = async (b: Batch) => {
    if (!window.confirm(`Disable "${b.name}"? Codes that were not used yet will stop working straight away. Families who already used a code keep their pass.`)) return;
    setBusy(b.id);
    const r = await call({ action: "disable_batch", batch_id: b.id });
    setBusy(null);
    if (!r.ok) { setError(r.message); return; }
    void load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className={cardCls}>
        <h3 className={h3Cls}>Create a batch of codes</h3>
        <p className="font-body text-sm text-charcoal/70 mb-3">Each code unlocks every lesson for one family. Codes do not include an Armour Kit.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 font-body text-sm">
          <Labelled label="Name"><input className={field} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="St Mark's Grade 4" /></Labelled>
          <Labelled label="Organisation"><input className={field} value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} placeholder="School or church" /></Labelled>
          <Labelled label="Seats (1 to 2000)"><input className={field} required inputMode="numeric" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value.replace(/[^\d]/g, "") })} /></Labelled>
          <Labelled label="Expires (optional)"><input type="date" className={field} value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></Labelled>
          <div className="sm:col-span-2 lg:col-span-4">
            <Labelled label="Notes (optional)"><textarea className={`${field} py-2 min-h-20`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Labelled>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
          <button type="submit" className={pillPrimary} disabled={busy === "create" || !form.name || !form.seats}>{busy === "create" ? "Creating..." : "Create codes"}</button>
          {msg && <p className="font-body text-sm text-charcoal/80">{msg}</p>}
        </div>
      </form>

      <div className={cardCls}>
        <h3 className={h3Cls}>Batches</h3>
        {error && <p className="font-body text-sm text-destructive mb-3">{error}</p>}
        {loading ? <p className="font-body text-sm text-charcoal/70">Loading batches...</p> : rows.length === 0 ? (
          <p className="font-body text-sm text-charcoal/70">No batches yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-charcoal/60 font-display">
                  <th className="py-2 pr-3">Batch</th><th className="py-2 pr-3">Created</th><th className="py-2 pr-3 text-right">Used</th>
                  <th className="py-2 pr-3 text-right">Left</th><th className="py-2 pr-3">Expires</th><th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-t border-primary/10 align-top">
                    <td className="py-2 pr-3">
                      <span className="text-charcoal font-medium">{b.name}</span>
                      {b.organisation && <span className="block text-xs text-charcoal/60">{b.organisation}</span>}
                      {!b.active && <span className="inline-block mt-1 rounded-full bg-muted px-3 py-0.5 font-display text-[11px] uppercase tracking-widest text-charcoal">Disabled</span>}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-charcoal/70">{fmtDate(b.created_at)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{b.seats_used} of {b.seats}</td>
                    <td className="py-2 pr-3 text-right font-mono">{b.seats_remaining}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-charcoal/70">{b.expires_at ? fmtDate(b.expires_at) : "Never"}</td>
                    <td className="py-2 text-right whitespace-nowrap space-x-2">
                      <button type="button" className={pillOutline} disabled={busy === b.id} onClick={() => exportBatch(b)}>Export CSV</button>
                      {b.active && <button type="button" className={pillDanger} disabled={busy === b.id} onClick={() => disable(b)}>Disable</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-charcoal">
      <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">{label}</span>
      {children}
    </label>
  );
}
