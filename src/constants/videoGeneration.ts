/**
 * CANONICAL CHARACTER REFERENCES FOR ALL VIDEOGEN CALLS
 *
 * THE canonical Kiki starting frame for all videogen calls is
 * `src/assets/kiki-character-reference.png` (CDN URL below).
 *
 * Every lesson video (all 26 remaining lessons) MUST use this exact file as the
 * `starting_frame` for AI video generation of Kiki host moments.
 * Do NOT use ad-hoc frames (e.g. /mnt/documents/kiki-demo-frame.jpg) — doing so
 * produces a different-looking character and off-brand background scenes.
 */

export const KIKI_CANONICAL_REFERENCE = {
  /** Project pointer file (source of truth) */
  assetPointer: "src/assets/kiki-character-reference.png.asset.json",
  /** Absolute CDN URL of the locked, client-approved reference image */
  url: "https://kikiwarrior.com/__l5e/assets-v1/cdeb71cd-d8fc-48db-9141-cb106a3f244a/kiki-character-reference.png",
  /** Relative asset URL (same file) */
  path: "/__l5e/assets-v1/cdeb71cd-d8fc-48db-9141-cb106a3f244a/kiki-character-reference.png",
} as const;

export const NALA_CANONICAL_REFERENCE = {
  assetPointer: "src/assets/nala-character-reference.png.asset.json",
  url: "https://kikiwarrior.com/__l5e/assets-v1/791f5f26-8fc3-4fec-8476-0e0f6fe5b13a/nala-character-reference.png",
} as const;
