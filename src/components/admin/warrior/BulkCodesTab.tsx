import { useCallback, useEffect, useState } from "react";
import { PROVINCES } from "@/lib/warriorPass";
import { codeSheetPages } from "../../../../supabase/functions/_shared/warrior-admin";
import { cardCls, downloadCsv, field, fmtDate, h3Cls, pillDanger, pillOutline, pillPrimary, rands, useAdminOrders } from "./adminOrdersApi";

type Batch = {
  id: string; name: string; organisation: string | null; seats: number; expires_at: string | null; notes: string | null;
  created_at: string; seats_used: number; seats_remaining: number; active: boolean;
  contact_name: string | null; contact_email: string | null; price_per_learner_cents: number | null; amount_cents: number | null;
  payment_reference: string | null; kits_included: boolean | null;
  shipment: { id: string; status: string; waiting_for_restock: boolean; quantity: number } | null;
};
type Quote = { per_learner_cents: number | null; amount_cents: number | null; kits_in_stock: number | null; short: number };

const ERRORS: Record<string, string> = {
  invalid_name: "Give the batch a name.",
  invalid_seats: "The number of learners must be a whole number from 1 to 2000.",
  invalid_expiry: "The expiry date must be in the future.",
  invalid_contact_email: "The contact email does not look right.",
  invalid_contact_phone: "The contact phone number does not look right.",
  invalid_price: "The price per learner must be more than R0.",
  override_reason_required: "Give a reason for changing the price.",
};
const DELIVERY_ERRORS: Record<string, string> = {
  recipient_name: "Enter the name of the person receiving the kits.",
  phone: "Enter a valid phone number for delivery.",
  address_line1: "Enter the street address for delivery.",
  city: "Enter the city or town for delivery.",
  province: "Choose the province for delivery.",
  postal_code: "Enter a 4-digit postal code for delivery.",
};

const EMPTY = {
  name: "", organisation: "", contact_name: "", contact_email: "", contact_phone: "", seats: "", expires_at: "", notes: "",
  payment_reference: "", override: "", override_reason: "",
  recipient_name: "", phone: "", address_line1: "", address_line2: "", suburb: "", city: "", province: "", postal_code: "",
};

const SHIP_LABEL: Record<string, string> = { draft: "Kits to pack", packed: "Packed", in_transit: "Kits sent", delivered: "Kits delivered" };

export default function BulkCodesTab() {
  const { call, ready } = useAdminOrders();
  const [rows, setRows] = useState<Batch[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [backorder, setBackorder] = useState(false);
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

  const learners = Number(form.seats);
  useEffect(() => {
    if (!ready || !Number.isInteger(learners) || learners < 1) { setQuote(null); return; }
    const t = window.setTimeout(async () => {
      const r = await call<Quote>({ action: "org_quote", learners });
      if (r.ok) setQuote(r.data);
    }, 300);
    return () => window.clearTimeout(t);
  }, [ready, call, learners]);

  const overrideCents = form.override.trim() ? Math.round(Number(form.override.replace(",", ".")) * 100) : null;
  const perLearner = overrideCents ?? quote?.per_learner_cents ?? null;
  const total = perLearner !== null && learners > 0 ? perLearner * learners : null;
  const short = quote?.short ?? 0;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("create"); setMsg("");
    const r = await call<{ batch_id: string; waiting_for_restock: boolean }>({
      action: "create_batch",
      name: form.name, organisation: form.organisation || null, seats: learners,
      contact_name: form.contact_name || null, contact_email: form.contact_email || null, contact_phone: form.contact_phone || null,
      expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null, notes: form.notes || null,
      payment_reference: form.payment_reference || null,
      price_override_cents: overrideCents, price_override_reason: form.override_reason || null,
      allow_backorder: backorder, kits_included: true,
      delivery: {
        recipient_name: form.recipient_name, phone: form.phone, address_line1: form.address_line1, address_line2: form.address_line2,
        suburb: form.suburb, city: form.city, province: form.province, postal_code: form.postal_code,
      },
    });
    setBusy(null);
    if (!r.ok) {
      const d = r.data as any;
      if (r.error === "invalid_delivery" && d?.field && DELIVERY_ERRORS[d.field]) { setMsg(DELIVERY_ERRORS[d.field]); return; }
      setMsg(ERRORS[r.error] ?? r.message);
      return;
    }
    setMsg(`Created ${learners} codes${r.data.waiting_for_restock ? ". The kits are waiting for restock" : " and took the kits off stock"}. Use Export or Print codes to hand them out.`);
    setForm(EMPTY); setBackorder(false); setQuote(null);
    void load();
  };

  const exportBatch = async (b: Batch, mode: "csv" | "print") => {
    setBusy(b.id);
    const r = await call<{ csv: string; filename: string; codes: string[]; name: string }>({ action: "export_batch", batch_id: b.id });
    setBusy(null);
    if (!r.ok) { setError(r.message); return; }
    if (mode === "csv") downloadCsv(r.data.filename, r.data.csv);
    else printCodeSheet(r.data.name, r.data.codes);
  };

  const disable = async (b: Batch) => {
    if (!window.confirm(`Disable "${b.name}"? Codes that were not used yet will stop working straight away. Families who already used a code keep their pass.`)) return;
    setBusy(b.id);
    const r = await call({ action: "disable_batch", batch_id: b.id });
    setBusy(null);
    if (!r.ok) { setError(r.message); return; }
    void load();
  };

  const formOk = form.name && learners > 0 && (!overrideCents || form.override_reason.trim().length >= 3) && (short === 0 || backorder);

  return (
    <div className="space-y-6">
      <form onSubmit={create} className={cardCls}>
        <h3 className={h3Cls}>Create codes for a school, church or club</h3>
        <p className="font-body text-sm text-charcoal/70 mb-3">One code per learner. Each code unlocks every lesson for the family that uses it. The organisation receives all its Armour Kits in one parcel, so codes never add a kit to a family. Invoice the organisation directly.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 font-body text-sm">
          <Labelled label="Batch name"><input className={field} required value={form.name} onChange={set("name")} placeholder="St Mark's Grade 4" /></Labelled>
          <Labelled label="Organisation"><input className={field} value={form.organisation} onChange={set("organisation")} placeholder="School, church or club" /></Labelled>
          <Labelled label="Contact name"><input className={field} value={form.contact_name} onChange={set("contact_name")} /></Labelled>
          <Labelled label="Contact email"><input type="email" className={field} value={form.contact_email} onChange={set("contact_email")} /></Labelled>
          <Labelled label="Contact phone"><input className={field} value={form.contact_phone} onChange={set("contact_phone")} /></Labelled>
          <Labelled label="Number of learners (1 to 2000)"><input className={field} required inputMode="numeric" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value.replace(/[^\d]/g, "") })} /></Labelled>
          <Labelled label="Payment reference"><input className={field} value={form.payment_reference} onChange={set("payment_reference")} placeholder="Invoice number" /></Labelled>
          <Labelled label="Codes expire (optional)"><input type="date" className={field} value={form.expires_at} onChange={set("expires_at")} /></Labelled>
        </div>

        <div className="mt-4 rounded-xl border border-primary/15 p-4 font-body text-sm text-charcoal space-y-3">
          <p>
            Price per learner from the group tiers: <strong>{quote?.per_learner_cents ? rands(quote.per_learner_cents) : learners > 0 ? "no tier covers this number" : "-"}</strong>.
            {total !== null && <> Total: <strong>{rands(total)}</strong>{overrideCents ? " (changed price)" : ""}.</>}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Labelled label="Change the price per learner (R, optional)"><input className={field} inputMode="decimal" value={form.override} onChange={(e) => setForm({ ...form, override: e.target.value.replace(/[^\d.,]/g, "") })} /></Labelled>
            <Labelled label="Reason for the change"><input className={field} value={form.override_reason} onChange={set("override_reason")} disabled={!form.override.trim()} /></Labelled>
          </div>
        </div>

        <h4 className="font-display uppercase text-xs tracking-widest text-charcoal/60 mt-5 mb-2">Kit delivery address</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 font-body text-sm">
          <Labelled label="Receiver"><input className={field} value={form.recipient_name} onChange={set("recipient_name")} /></Labelled>
          <Labelled label="Phone"><input className={field} value={form.phone} onChange={set("phone")} /></Labelled>
          <Labelled label="Street address"><input className={field} value={form.address_line1} onChange={set("address_line1")} /></Labelled>
          <Labelled label="Building or unit (optional)"><input className={field} value={form.address_line2} onChange={set("address_line2")} /></Labelled>
          <Labelled label="Suburb"><input className={field} value={form.suburb} onChange={set("suburb")} /></Labelled>
          <Labelled label="City or town"><input className={field} value={form.city} onChange={set("city")} /></Labelled>
          <Labelled label="Province">
            <select className={field} value={form.province} onChange={set("province")}>
              <option value="">Choose</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Labelled>
          <Labelled label="Postal code"><input className={field} inputMode="numeric" maxLength={4} value={form.postal_code} onChange={set("postal_code")} /></Labelled>
          <div className="sm:col-span-2 lg:col-span-4">
            <Labelled label="Notes (optional)"><textarea className={`${field} py-2 min-h-20`} value={form.notes} onChange={set("notes")} /></Labelled>
          </div>
        </div>

        {short > 0 && (
          <div className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 font-body text-sm text-charcoal space-y-2">
            <p>Only {quote?.kits_in_stock ?? 0} Armour Kits are in stock, so this order is <strong>{short} short</strong>.</p>
            <label className="flex items-center gap-2 min-h-11">
              <input type="checkbox" className="w-4 h-4" checked={backorder} onChange={(e) => setBackorder(e.target.checked)} />
              Kits will ship after restock
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
          <button type="submit" className={pillPrimary} disabled={busy === "create" || !formOk}>{busy === "create" ? "Creating..." : "Create codes"}</button>
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
            <table className="w-full text-sm font-body min-w-[820px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-charcoal/60 font-display">
                  <th className="py-2 pr-3">Batch</th><th className="py-2 pr-3">Created</th><th className="py-2 pr-3 text-right">Used</th>
                  <th className="py-2 pr-3">Price</th><th className="py-2 pr-3">Kits</th><th className="py-2 pr-3">Expires</th><th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-t border-primary/10 align-top">
                    <td className="py-2 pr-3">
                      <span className="text-charcoal font-medium">{b.name}</span>
                      {b.organisation && <span className="block text-xs text-charcoal/60">{b.organisation}</span>}
                      {b.contact_email && <span className="block text-xs text-charcoal/60 break-all">{b.contact_name ? `${b.contact_name}, ` : ""}{b.contact_email}</span>}
                      {!b.active && <span className="inline-block mt-1 rounded-full bg-muted px-3 py-0.5 font-display text-[11px] uppercase tracking-widest text-charcoal">Disabled</span>}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-charcoal/70">{fmtDate(b.created_at)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{b.seats_used} of {b.seats}</td>
                    <td className="py-2 pr-3 text-charcoal/70">
                      {b.amount_cents !== null ? rands(b.amount_cents) : "-"}
                      {b.payment_reference && <span className="block text-xs">Ref {b.payment_reference}</span>}
                    </td>
                    <td className="py-2 pr-3 text-charcoal/70">
                      {b.shipment ? (b.shipment.waiting_for_restock ? "Waiting for restock" : SHIP_LABEL[b.shipment.status] ?? b.shipment.status) : "No kits"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-charcoal/70">{b.expires_at ? fmtDate(b.expires_at) : "Never"}</td>
                    <td className="py-2 text-right whitespace-nowrap space-x-2">
                      <button type="button" className={pillOutline} disabled={busy === b.id} onClick={() => exportBatch(b, "csv")}>Export CSV</button>
                      <button type="button" className={pillOutline} disabled={busy === b.id} onClick={() => exportBatch(b, "print")}>Print codes</button>
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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

/** Opens a printable sheet: 10 codes per page, the site address and instructions. No personal details. */
function printCodeSheet(name: string, codes: string[]) {
  const w = window.open("", "_blank");
  if (!w) return;
  const pages = codeSheetPages(codes, 10).map((page) => `
    <section class="page">
      <h1>Kiki Warrior</h1>
      <p class="batch">${esc(name)}</p>
      ${page.map((c) => `<div class="slip"><span class="code">${esc(c)}</span><span>kikiwarrior.com</span><span>Ask a grown-up to enter this code in the parent area.</span></div>`).join("")}
    </section>`).join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kiki Warrior codes</title><style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: Arial, sans-serif; color: #2b3440; margin: 0; }
    .page { page-break-after: always; }
    h1 { font-size: 18pt; margin: 0 0 2mm; text-transform: uppercase; letter-spacing: 1px; }
    .batch { margin: 0 0 6mm; font-size: 10pt; color: #636b75; }
    .slip { border: 1px dashed #c9a27a; border-radius: 4mm; padding: 4mm 5mm; margin-bottom: 3mm; display: flex; flex-direction: column; gap: 1mm; font-size: 10pt; }
    .code { font-family: "Courier New", monospace; font-size: 18pt; font-weight: bold; letter-spacing: 2px; }
  </style></head><body>${pages || "<p>No unused codes left in this batch.</p>"}<script>window.onload = () => window.print();<\/script></body></html>`);
  w.document.close();
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-charcoal">
      <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">{label}</span>
      {children}
    </label>
  );
}
