import { motion } from "framer-motion";
import { ShieldCheck, Lock, Eye, Ban } from "lucide-react";

const items = [
  { icon: <ShieldCheck className="w-5 h-5" />, text: "POPIA & GDPR Compliant" },
  { icon: <Lock className="w-5 h-5" />, text: "Parent-Controlled Access" },
  { icon: <Eye className="w-5 h-5" />, text: "Secure Login & Email Verification" },
  { icon: <Ban className="w-5 h-5" />, text: "No Ads Inside Child Learning Area" },
];

export default function TrustSection() {
  return (
    <section className="py-16 border-t border-border/40">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-kiki"
        >
          <div className="text-center mb-8">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">
              Safety & Trust
            </span>
            <h2 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider mt-2">
              Your Family's Safety First
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="text-success">{item.icon}</div>
                <span className="font-body text-sm text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
