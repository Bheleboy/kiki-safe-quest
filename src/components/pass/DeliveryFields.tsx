import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PROVINCES } from "@/lib/warriorPass";

export type DeliveryMethod = "door" | "locker";
export type DeliveryValues = {
  recipient_name: string; phone: string; address_line1: string; address_line2: string;
  suburb: string; city: string; province: string; postal_code: string; locker_code: string;
};
export const EMPTY_DELIVERY: DeliveryValues = {
  recipient_name: "", phone: "", address_line1: "", address_line2: "", suburb: "", city: "", province: "", postal_code: "", locker_code: "",
};

/** Copies a saved delivery profile into form values. */
export function deliveryFromProfile(d: Partial<Record<string, string | null>> | null | undefined): { method: DeliveryMethod; values: DeliveryValues } {
  const values = { ...EMPTY_DELIVERY };
  if (d) (Object.keys(EMPTY_DELIVERY) as (keyof DeliveryValues)[]).forEach((k) => { if (typeof d[k] === "string") values[k] = d[k] as string; });
  return { method: d?.delivery_method === "locker" ? "locker" : "door", values };
}

/** Quick browser check so the button only enables when the server is likely to accept the details. */
export function deliveryLooksComplete(method: DeliveryMethod, f: DeliveryValues): boolean {
  if (f.recipient_name.trim().length < 2 || f.phone.trim().length < 9) return false;
  if (method === "locker") return f.locker_code.trim().length >= 2;
  return f.address_line1.trim().length >= 3 && f.city.trim().length >= 2 && !!f.province && /^\d{4}$/.test(f.postal_code.trim());
}

export const inputCls = "w-full rounded-xl border border-primary/20 bg-card min-h-12 px-4 py-3 font-body text-charcoal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50";
export const labelCls = "font-body text-sm font-medium text-charcoal/70 block mb-1.5";

export function DeliveryFields({ method, onMethod, values, onChange }: {
  method: DeliveryMethod;
  onMethod: (m: DeliveryMethod) => void;
  values: DeliveryValues;
  onChange: (next: DeliveryValues) => void;
}) {
  const set = (k: keyof DeliveryValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...values, [k]: e.target.value });
  return (
    <fieldset className="space-y-3">
      <legend className={labelCls}>Delivery</legend>
      <RadioGroup value={method} onValueChange={(v) => onMethod(v === "locker" ? "locker" : "door")} className="grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex items-center gap-3 rounded-xl border border-primary/15 bg-card px-4 min-h-12 cursor-pointer">
          <RadioGroupItem value="door" id="delivery-door" />
          <span className="font-body text-charcoal">Door delivery</span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-primary/15 bg-card px-4 min-h-12 cursor-pointer">
          <RadioGroupItem value="locker" id="delivery-locker" />
          <span className="font-body text-charcoal">Courier Guy locker</span>
        </label>
      </RadioGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="wp-name">Recipient name</label>
          <input id="wp-name" autoComplete="name" value={values.recipient_name} onChange={set("recipient_name")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="wp-phone">Phone</label>
          <input id="wp-phone" type="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} className={inputCls} />
        </div>
      </div>
      {method === "locker" ? (
        <div>
          <label className={labelCls} htmlFor="wp-locker">Courier Guy locker code</label>
          <input id="wp-locker" value={values.locker_code} onChange={set("locker_code")} className={inputCls} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="wp-a1">Street address</label>
            <input id="wp-a1" autoComplete="address-line1" value={values.address_line1} onChange={set("address_line1")} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="wp-a2">Complex or unit (optional)</label>
            <input id="wp-a2" autoComplete="address-line2" value={values.address_line2} onChange={set("address_line2")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="wp-suburb">Suburb</label>
            <input id="wp-suburb" value={values.suburb} onChange={set("suburb")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="wp-city">City or town</label>
            <input id="wp-city" autoComplete="address-level2" value={values.city} onChange={set("city")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="wp-province">Province</label>
            <select id="wp-province" value={values.province} onChange={set("province")} className={inputCls}>
              <option value="">Choose a province</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="wp-postal">Postal code</label>
            <input id="wp-postal" inputMode="numeric" autoComplete="postal-code" maxLength={4} value={values.postal_code} onChange={set("postal_code")} className={inputCls} />
          </div>
        </div>
      )}
    </fieldset>
  );
}
