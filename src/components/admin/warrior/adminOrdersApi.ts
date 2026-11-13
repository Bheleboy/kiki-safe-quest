import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export type AdminResult<T = any> = { ok: boolean; data: T; error: string; message: string };

/** Calls the admin-orders function with the admin dashboard session, returning the server's message on errors. */
export function useAdminOrders() {
  const { adminSession } = useAdminAuth();
  const token = adminSession?.access_token;
  const call = useCallback(async <T = any>(body: Record<string, unknown>): Promise<AdminResult<T>> => {
    if (!token) return { ok: false, data: null as T, error: "no_token", message: "Please sign in to the admin dashboard again." };
    const { data, error } = await supabase.functions.invoke("admin-orders", { body, headers: { "x-admin-token": token } });
    if (!error) return { ok: true, data: data as T, error: "", message: "" };
    let payload: any = null;
    try { payload = await (error as any).context?.json?.(); } catch { /* ignore */ }
    return {
      ok: false,
      error: payload?.error ?? "request_failed",
      message: payload?.message ?? (payload?.error === "Forbidden" || payload?.error === "Invalid admin token"
        ? "Your admin session has ended. Sign out and back in."
        : payload?.error === "Account not found" ? "No account with that email."
        : "Something went wrong. Please try again."),
      data: payload as T,
    };
  }, [token]);
  return { call, ready: !!token };
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "-";
export const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
export const rands = (cents: number | null | undefined) =>
  typeof cents === "number" ? `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-";

export const pill = "min-h-11 rounded-full px-5 font-display text-xs uppercase tracking-wider disabled:opacity-50";
export const pillPrimary = `${pill} bg-primary text-charcoal`;
export const pillOutline = `${pill} border-2 border-primary/35 text-charcoal hover:bg-primary/10`;
export const pillDanger = `${pill} bg-destructive text-destructive-foreground`;
export const field = "w-full rounded-xl border border-primary/20 bg-card min-h-11 px-4 font-body text-sm text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50";
export const cardCls = "card-kiki border-primary/15 p-5";
export const h3Cls = "font-display uppercase text-base text-charcoal mb-3";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending", paid: "Paid", failed: "Failed", cancelled: "Cancelled", refunded: "Refunded",
};
export const ORDER_KIND_LABEL: Record<string, string> = {
  family_pass: "Family Warrior Pass", extra_kit: "Extra Armour Kit", book: "Family library book",
};
