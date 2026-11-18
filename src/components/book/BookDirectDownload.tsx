import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/editorial";
import { useAuth } from "@/hooks/useAuth";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { supabase } from "@/integrations/supabase/client";
import { formatRand } from "@/lib/warriorPass";
import { saveAuthReturn } from "@/lib/authReturn";

/** The family library purchase on /parent opens its parent PIN prompt for this hash. */
export const FAMILY_LIBRARY_BUY_PATH = "/parent#family-library-buy";

export interface BookDirectOption { visible: boolean; owned: boolean; bookCents: number | null }

/**
 * Whether the direct printable PDF option shows on the public book page: only when the
 * Warrior Pass is live (public switch, readable signed out, or the signed-in access check)
 * or an admin is previewing, and the book has a price.
 */
export function useBookDirectOption(): BookDirectOption {
  const { user, profile } = useAuth();
  const access = useCourseAccess(user?.id, profile?.is_admin);
  const { settings } = usePublicSettings();
  const [owned, setOwned] = useState(false);

  const bookCents = settings?.prices?.book_cents;
  const live = settings?.paywall_enabled === true || access.paywallActive || access.isPreview;
  const visible = live && typeof bookCents === "number" && bookCents > 0;

  useEffect(() => {
    if (!user || !visible) return;
    let cancelled = false;
    supabase.from("entitlements").select("id").eq("user_id", user.id).eq("kind", "book").is("revoked_at", null).maybeSingle()
      .then(({ data, error }) => { if (!cancelled) setOwned(!error && !!data); }, () => { /* treat as not owned */ });
    return () => { cancelled = true; };
  }, [user, visible]);

  return { visible, owned, bookCents: visible ? (bookCents as number) : null };
}

/**
 * Direct printable PDF option. No purchase happens here: the button only leads to the
 * parent area family library, where the parent PIN is asked before any purchase screen.
 */
export function BookDirectDownload({ option }: { option: BookDirectOption }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { visible, owned, bookCents } = option;
  if (!visible || bookCents === null) return null;

  const go = () => (user
    ? navigate(FAMILY_LIBRARY_BUY_PATH)
    : (saveAuthReturn(FAMILY_LIBRARY_BUY_PATH), navigate("/auth", { state: { returnTo: FAMILY_LIBRARY_BUY_PATH } })));

  return (
    <div className="card-kiki space-y-3">
      <Eyebrow>From Kiki Warrior</Eyebrow>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Get the printable PDF from Kiki Warrior</h2>
        {!owned && <p className="font-display text-2xl font-bold text-charcoal shrink-0">{formatRand(bookCents)}</p>}
      </div>
      <p className="font-body text-sm text-charcoal/70 leading-relaxed">
        Instant download. One purchase covers every child in your family. Print the activity pages at home.
      </p>
      <Button variant="ghost" onClick={go} className="w-full touch-target btn-copper adventure-button py-3 text-sm uppercase tracking-widest">
        {owned ? <><Download className="w-4 h-4 mr-2" />Download your copy</> : <><Lock className="w-4 h-4 mr-2" />Buy and download</>}
      </Button>
    </div>
  );
}
