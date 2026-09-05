export type Presenter = "kiki" | "nonala";

export type CardType =
  | "greeting"
  | "title"
  | "icon-pair"
  | "icon-trio"
  | "icon-grid"
  | "keyword-stamp"
  | "rules"
  | "transition"
  | "globe"
  | "celebration"
  | "keywords-list"
  | "outro";

export interface CardIcon {
  emoji: string;
  label?: string;
  ring?: string;
}

export interface KeywordItem {
  word: string;
  icon: string;
  color: string;
}

export interface BeatCard {
  type: CardType;
  startSec: number;
  endSec: number;
  heading?: string;
  subheading?: string;
  icons?: CardIcon[];
  keywords?: KeywordItem[];
  tint?: string;
}

export interface LessonConfig {
  id: string;
  title: string;
  subtitle?: string;
  ageGroup: "6-9" | "10-13";
  module: string;
  lessonNumber: number;
  presenter: Presenter;
  audioFile: string;
  durationSec: number;
  beats: BeatCard[];
}

export interface ModulePalette {
  primary: string;
  secondary: string;
  accent: string;
  tint: string;
}

export const MODULE_PALETTES: Record<string, ModulePalette> = {
  "Internet Safety & Privacy": {
    primary: "#2EA8E0",
    secondary: "#FF8A2A",
    accent: "#2FD58A",
    tint: "#E3F4FF",
  },
  "Cyberbullying & Respect": {
    primary: "#8B5CF6",
    secondary: "#FF5DA2",
    accent: "#FFD54F",
    tint: "#F3ECFF",
  },
  "Scams & Phishing": {
    primary: "#F26D00",
    secondary: "#2EA8E0",
    accent: "#FF5DA2",
    tint: "#FFF3D9",
  },
  "Digital Citizenship": {
    primary: "#2FD58A",
    secondary: "#8B5CF6",
    accent: "#FF8A2A",
    tint: "#E8FBF1",
  },
};
