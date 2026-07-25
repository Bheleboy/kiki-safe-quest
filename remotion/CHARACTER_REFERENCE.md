# Canonical character reference (LOCKED)

**THE canonical Kiki starting frame for all videogen calls:**

- Project file: `src/assets/kiki-character-reference.png` (pointer: `src/assets/kiki-character-reference.png.asset.json`)
- CDN URL: https://kikiwarrior.com/__l5e/assets-v1/cdeb71cd-d8fc-48db-9141-cb106a3f244a/kiki-character-reference.png
- Also mirrored in code at `src/constants/videoGeneration.ts` → `KIKI_CANONICAL_REFERENCE`

Rules for every lesson video (all 26 remaining lessons):

1. Always pass this exact image as `starting_frame` for Kiki host clips (intro + outro).
2. Never use temporary/derived frames (e.g. `/mnt/documents/kiki-demo-frame.jpg`, re-generated "host scene" images) — they break character and background consistency.
3. Prompts must state "same character, outfit, art style and background as the reference image; no signage or text".
4. Pose rules: the spear must stay physically gripped at all times (intro: planted in left hand while waving with the right; outro: victory pose, spear raised, both hands on shaft). No floating props.

Secondary character: Nala — https://kikiwarrior.com/__l5e/assets-v1/791f5f26-8fc3-4fec-8476-0e0f6fe5b13a/nala-character-reference.png
