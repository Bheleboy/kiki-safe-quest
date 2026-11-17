import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Eyebrow, PublicPage } from "@/components/ui/editorial";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/maintenance";
import { formatRand } from "@/lib/warriorPass";

const h2 = "font-display text-lg font-semibold text-charcoal uppercase tracking-wider";

/**
 * Public prices, delivery and refunds. Prices and the seller name come from the public site settings,
 * so this page follows admin changes. If the settings cannot be read, the page shows without prices.
 */
export default function PricingDelivery() {
  const { settings } = usePublicSettings();
  const p = settings?.prices ?? null;
  const price = (c: number | null | undefined) => (typeof c === "number" && c > 0 ? formatRand(c) : null);
  const pass = price(p?.family_pass_cents);
  const founding = price(p?.launch_family_pass_cents);
  const limit = typeof p?.launch_limit === "number" && p.launch_limit > 0 ? p.launch_limit : null;
  const kit = price(p?.kit_cents);
  const book = price(p?.book_cents);
  const seller = settings?.receipt_business_name ?? null;
  const support = settings?.support_email ?? DEFAULT_SUPPORT_EMAIL;
  const mail = <a href={`mailto:${support}`} className="text-primary hover:underline font-semibold">{support}</a>;

  return (
    <PublicPage>
      <SEO
        title="Prices, Delivery and Refunds | Kiki Warrior"
        description="Kiki Warrior prices for the Family Warrior Pass, Armour Kits and the Armour of God book, how delivery with The Courier Guy works, and our refund policy."
        path="/pricing-and-delivery"
      />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Eyebrow>For parents</Eyebrow>
        <h1 className="font-display text-3xl font-bold text-charcoal uppercase tracking-wide mb-2">Prices, delivery and refunds</h1>
        <p className="font-body text-sm text-charcoal/70 mb-10">All prices are in South African rand.</p>

        <div className="editorial-legal space-y-8 font-body text-sm text-charcoal/70 leading-relaxed">
          <section className="space-y-3">
            <h2 className={h2}>Prices</h2>
            <ul className="space-y-3">
              <li className="rounded-2xl border border-primary/15 bg-card p-4">
                <p className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Family Warrior Pass{pass ? `: ${pass}` : ""}</p>
                <p>Every lesson for every child in your family, paid once.{founding ? ` Founding Family price ${founding}${limit ? ` for the first ${limit} families` : ""}.` : ""}</p>
              </li>
              <li className="rounded-2xl border border-primary/15 bg-card p-4">
                <p className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Armour Kit{kit ? `: ${kit} per child, plus delivery` : ", per child, plus delivery"}</p>
                <p>A real Armour of God coin and wristband, posted when your child finishes the course. Armour Kits are for families with the Warrior Pass.</p>
              </li>
              <li className="rounded-2xl border border-primary/15 bg-card p-4">
                <p className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Kiki's Armour of God, Premium Edition PDF{book ? `: ${book}` : ""}</p>
                <p>A printable PDF. One purchase covers every child in your family.</p>
              </li>
              <li className="rounded-2xl border border-primary/15 bg-card p-4">
                <p className="font-display text-base font-bold text-charcoal uppercase tracking-wide">Schools, churches and clubs</p>
                <p>Ask us for group pricing: {mail}. Each learner gets their own code, and the Armour Kits are delivered to you in one parcel.</p>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className={h2}>Delivery</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Armour Kits are delivered in South Africa by The Courier Guy, to your door or to a Courier Guy locker.</li>
              <li>Each kit is posted when that child finishes the course. Brothers and sisters who finish close together share one parcel.</li>
              <li>The delivery fee is shown at checkout before you pay, and is charged once per order.</li>
              <li>We email you a tracking link when the kit is on its way.</li>
            </ul>
          </section>

          {/* Refund wording: client to confirm. */}
          <section className="space-y-3">
            <h2 className={h2}>Refunds and returns</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The Warrior Pass and the book PDF can be refunded within 7 days of payment, as long as the paid lessons have not been started and the PDF has not been downloaded.</li>
              <li>Armour Kits can be returned unused within 14 days of delivery.</li>
              <li>If an item arrives damaged or is the wrong item, we will replace it.</li>
              <li>To ask for a refund, return or replacement, email {mail} with your order number from your receipt.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className={h2}>Payments</h2>
            <p>
              Payments are processed securely by Yoco. We never see or store your full card details.
              {seller ? <> Purchases are sold by <strong className="text-charcoal">{seller}</strong>, which runs Kiki Warrior.</> : null}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className={h2}>More information</h2>
            <p>
              See our <Link to="/terms" className="text-primary hover:underline font-semibold">Terms of Service</Link> and{" "}
              <Link to="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>, or contact us at {mail}.
            </p>
          </section>
        </div>
      </main>
    </PublicPage>
  );
}
