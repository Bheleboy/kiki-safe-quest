/**
 * Armour of God reward system configuration.
 *
 * The Online Safety Course awards 3 pieces.
 * The (future) Kiki Christian Academy awards the remaining 3.
 */

export interface ArmourPiece {
  id: string;
  name: string;
  description: string;
  verse: string;
  course: "online-safety" | "christian-academy";
  /** Module IDs that must be fully completed (all quizzes ≥70%) to unlock this piece */
  requiredModules: Record<string, string[]>; // streamId → moduleIds[]
}

export const ARMOUR_PIECES: ArmourPiece[] = [
  // === Online Safety Course (free) ===
  {
    id: "belt-of-truth",
    name: "Belt of Truth",
    description: "Stand firm with the belt of truth buckled around your waist.",
    verse: "Ephesians 6:14",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m1"],
      "10-13": ["teen-m1"],
    },
  },
  {
    id: "shield-of-faith",
    name: "Shield of Faith",
    description: "Take up the shield of faith to extinguish all the flaming arrows.",
    verse: "Ephesians 6:16",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m2"],
      "10-13": ["teen-m2", "teen-m3"],
    },
  },
  {
    id: "helmet-of-salvation",
    name: "Helmet of Salvation",
    description: "Take the helmet of salvation to protect your mind.",
    verse: "Ephesians 6:17",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m3"],
      "10-13": ["teen-m4", "teen-m5"],
    },
  },

  // === Kiki Christian Academy (paid — future) ===
  {
    id: "breastplate-of-righteousness",
    name: "Breastplate of Righteousness",
    description: "Put on the breastplate of righteousness to guard your heart.",
    verse: "Ephesians 6:14",
    course: "christian-academy",
    requiredModules: {},
  },
  {
    id: "sword-of-the-spirit",
    name: "Sword of the Spirit",
    description: "Take the sword of the Spirit, which is the word of God.",
    verse: "Ephesians 6:17",
    course: "christian-academy",
    requiredModules: {},
  },
  {
    id: "shoes-of-peace",
    name: "Shoes of Peace",
    description: "Fit your feet with the readiness that comes from the gospel of peace.",
    verse: "Ephesians 6:15",
    course: "christian-academy",
    requiredModules: {},
  },
];

export const ONLINE_SAFETY_PIECES = ARMOUR_PIECES.filter((p) => p.course === "online-safety");
export const CHRISTIAN_ACADEMY_PIECES = ARMOUR_PIECES.filter((p) => p.course === "christian-academy");

/** Get the armour piece associated with a given module ID for a given stream */
export function getArmourPieceForModule(streamId: string, moduleId: string): ArmourPiece | undefined {
  return ARMOUR_PIECES.find((piece) => {
    const modules = piece.requiredModules[streamId];
    return modules?.includes(moduleId);
  });
}

/** Get all lesson IDs required for a piece in a given stream, using courseData modules */
export function getRequiredLessonIds(
  piece: ArmourPiece,
  streamId: string,
  modules: { id: string; lessons: { id: string }[] }[]
): string[] {
  const requiredModuleIds = piece.requiredModules[streamId] || [];
  return modules
    .filter((m) => requiredModuleIds.includes(m.id))
    .flatMap((m) => m.lessons.map((l) => l.id));
}
