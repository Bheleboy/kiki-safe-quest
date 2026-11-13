/** Warrior Pass display helpers. Prices always come from the server. */

export function formatRand(cents: number): string {
  const r = cents / 100;
  return `R${Number.isInteger(r) ? r : r.toFixed(2)}`;
}

const RETURN_KEY = "kw_pass_return";

/** Remembers where to send the parent after checkout (only in-app course or parent pages). */
export function savePassReturnPath(path: string) {
  try { sessionStorage.setItem(RETURN_KEY, path); } catch { /* ignore */ }
}

export function readPassReturnPath(): string {
  try {
    const p = sessionStorage.getItem(RETURN_KEY) || "";
    if (/^\/(course|parent|family)(\?[A-Za-z0-9=&_%-]*)?$/.test(p)) return p;
  } catch { /* ignore */ }
  return "/family";
}

const FIELD_MESSAGES: Record<string, string> = {
  method: "Choose door delivery or a Courier Guy locker.",
  recipient_name: "Please enter the name of the person receiving the kit.",
  phone: "Please enter a valid phone number.",
  locker_code: "Please enter the Courier Guy locker code.",
  address_line1: "Please enter the street address.",
  city: "Please enter the city or town.",
  province: "Please choose a province.",
  postal_code: "Please enter a 4-digit postal code.",
};

const ERROR_MESSAGES: Record<string, string> = {
  already_has_pass: "Your family already has the Warrior Pass.",
  included_child_required: "Choose which child gets the included Armour Kit.",
  pass_required: "Extra Armour Kits need the Family Warrior Pass.",
  invalid_child: "Please choose children from your family.",
  kit_exists: "One of these children already has an Armour Kit.",
  duplicate_child: "Each child can only get one Armour Kit.",
  empty_order: "Choose at least one Armour Kit.",
  consent_required: "Please tick the box to confirm you agree.",
  too_many: "Too many attempts. Please wait a few minutes and try again.",
  not_available: "The Warrior Pass is not available yet.",
};

export function checkoutErrorMessage(data: { error?: string; field?: string; message?: string } | undefined): string {
  if (data?.error === "invalid_delivery" && data.field && FIELD_MESSAGES[data.field]) return FIELD_MESSAGES[data.field];
  if (data?.error && ERROR_MESSAGES[data.error]) return ERROR_MESSAGES[data.error];
  return data?.message || "Something went wrong. Please try again.";
}

export const KIT_STATUS: Record<string, string> = {
  locked: "Ships when the course is finished",
  earned: "Earned. We will be in touch about delivery",
  address_needed: "Earned. We will be in touch about delivery",
  ready_to_ship: "Getting ready to ship",
  shipped: "On its way",
  delivered: "Delivered",
};

export const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape",
];
