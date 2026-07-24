import type { ModuleTheme } from "./lessonData";

export const brand = {
  bg: "#FBF6EF",       // warm cream background
  bgDeep: "#F1E6D2",   // deeper cream
  primary: "#E8873A",  // Kiki orange
  gold: "#D9A441",     // warm gold
  clay: "#B65E3E",     // clay red
  ink: "#2B2019",      // deep warm brown/ink
  trust: "#3B7BB0",    // calm blue
  cream: "#FFF8EC",
};

export const themePalette: Record<ModuleTheme, { accent: string; motif: string }> = {
  internet: { accent: brand.trust, motif: "🌐" },
  smart:    { accent: brand.gold,  motif: "💡" },
  kind:     { accent: brand.clay,  motif: "💛" },
  brave:    { accent: brand.primary, motif: "🛡" },
  helper:   { accent: brand.trust, motif: "🤝" },
};
