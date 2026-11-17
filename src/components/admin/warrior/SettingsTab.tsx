import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { courseData } from "@/data/courseData";
import { cardCls, downloadCsv, field, fmtDateTime, h3Cls, pillDanger, pillOutline, pillPrimary, useAdminOrders } from "./adminOrdersApi";

type Settings = {
  paywall_enabled: boolean;
  grandfather_before: string | null;
  gate_lessons: { young?: string; teen?: string } | null;
  always_free_lessons: string[];
  prices: Record<string, any> | null;
  library_book_path: string | null;
  receipt_business_name: string;
  support_email: string | null;
  kits_in_stock: number | null;
  pendant_sets_in_stock: number | null;
  maintenance_mode: boolean;
};

type TierRow = { min: string; max: string; price: string };
const LOW_STOCK = 10;
const BOOK_MAX_BYTES = 50 * 1024 * 1024;

const STREAMS = [
  { key: "young" as const, id: "6-9", label: "Ages 6 to 9" },
  { key: "teen" as const, id: "10-13", label: "Ages 10 to 13" },
];
export const GATE_WARNING = "This changes what every unpaid family can open, straight away. Lessons a child has already finished stay open.";

const toRands = (cents: unknown) => (typeof cents === "number" ? String(cents / 100) : "");
const toCents = (r: string): number | null => {
  const t = r.trim().replace(/^R/i, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};
const longDate = (d: string) => new Date(d).toLocaleString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

const FIELD_LABEL: Record<string, string> = {
  "gate_lessons.young": "Choose a gate lesson for ages 6 to 9.",
  "gate_lessons.teen": "Choose a gate lesson for ages 10 to 13.",
  always_free_lessons: "One of the always-free lessons is not a real lesson.",
  "prices.family_pass_cents": "The Warrior Pass price must be more than R0.",
  "prices.launch_family_pass_cents": "The Founding Family price must be more than R0.",
  "prices.kit_cents": "The Armour Kit price must be more than R0.",
  "prices.extra_kit_cents": "The Armour Kit price must be more than R0.",
  "prices.delivery_locker_cents": "The locker delivery fee must be more than R0, or left empty.",
  "prices.delivery_door_cents": "The door delivery fee must be more than R0, or left empty.",
  "prices.org_tiers": "Organisation tiers must start at 1 learner, follow on without gaps, and only the last one may have no maximum.",
  kits_in_stock: "Armour Kits in stock must be a whole number, 0 or more.",
  pendant_sets_in_stock: "Pendant sets in stock must be a whole number, 0 or more.",
  receipt_business_name: "The business name must be 2 to 80 characters.",
  support_email: "The support email does not look like an email address.",
  "prices.book_cents": "The book price must be more than R0, or left empty.",
  "prices.launch_limit": "The number of Founding Family places must be 0 or more.",
  library_book_path: "The book file path can only use letters, numbers, dots, dashes, spaces and slashes.",
};

export default function SettingsTab() {
  const { call, ready } = useAdminOrders();
  const [loaded, setLoaded] = useState<Settings | null>(null);
  const [paid, setPaid] = useState(0);
  const [signups, setSignups] = useState(0);
  const [error, setError] = useState("");
  const [gate, setGate] = useState({ young: "", teen: "" });
  const [free, setFree] = useState<string[]>([]);
  const [price, setPrice] = useState({ family: "", launch: "", kit: "", book: "", limit: "", locker: "", door: "" });
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [stock, setStock] = useState({ kits: "", pendants: "" });
  const [business, setBusiness] = useState("");
  const [support, setSupport] = useState("");
  const [bookPath, setBookPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmGate, setConfirmGate] = useState(false);

  const load = useCallback(async () => {
    const r = await call<{ settings: Settings; paid_family_passes: number; maintenance_signups: number }>({ action: "get_settings" });
    if (!r.ok) { setError(r.message); return; }
    setError("");
    const s = r.data.settings;
    setLoaded(s);
    setPaid(r.data.paid_family_passes);
    setSignups(r.data.maintenance_signups ?? 0);
    setGate({ young: s.gate_lessons?.young ?? "", teen: s.gate_lessons?.teen ?? "" });
    setFree(Array.isArray(s.always_free_lessons) ? s.always_free_lessons : []);
    const p = s.prices ?? {};
    setPrice({
      family: toRands(p.family_pass_cents), launch: toRands(p.launch_family_pass_cents), kit: toRands(p.kit_cents ?? p.extra_kit_cents),
      book: toRands(p.book_cents), limit: typeof p.launch_limit === "number" ? String(p.launch_limit) : "",
      locker: toRands(p.delivery_locker_cents), door: toRands(p.delivery_door_cents),
    });
    setTiers(Array.isArray(p.org_tiers) ? p.org_tiers.map((t: any) => ({
      min: typeof t?.min === "number" ? String(t.min) : "", max: typeof t?.max === "number" ? String(t.max) : "", price: toRands(t?.cents),
    })) : []);
    setStock({ kits: s.kits_in_stock === null ? "" : String(s.kits_in_stock), pendants: s.pendant_sets_in_stock === null ? "" : String(s.pendant_sets_in_stock) });
    setBusiness(s.receipt_business_name ?? "");
    setSupport(s.support_email ?? "");
    setBookPath(s.library_book_path ?? "");
  }, [call]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const gateChanged = !!loaded && (gate.young !== (loaded.gate_lessons?.young ?? "") || gate.teen !== (loaded.gate_lessons?.teen ?? ""));
  const limitNum = Number(price.limit);

  const stockNum = (v: string) => (v.trim() === "" ? NaN : Number(v));
  const save = async () => {
    setConfirmGate(false);
    setSaving(true); setSaveMsg("");
    const settings: Record<string, unknown> = {
      gate_lessons: gate,
      always_free_lessons: free,
      prices: {
        family_pass_cents: toCents(price.family), launch_family_pass_cents: toCents(price.launch), kit_cents: toCents(price.kit),
        book_cents: toCents(price.book), launch_limit: price.limit.trim() === "" ? NaN : limitNum, currency: "ZAR",
        delivery_locker_cents: toCents(price.locker), delivery_door_cents: toCents(price.door),
        org_tiers: tiers.map((t) => ({ min: Number(t.min), max: t.max.trim() === "" ? null : Number(t.max), cents: toCents(t.price) })),
      },
      library_book_path: bookPath.trim() || null,
      receipt_business_name: business.trim(),
      support_email: support.trim() || null,
    };
    // Stock is sent only when changed here, so kits sold since this page loaded are never put back.
    if (stock.kits !== (loaded?.kits_in_stock === null ? "" : String(loaded?.kits_in_stock))) settings.kits_in_stock = stockNum(stock.kits);
    if (stock.pendants !== (loaded?.pendant_sets_in_stock === null ? "" : String(loaded?.pendant_sets_in_stock))) settings.pendant_sets_in_stock = stockNum(stock.pendants);
    const r = await call<{ changed: string[] }>({ action: "update_settings", settings });
    setSaving(false);
    if (!r.ok) { setSaveMsg(FIELD_LABEL[(r.data as any)?.field] ?? r.message); return; }
    setSaveMsg(r.data.changed.length ? "Saved." : "Nothing changed.");
    void load();
  };

  if (error) return <p className="font-body text-sm text-destructive">{error}</p>;
  if (!loaded) return <p className="font-body text-sm text-charcoal/70">Loading settings...</p>;

  return (
    <div className="space-y-6">
      <MasterSwitch settings={loaded} onChanged={load} />
      <YocoConnect />
      <MaintenanceSwitch on={loaded.maintenance_mode} signups={signups} onChanged={load} />

      <div className={`${cardCls} flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="flex-1 font-body text-sm text-charcoal/80">
          <p className="font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">Founding Family</p>
          <p><span className="text-2xl font-bold text-charcoal">{paid}</span> of {Number.isFinite(limitNum) ? limitNum : "?"} Founding Family places taken</p>
        </div>
        <a href="/course?previewPaywall=1" target="_blank" rel="noopener noreferrer" className={`${pillOutline} inline-flex items-center justify-center gap-2`}>
          Preview the course as a new family <ExternalLink size={14} />
        </a>
      </div>
      <p className="font-body text-xs text-charcoal/60 -mt-4">The preview needs you to be signed in to Kiki Warrior with an admin account in the same browser.</p>

      <div className={cardCls}>
        <h3 className={h3Cls}>Gate lesson</h3>
        <p className="font-body text-sm text-charcoal/70 mb-3">Unpaid families can open lessons up to and including this one. Everything after it needs the Warrior Pass.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {STREAMS.map((s) => {
            const stream = courseData.find((c) => c.id === s.id);
            return (
              <label key={s.key} className="font-body text-sm text-charcoal">
                <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">{s.label}</span>
                <select className={field} value={gate[s.key]} onChange={(e) => setGate({ ...gate, [s.key]: e.target.value })}>
                  {!gate[s.key] && <option value="">Choose a lesson</option>}
                  {stream?.modules.map((m, mi) => (
                    <optgroup key={m.id} label={`Module ${mi + 1}: ${m.title}`}>
                      {m.lessons.map((l, li) => <option key={l.id} value={l.id}>M{mi + 1} L{li + 1}: {l.title}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        {gateChanged && <p className="font-body text-sm text-destructive mt-3">{GATE_WARNING}</p>}
      </div>

      <div className={cardCls}>
        <h3 className={h3Cls}>Always-free lessons</h3>
        <p className="font-body text-sm text-charcoal/70 mb-3">Ticked lessons stay open for every family, even after the gate.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {STREAMS.map((s) => {
            const stream = courseData.find((c) => c.id === s.id);
            return (
              <div key={s.key}>
                <p className="font-display uppercase text-xs tracking-widest text-charcoal/60 mb-2">{s.label}</p>
                {stream?.modules.map((m, mi) => (
                  <div key={m.id} className="mb-3">
                    <p className="font-body text-xs text-charcoal/60 mb-1">Module {mi + 1}: {m.title}</p>
                    {m.lessons.map((l, li) => (
                      <label key={l.id} className="flex items-center gap-2 font-body text-sm text-charcoal min-h-9">
                        <input type="checkbox" className="w-4 h-4" checked={free.includes(l.id)}
                          onChange={(e) => setFree(e.target.checked ? [...free, l.id] : free.filter((x) => x !== l.id))} />
                        L{li + 1}: {l.title}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className={cardCls}>
        <h3 className={h3Cls}>Prices and book</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 font-body text-sm text-charcoal">
          <PriceField label="Family Warrior Pass (R)" value={price.family} onChange={(v) => setPrice({ ...price, family: v })} />
          <PriceField label="Founding Family price (R)" value={price.launch} onChange={(v) => setPrice({ ...price, launch: v })} />
          <label>
            <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">Founding Family places</span>
            <input className={field} inputMode="numeric" value={price.limit} onChange={(e) => setPrice({ ...price, limit: e.target.value.replace(/[^\d]/g, "") })} />
          </label>
          <PriceField label="Armour Kit, per child (R)" value={price.kit} onChange={(v) => setPrice({ ...price, kit: v })} />
          <PriceField label="Locker delivery per parcel (R), placeholder, confirm" value={price.locker} onChange={(v) => setPrice({ ...price, locker: v })} />
          <PriceField label="Door delivery per parcel (R), placeholder, confirm" value={price.door} onChange={(v) => setPrice({ ...price, door: v })} />
          <PriceField label="Book price (R), empty means coming soon" value={price.book} onChange={(v) => setPrice({ ...price, book: v })} />
        </div>
        <p className="font-body text-xs text-charcoal/60 mt-3">The Warrior Pass covers lessons only. Armour Kits are bought per child, plus one delivery fee per order. Delivery fees are placeholders until Courier Guy live rates are added.</p>

        <h4 className="font-display uppercase text-xs tracking-widest text-charcoal/60 mt-6 mb-2">Organisation price per learner (kit included, delivery extra)</h4>
        <div className="space-y-2">
          {tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end font-body text-sm">
              <label><span className="block text-xs text-charcoal/60 mb-1">From learners</span>
                <input className={field} inputMode="numeric" value={t.min} onChange={(e) => setTiers(tiers.map((x, j) => j === i ? { ...x, min: e.target.value.replace(/[^\d]/g, "") } : x))} /></label>
              <label><span className="block text-xs text-charcoal/60 mb-1">To learners (empty = no limit)</span>
                <input className={field} inputMode="numeric" value={t.max} onChange={(e) => setTiers(tiers.map((x, j) => j === i ? { ...x, max: e.target.value.replace(/[^\d]/g, "") } : x))} /></label>
              <label><span className="block text-xs text-charcoal/60 mb-1">Price per learner (R)</span>
                <input className={field} inputMode="decimal" value={t.price} onChange={(e) => setTiers(tiers.map((x, j) => j === i ? { ...x, price: e.target.value.replace(/[^\d.,]/g, "") } : x))} /></label>
              <button type="button" className={pillOutline} onClick={() => setTiers(tiers.filter((_, j) => j !== i))} aria-label={`Remove tier ${i + 1}`}>Remove</button>
            </div>
          ))}
          <button type="button" className={pillOutline} onClick={() => setTiers([...tiers, { min: "", max: "", price: "" }])}>Add a tier</button>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className={h3Cls}>Stock</h3>
        <div className="grid sm:grid-cols-2 gap-3 font-body text-sm text-charcoal">
          <StockField label="Armour Kits in stock" value={stock.kits} onChange={(v) => setStock({ ...stock, kits: v })} />
          <StockField label="Bonus pendant sets in stock" value={stock.pendants} onChange={(v) => setStock({ ...stock, pendants: v })} />
        </div>
        <p className="font-body text-xs text-charcoal/60 mt-3">Kits come off stock automatically when an order is paid. When there are not enough kits, parents see that kits are sold out, but can still buy the Warrior Pass.</p>
      </div>

      <div className={cardCls}>
        <h3 className={h3Cls}>Receipts</h3>
        <div className="grid sm:grid-cols-2 gap-3 font-body text-sm text-charcoal">
          <label>
            <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">Business name on receipts</span>
            <input className={field} value={business} maxLength={80} onChange={(e) => setBusiness(e.target.value)} />
          </label>
          <label>
            <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">Support email for parent replies (optional)</span>
            <input type="email" className={field} placeholder="Leave empty to use the default" value={support} onChange={(e) => setSupport(e.target.value)} />
          </label>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className={h3Cls}>Family library book</h3>
        <label className="block font-body text-sm text-charcoal">
          <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">Book file path</span>
          <input className={field} placeholder="books/kikis-armour-of-god.pdf" value={bookPath} onChange={(e) => setBookPath(e.target.value)} />
        </label>
        <BookUpload onUploaded={load} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button type="button" className={pillPrimary} disabled={saving} onClick={() => (gateChanged ? setConfirmGate(true) : void save())}>
          {saving ? "Saving..." : "Save settings"}
        </button>
        {saveMsg && <p className="font-body text-sm text-charcoal/80">{saveMsg}</p>}
      </div>

      <AlertDialog open={confirmGate} onOpenChange={setConfirmGate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-wider">Change the gate lesson?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">{GATE_WARNING}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void save()}>Save the new gate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StockField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const n = value.trim() === "" ? null : Number(value);
  return (
    <label>
      <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">{label}</span>
      <input className={field} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} />
      {n !== null && n <= LOW_STOCK && (
        <span className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertTriangle size={14} />Low stock: {n} left.</span>
      )}
    </label>
  );
}

/** Uploads the paid book PDF straight to the private library storage with a one-time link, then saves its path. */
function BookUpload({ onUploaded }: { onUploaded: () => void }) {
  const { call } = useAdminOrders();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const upload = async (file: File) => {
    setMsg("");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) { setMsg("Please choose a PDF file."); return; }
    if (file.size > BOOK_MAX_BYTES) { setMsg("The PDF must be 50 MB or less."); return; }
    setBusy(true);
    const link = await call<{ path: string; token: string }>({ action: "book_upload_url" });
    if (!link.ok) { setBusy(false); setMsg(link.message); return; }
    const { error } = await supabase.storage.from("family-library")
      .uploadToSignedUrl(link.data.path, link.data.token, file, { contentType: "application/pdf" });
    if (error) { setBusy(false); setMsg("The upload did not finish. Please try again."); return; }
    const done = await call<{ library_book_path: string }>({ action: "book_upload_complete", path: link.data.path });
    setBusy(false);
    if (!done.ok) { setMsg(done.message); return; }
    setMsg("Book uploaded. Families who own it now download this file.");
    onUploaded();
  };
  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <label className={`${pillOutline} inline-flex items-center justify-center gap-2 cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
        <Upload size={14} /> {busy ? "Uploading..." : "Upload book PDF"}
        <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      </label>
      <p className="font-body text-xs text-charcoal/60">PDF only, up to 50 MB. It is stored privately and only reaches families through a short download link.</p>
      {msg && <p className="font-body text-sm text-charcoal/80">{msg}</p>}
    </div>
  );
}

function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">{label}</span>
      <input className={field} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))} />
    </label>
  );
}

function MasterSwitch({ settings, onChanged }: { settings: Settings; onChanged: () => void }) {
  const { call } = useAdminOrders();
  const on = settings.paywall_enabled;
  const phrase = on ? "TURN OFF" : "TURN ON";
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const protectedFrom = useMemo(() => (settings.grandfather_before ? longDate(settings.grandfather_before) : null), [settings.grandfather_before]);

  const flip = async () => {
    setBusy(true); setMsg("");
    const r = await call({ action: "set_paywall", enabled: !on, confirm: typed.trim() });
    setBusy(false);
    if (!r.ok) { setMsg(r.message); return; }
    setTyped("");
    onChanged();
  };

  return (
    <div className={`${cardCls} space-y-3`}>
      <div className="flex items-center gap-3">
        <h3 className={`${h3Cls} mb-0 flex-1`}>Warrior Pass master switch</h3>
        <span className={`rounded-full px-3 py-1 font-display text-[11px] uppercase tracking-widest text-charcoal ${on ? "bg-primary/25" : "bg-muted"}`}>{on ? "On" : "Off"}</span>
      </div>
      <div className="font-body text-sm text-charcoal/80 space-y-2">
        {on ? (
          <p>The Warrior Pass is live. New families can open lessons up to the gate lesson, then a grown-up can unlock the rest. Turning it off opens every lesson for everyone again straight away. Prices and buttons disappear for families.</p>
        ) : (
          <p>The Warrior Pass is off. Every family can open every lesson and sees no prices or payment buttons. Turning it on starts the gate for new families straight away.</p>
        )}
        {protectedFrom ? (
          <p>Families who created their account before <span className="font-bold text-charcoal">{protectedFrom}</span> keep full access forever. This date never changes.</p>
        ) : (
          <p>When you turn it on, the current date and time are saved, and every family that already has an account keeps full access forever.</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className={`${field} sm:max-w-xs`} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`Type ${phrase}`} aria-label={`Type ${phrase} to confirm`} />
        <button type="button" className={on ? pillOutline : pillDanger} disabled={busy || typed.trim() !== phrase} onClick={flip}>
          {busy ? "Saving..." : on ? "Turn the Warrior Pass off" : "Turn the Warrior Pass on"}
        </button>
      </div>
      {settings.grandfather_before && <p className="font-body text-xs text-charcoal/50">Cut-off saved {fmtDateTime(settings.grandfather_before)}</p>}
      {msg && <p className="font-body text-sm text-destructive">{msg}</p>}
    </div>
  );
}

/** "We are upgrading" page switch, with the sign-up count and export. */
function MaintenanceSwitch({ on, signups, onChanged }: { on: boolean; signups: number; onChanged: () => void }) {
  const { call } = useAdminOrders();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const flip = async () => {
    setConfirm(false); setBusy(true); setMsg("");
    const r = await call({ action: "set_maintenance", enabled: !on, confirm: true });
    setBusy(false);
    if (!r.ok) { setMsg(r.message); return; }
    onChanged();
  };
  const exportCsv = async () => {
    const r = await call<{ csv: string; filename: string }>({ action: "export_maintenance_signups" });
    if (!r.ok) { setMsg(r.message); return; }
    downloadCsv(r.data.filename, r.data.csv);
  };
  return (
    <div className={`${cardCls} space-y-3`}>
      <div className="flex items-center gap-3">
        <h3 className={`${h3Cls} mb-0 flex-1`}>"We are upgrading" page</h3>
        <span className={`rounded-full px-3 py-1 font-display text-[11px] uppercase tracking-widest text-charcoal ${on ? "bg-primary/25" : "bg-muted"}`}>{on ? "On" : "Off"}</span>
      </div>
      <p className="font-body text-sm text-charcoal/80">
        {on
          ? "Every visitor who is not an admin sees the upgrade page and can leave their email. Sign-in and the admin dashboard still work. Admins browse the full site."
          : "When on, every visitor who is not an admin sees a friendly upgrade page instead of the site, including signed-in families. Sign-in and the admin dashboard stay reachable."}
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button type="button" className={on ? pillOutline : pillDanger} disabled={busy} onClick={() => setConfirm(true)}>
          {busy ? "Saving..." : on ? "Turn the upgrade page off" : "Turn the upgrade page on"}
        </button>
        <p className="font-body text-sm text-charcoal/70 flex-1">{signups} email{signups === 1 ? "" : "s"} left on the upgrade page</p>
        <button type="button" className={pillOutline} disabled={signups === 0} onClick={exportCsv}>Export emails</button>
      </div>
      {msg && <p className="font-body text-sm text-destructive">{msg}</p>}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-wider">{on ? "Turn the upgrade page off?" : "Turn the upgrade page on?"}</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {on ? "Everyone will see the normal site again within a minute." : "Families will see the upgrade page instead of the site within a minute, until you turn it off."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void flip()}>{on ? "Turn off" : "Turn on"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Yoco connection status and webhook registration. Never shows a key or secret. */
function YocoConnect() {
  const { call, ready } = useAdminOrders();
  const [status, setStatus] = useState<{ key_set: boolean; key_mode: "test" | "live" | null; webhook_registered: boolean; webhook_source: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const r = await call<typeof status>({ action: "yoco_status" });
    if (r.ok) setStatus(r.data);
  }, [call]);
  useEffect(() => { if (ready) void load(); }, [ready, load]);
  const connect = async () => {
    setBusy(true); setMsg("");
    const r = await call<{ already: boolean; message?: string }>({ action: "register_yoco_webhook" });
    setBusy(false);
    if (!r.ok) { setMsg(r.message); return; }
    setMsg(r.data.message ?? (r.data.already ? "Yoco payments were already connected." : "Yoco payments connected."));
    void load();
  };
  return (
    <div className={`${cardCls} space-y-3`}>
      <h3 className={`${h3Cls} mb-0`}>Yoco payments</h3>
      <div className="grid sm:grid-cols-2 gap-2 font-body text-sm text-charcoal/80">
        <p>Secret key: <strong className="text-charcoal">{!status ? "Checking..." : !status.key_set ? "Not added yet" : status.key_mode === "live" ? "Live" : status.key_mode === "test" ? "Test" : "Unknown format"}</strong></p>
        <p>Webhook registered: <strong className="text-charcoal">{!status ? "Checking..." : status.webhook_registered ? "Yes" : "No"}</strong></p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button type="button" className={pillPrimary} disabled={busy || !status?.key_set} onClick={connect}>{busy ? "Connecting..." : "Connect Yoco payments"}</button>
        {!status?.key_set && status && <p className="font-body text-xs text-charcoal/60">Add the Yoco secret key to the project secrets first.</p>}
      </div>
      {msg && <p className="font-body text-sm text-charcoal/80">{msg}</p>}
    </div>
  );
}
