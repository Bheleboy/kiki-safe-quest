import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePreviewPaywall } from "@/lib/previewPaywall";

/** Slim bar shown only to a signed-in admin while the Warrior Pass preview is on. */
export function PreviewBanner() {
  const { user, profile } = useAuth();
  const isAdmin = !!user && profile?.is_admin === true;
  const { preview, exitPreview } = usePreviewPaywall(isAdmin);
  if (!isAdmin || !preview) return null;
  return (
    <div role="status" className="relative z-[60] w-full bg-charcoal text-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5">
        <p className="font-display text-[11px] uppercase tracking-wider">Preview: you are seeing the site as a new family</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={exitPreview}
          className="h-8 shrink-0 rounded-full border border-cream/40 px-3 font-display text-[11px] uppercase tracking-wider text-cream hover:bg-cream/10 hover:text-cream"
        >
          Exit preview
        </Button>
      </div>
    </div>
  );
}
