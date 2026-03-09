import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Thandi M.",
    role: "Parent",
    text: "My children love the Kiki Warrior course! The lessons are engaging and I can track their progress from my dashboard.",
    stars: 5,
  },
  {
    name: "James K.",
    role: "Parent & Teacher",
    text: "Finally, an online safety course designed with African children in mind. The content is age-appropriate and well-structured.",
    stars: 5,
  },
  {
    name: "Sarah N.",
    role: "Parent",
    text: "The Armour of God rewards motivated my kids to complete every lesson. They're so proud of the pieces they've collected!",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-14">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-primary">
            Testimonials
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider">
            What Our Families Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-kiki space-y-4"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="font-body text-sm text-muted-foreground leading-relaxed italic">
                "{t.text}"
              </p>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">{t.name}</p>
                <p className="font-body text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
