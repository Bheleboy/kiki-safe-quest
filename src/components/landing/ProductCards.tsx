import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldIcon } from "@/components/course/CourseIcons";
import { BookOpen, GraduationCap } from "lucide-react";

const products = [
  {
    number: 1,
    title: "Online Safety Course",
    subtitle: "Keep your Kids Safe Online",
    description:
      "A comprehensive internet safety course teaching children aged 6–13 how to stay safe, smart, and strong online through animated lessons and interactive quizzes.",
    whatItIs: "An interactive online safety course with video lessons, quizzes, badges, and certificates.",
    whoItsFor: "Children ages 6–13 and parents who want to protect their children online.",
    cta: "Start Free Course",
    link: "/courses/internet-safety",
    active: true,
    icon: <ShieldIcon size={32} className="stroke-primary" />,
    image: "/images/kiki-safety-course.png",
  },
  {
    number: 2,
    title: "Warrior Academy",
    subtitle: "Christian Online Academy",
    description:
      "A comprehensive journey through biblical stories, character building and practical faith applications designed for children ages 5–12.",
    whatItIs: "A Christian-themed online learning academy with weekly lessons and devotions.",
    whoItsFor: "Children ages 5–12, teachers and parents who want a solid Christian grounding.",
    cta: "Coming Soon",
    link: "#",
    active: false,
    icon: <GraduationCap className="w-8 h-8 text-secondary" />,
    image: "/images/kiki-warrior-learning.png",
  },
  {
    number: 3,
    title: "Kiki's Armour of God",
    subtitle: "Available on Amazon, Kobo & Barnes & Noble",
    description:
      "A Christian themed workbook for children that teaches about the armour of God through activities, Bible verses, and prayers.",
    whatItIs: "An illustrated children's workbook available on Amazon, Kobo, and Barnes & Noble.",
    whoItsFor: "Children and parents looking for ways to understand spiritual concepts.",
    cta: "Buy Now",
    link: "/books/armour-of-god",
    active: true,
    icon: <BookOpen className="w-8 h-8 text-accent" />,
    image: "/images/kiki-armour-of-god.png",
  },
];

export default function ProductCards() {
  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col"
            >
              {/* Number badge */}
              <div className="flex justify-center mb-4">
                <span className="w-10 h-10 rounded-full border-2 border-primary/60 flex items-center justify-center font-display text-sm font-bold text-primary">
                  {p.number}
                </span>
              </div>

              {/* Card */}
              <div
                className={`card-kiki flex-1 flex flex-col text-center transition-all ${
                  p.active
                    ? "border-primary/30 hover:border-primary/60 ring-1 ring-primary/10"
                    : "opacity-70"
                }`}
              >
                <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide mb-1">
                  {p.title}
                </h3>
                <p className="font-body text-xs text-muted-foreground mb-6">
                  {p.subtitle}
                </p>

                {/* Image area */}
                {p.image && (
                  <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden bg-muted/30">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover object-center rounded-2xl"
                      loading="lazy"
                    />
                    {!p.active && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <span className="font-display text-sm uppercase tracking-widest text-muted-foreground bg-muted px-4 py-2 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!p.image && (
                  <div className="relative w-full h-48 mb-6 rounded-lg bg-muted/30 flex items-center justify-center">
                    {p.icon}
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="font-display text-sm uppercase tracking-widest text-muted-foreground bg-muted px-4 py-2 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-left space-y-4 flex-1">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
                      What Is It
                    </h4>
                    <p className="font-body text-sm text-muted-foreground">{p.whatItIs}</p>
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-1">
                      Who Uses It
                    </h4>
                    <p className="font-body text-sm text-muted-foreground">{p.whoItsFor}</p>
                  </div>
                </div>

                <div className="mt-6">
                  {p.active ? (
                    <Link
                      to={p.link}
                      className="touch-target w-full inline-flex items-center justify-center gap-2 btn-copper py-3 text-xs uppercase tracking-widest"
                    >
                      {p.cta}
                    </Link>
                  ) : (
                    <span className="inline-block w-full py-3 text-xs font-display uppercase tracking-widest text-muted-foreground bg-muted rounded-xl text-center">
                      {p.cta}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
