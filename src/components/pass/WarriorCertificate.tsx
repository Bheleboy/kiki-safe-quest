import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { supabase } from "@/integrations/supabase/client";

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  body > *:not(.kw-cert-portal) { display: none !important; }
  .kw-cert-portal { position: static !important; overflow: visible !important; padding: 0 !important; background: none !important; }
  .kw-cert-toolbar { display: none !important; }
  .kw-cert { width: 297mm !important; height: 210mm !important; max-width: none !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
  .kw-cert, .kw-cert * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** "Ages 6–9" becomes "Ages 6 to 9" so the certificate carries no dashes. */
export function certificateStreamName(label: string): string {
  return `Internet Safety, ${label.replace(/\s*[\u2013\u2014-]\s*/g, " to ")}`;
}

interface Props {
  learnerName: string;
  streamLabel: string;
  userId: string;
  childId: string | null;
  lessonIds: string[];
}

/** Print button plus a print-friendly A4 landscape certificate. Uses only local fonts and inline icons. */
export function WarriorCertificateButton({ learnerName, streamLabel, userId, childId, lessonIds }: Props) {
  const [open, setOpen] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);

  const lessonKey = lessonIds.join(",");
  useEffect(() => {
    if (!open) return;
    const ids = lessonKey.split(",").filter(Boolean);
    let cancelled = false;
    (async () => {
      try {
        let q = supabase.from("progress").select("completed_at").eq("user_id", userId).in("lesson_id", ids);
        q = childId ? q.eq("child_id", childId) : q.is("child_id", null);
        const { data } = await q.order("completed_at", { ascending: false }).limit(1);
        if (!cancelled && data?.[0]?.completed_at) setCompletedAt(new Date(data[0].completed_at));
      } catch { /* fall back to today */ }
    })();
    return () => { cancelled = true; };
  }, [open, userId, childId, lessonKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const date = (completedAt ?? new Date()).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print my certificate
      </Button>
      {open && createPortal(
        <div className="kw-cert-portal fixed inset-0 z-[100] overflow-auto bg-cream p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Certificate">
          <style>{PRINT_CSS}</style>
          <div className="kw-cert-toolbar mx-auto mb-4 flex max-w-5xl justify-end gap-2">
            <Button variant="ghost" onClick={() => window.print()} className="btn-copper adventure-button px-5 py-2 text-sm uppercase tracking-widest">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} className="touch-target p-2" aria-label="Close">
              <X className="w-6 h-6 text-charcoal" />
            </Button>
          </div>
          <div className="kw-cert mx-auto aspect-[297/210] w-full max-w-5xl rounded-2xl bg-card p-[3%]">
            <div className="flex h-full flex-col items-center justify-between rounded-xl border-4 border-double border-primary p-[4%] text-center">
              <div className="flex items-center gap-3">
                <ShieldIcon size={40} className="stroke-primary" />
                <span className="font-display text-2xl font-bold uppercase tracking-wider text-charcoal">
                  Kiki<span className="text-primary">Warrior</span>
                </span>
              </div>
              <div className="space-y-3">
                <p className="font-display text-xs uppercase tracking-[0.4em] text-charcoal/70 md:text-sm">Certificate of completion</p>
                <p className="font-body text-sm text-charcoal/70 md:text-base">This certifies that</p>
                <p className="font-display text-4xl font-bold uppercase tracking-wide text-charcoal md:text-6xl">{learnerName}</p>
                <p className="font-body text-sm text-charcoal/70 md:text-base">has completed every lesson of</p>
                <p className="font-display text-xl font-bold uppercase tracking-wide text-primary md:text-3xl">{certificateStreamName(streamLabel)}</p>
                <p className="font-body text-sm text-charcoal/70 md:text-base">and is a true Kiki Warrior</p>
              </div>
              <div className="flex w-full items-end justify-between gap-6 font-body text-xs text-charcoal/70 md:text-sm">
                <div className="flex-1 border-t border-charcoal/30 pt-2">Completed on {date}</div>
                <div className="flex-1 border-t border-charcoal/30 pt-2">The Kiki Warrior team</div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
