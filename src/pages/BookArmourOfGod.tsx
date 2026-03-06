import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const bookLinks = [
  {
    name: "Amazon",
    url: "https://www.amazon.com",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M.045 18.02c.07-.116.36-.326.906-.546 1.457-.586 2.636-.907 3.536-.907.305 0 .57.042.795.126.224.084.42.21.585.378.166.168.3.378.404.63.104.252.156.546.156.882 0 .672-.18 1.326-.54 1.962s-.87 1.17-1.53 1.602c-.66.432-1.41.648-2.25.648-.42 0-.81-.084-1.17-.252-.36-.168-.54-.378-.54-.63 0-.084.03-.168.09-.252l.558-.84zm6.394-2.2c0-.672.156-1.284.468-1.836.312-.552.744-1.002 1.296-1.35.552-.348 1.164-.588 1.836-.72.672-.132 1.392-.198 2.16-.198h.78v-.42c0-.63-.144-1.092-.432-1.386-.288-.294-.756-.442-1.404-.442-.648 0-1.452.168-2.412.504l-.756-1.848c1.08-.504 2.304-.756 3.672-.756 1.32 0 2.298.33 2.934.99.636.66.954 1.614.954 2.862v4.284c0 .336.072.576.216.72.144.144.384.216.72.216v1.89c-.336.084-.612.138-.828.162-.216.024-.444.036-.684.036-.504 0-.876-.108-1.116-.324-.24-.216-.396-.504-.468-.864-.72.84-1.74 1.26-3.06 1.26-.864 0-1.578-.27-2.142-.81-.564-.54-.846-1.254-.846-2.142 0-.756.21-1.374.63-1.854.42-.48 1.014-.81 1.782-.99l2.898-.63v-.378c0-.378-.108-.666-.324-.864-.216-.198-.552-.297-1.008-.297-.456 0-.87.108-1.242.324-.372.216-.66.504-.864.864l-1.74-1.02zm5.76 1.26h-.42c-.624 0-1.14.132-1.548.396-.408.264-.612.648-.612 1.152 0 .384.12.684.36.9.24.216.564.324.972.324.552 0 1.02-.186 1.404-.558.384-.372.576-.834.576-1.386v-.828h-.732zm-8.502 6.462c1.596.924 3.33 1.386 5.202 1.386 1.296 0 2.544-.216 3.744-.648 1.2-.432 2.244-1.02 3.132-1.764.12-.096.24-.144.36-.144.168 0 .3.072.396.216.096.144.144.3.144.468 0 .168-.072.336-.216.504-.936.936-2.136 1.68-3.6 2.232-1.464.552-2.976.828-4.536.828-2.088 0-3.924-.456-5.508-1.368l.882-1.71z" />
      </svg>
    ),
  },
  {
    name: "Apple Books",
    url: "https://books.apple.com",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    name: "Kobo",
    url: "https://www.kobo.com",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H7V8h4v8zm6 0h-4V8h4v8z" />
      </svg>
    ),
  },
  {
    name: "Barnes & Noble",
    url: "https://www.barnesandnoble.com",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm3 4v12h2V4H7zm4 0v12h2l3-4.5V16h2V4h-2l-3 4.5V4h-2z" />
      </svg>
    ),
  },
];

const armourComponents = [
  { name: "Belt of Truth", description: "Standing firm in God's truth." },
  { name: "Breastplate of Righteousness", description: "Protecting the heart." },
  { name: "Shoes of Peace", description: "Walking in God's peace." },
  { name: "Shield of Faith", description: "Defending against doubt." },
  { name: "Helmet of Salvation", description: "Protecting the mind." },
  { name: "Sword of the Spirit", description: "Using the Word of God." },
];

export default function BookArmourOfGod() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display uppercase tracking-wide">Back to Home</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Book Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="w-72 md:w-80 rounded-2xl overflow-hidden shadow-xl border border-border/40">
                <img
                  src="/images/kiki-armour-of-god.png"
                  alt="Kiki's Armour of God workbook cover"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="font-display text-primary-foreground text-xs text-center leading-tight uppercase font-bold">Ages<br />4–12</span>
              </div>
            </div>
          </motion.div>

          {/* Book Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <p className="font-display text-xs text-primary uppercase tracking-widest mb-2">By Nonala Tose Dagada</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wide leading-tight">
                Kiki's Armour of God
              </h1>
              <p className="font-body text-muted-foreground mt-3 leading-relaxed">
                A Christian workbook for children aged 4–12 that teaches biblical concepts like the Belt of Truth, Breastplate of Righteousness, and Shield of Faith. It uses activities, prayers, and Bible verses to help kids build mental health awareness and a stronger relationship with God.
              </p>
            </div>

            {/* Key Features */}
            <div className="card-kiki space-y-3">
              <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Key Features</h2>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span><strong className="text-foreground">Target Audience:</strong> Children aged 4–12.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span><strong className="text-foreground">Focus:</strong> Empowering children to become "superheroes of faith."</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span><strong className="text-foreground">Content:</strong> Combines fun, interactive activities with scriptural teaching based on Ephesians 6.</span>
                </li>
              </ul>
            </div>

            {/* Buy Links */}
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">Get Your Copy</h2>
              <div className="grid grid-cols-2 gap-3">
                {bookLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-kiki flex items-center gap-3 p-4 hover:border-primary/60 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-display text-xs font-bold text-foreground uppercase tracking-wide block truncate">{link.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Buy Now <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Armour Components */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 space-y-6"
        >
          <h2 className="font-display text-xl font-bold text-foreground uppercase tracking-wide text-center">
            The Armor of God Components Covered
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {armourComponents.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-kiki text-center p-5"
              >
                <h3 className="font-display text-sm font-bold text-primary uppercase tracking-wide mb-1">{item.name}</h3>
                <p className="font-body text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <p className="font-body text-sm text-muted-foreground text-center max-w-2xl mx-auto mt-8">
            This resource is designed to help kids apply these spiritual concepts to their daily lives through prayer and scripture.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
