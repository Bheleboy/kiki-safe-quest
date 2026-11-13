import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { courseData } from "@/data/courseData";
import { cardCls, field, fmtDateTime, h3Cls, pillDanger, pillOutline, pillPrimary, useAdminOrders } from "./adminOrdersApi";

type Settings = {
  paywall_enabled: boolean;
  grandfather_before: string | null;
  gate_lessons: { young?: string; teen?: string } | null;
  always_free_lessons: string[];
  prices: Record<string, any> | null;
  library_book_path: string | null;
};

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
  "prices.extra_kit_cents": "The extra Armour Kit price must be more than R0.",
  "prices.book_cents": "The book price must be more than R0, or left empty.",
  "prices.launch_limit": "The number of Founding Family places must be 0 or more.",
  library_book_path: "The book file path can only use letters, numbers, dots, dashes, spaces and slashes.",
};

export default function SettingsTab() {
  const { call, ready } = useAdminOrders();
  const [loaded, setLoaded] = useState<Settings | null>(null);
  const [paid, setPaid] = useState(0);
  const [error, setError] = useState("");
  const [gate, setGate] = useState({ young: "", teen: "" });
  const [free, setFree] = useState<string[]>([]);
  const [price, setPrice] = useState({ family: "", launch: "", kit: "", book: "", limit: "" });
  const [bookPath, setBookPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmGate, setConfirmGate] = useState(false);

  const load = useCallback(async () => {
    const r = await call<{ settings: Settings; paid_family_passes: number }>({ action: "get_settings" });
    if (!r.ok) { setError(r.message); return; }
    setError("");
    const s = r.data.settings;
    setLoaded(s);
    setPaid(r.data.paid_family_passes);
    setGate({ young: s.gate_lessons?.young ?? "", teen: s.gate_lessons?.teen ?? "" });
    setFree(Array.isArray(s.always_free_lessons) ? s.always_free_lessons : []);
    const p = s.prices ?? {};
    setPrice({
      family: toRands(p.family_pass_cents), launch: toRands(p.launch_family_pass_cents), kit: toRands(p.extra_kit_cents),
      book: toRands(p.book_cents), limit: typeof p.launch_limit === "number" ? String(p.launch_limit) : "",
    });
    setBookPath(s.library_book_path ?? "");
  }, [call]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const gateChanged = !!loaded && (gate.young !== (loaded.gate_lessons?.young ?? "") || gate.teen !== (loaded.gate_lessons?.teen ?? ""));
  const limitNum = Number(price.limit);

  const save = async () => {
    setConfirmGate(false);
    setSaving(true); setSaveMsg("");
    const r = await call<{ changed: string[] }>({
      action: "update_settings",
      settings: {
        gate_lessons: gate,
        always_free_lessons: free,
        prices: {
          family_pass_cents: toCents(price.family), launch_family_pass_cents: toCents(price.launch), extra_kit_cents: toCents(price.kit),
          book_cents: toCents(price.book), launch_limit: price.limit.trim() === "" ? NaN : limitNum, currency: "ZAR",
        },
        library_book_path: bookPath.trim() || null,
      },
    });
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
          <PriceField label="Extra Armour Kit (R)" value={price.kit} onChange={(v) => setPrice({ ...price, kit: v })} />
          <PriceField label="Book price (R), empty means coming soon" value={price.book} onChange={(v) => setPrice({ ...price, book: v })} />
          <label>
            <span className="block font-display uppercase text-xs tracking-widest text-charcoal/60 mb-1">Book file path</span>
            <input className={field} placeholder="books/kikis-armour-of-god.pdf" value={bookPath} onChange={(e) => setBookPath(e.target.value)} />
          </label>
        </div>
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
