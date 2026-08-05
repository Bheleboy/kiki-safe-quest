/**
 * Armour of God reward system configuration.
 *
 * All 6 pieces are earnable in the free Online Safety Course.
 *
 * Young stream (6-9): 3 modules award 2 pieces each.
 *   young-m1 (What is the Internet)   -> Belt of Truth, Shield of Faith
 *   young-m2 (SMART Rules)            -> Helmet of Salvation, Breastplate of Righteousness
 *   young-m3 (Be Kind Online)         -> Sword of the Spirit, Shoes of Peace
 *
 * Teen stream (10-13): 5 modules award 1-2 pieces each.
 *   teen-m1 (Internet Safety 101)     -> Belt of Truth
 *   teen-m2 (Privacy and Passwords)   -> Shield of Faith
 *   teen-m3 (Protect Your Profile)    -> Helmet of Salvation
 *   teen-m4 (Cyberbullying & Respect) -> Breastplate of Righteousness, Shoes of Peace
 *   teen-m5 (Scams and Phishing)      -> Sword of the Spirit
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
      "6-9": ["young-m1"],
      "10-13": ["teen-m2"],
    },
  },
  {
    id: "helmet-of-salvation",
    name: "Helmet of Salvation",
    description: "Take the helmet of salvation to protect your mind.",
    verse: "Ephesians 6:17",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m2"],
      "10-13": ["teen-m3"],
    },
  },
  {
    id: "breastplate-of-righteousness",
    name: "Breastplate of Righteousness",
    description: "Put on the breastplate of righteousness to guard your heart.",
    verse: "Ephesians 6:14",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m2"],
      "10-13": ["teen-m4"],
    },
  },
  {
    id: "sword-of-the-spirit",
    name: "Sword of the Spirit",
    description: "Take the sword of the Spirit, which is the word of God.",
    verse: "Ephesians 6:17",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m3"],
      "10-13": ["teen-m5"],
    },
  },
  {
    id: "shoes-of-peace",
    name: "Shoes of Peace",
    description: "Fit your feet with the readiness that comes from the gospel of peace.",
    verse: "Ephesians 6:15",
    course: "online-safety",
    requiredModules: {
      "6-9": ["young-m3"],
      "10-13": ["teen-m4"],
    },
  },
];

export const ONLINE_SAFETY_PIECES = ARMOUR_PIECES.filter((p) => p.course === "online-safety");

/** Get ALL armour pieces unlocked by completing a given module (a module can award 1-2 pieces) */
export function getArmourPiecesForModule(streamId: string, moduleId: string): ArmourPiece[] {
  return ARMOUR_PIECES.filter((piece) => piece.requiredModules[streamId]?.includes(moduleId));
}

/** Get the first armour piece associated with a given module ID for a given stream */
export function getArmourPieceForModule(streamId: string, moduleId: string): ArmourPiece | undefined {
  return getArmourPiecesForModule(streamId, moduleId)[0];
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
