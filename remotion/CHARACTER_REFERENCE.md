# Canonical character reference (LOCKED — v3 pipeline)

**V3 RULE (client-approved):** each clip's starting frame is generated ENTIRELY via
imagegen as ONE cohesive scene (Kiki + classroom + children together, premium model,
1920x1080). That unified image is the videogen `starting_frame`.

**NEVER PIL-composite** `src/assets/kiki-character-reference.png` (or any static Kiki
layer) onto a background before videogen — the pasted Kiki and the AI-animated Kiki
coexist, producing TWO Kikis and floating/detached props (the rejected v2 defect).

Rules for every lesson video (all 26 remaining lessons):

1. Generate a per-clip unified starting frame with imagegen, using the locked Kiki
   description (tall African teen warrior girl, dark brown skin, voluminous dreadlocks
   + dark headband, black sleeveless top, gold beaded collar, dark belt, maroon skirt,
   spear right hand, geometric-pattern oval shield left hand — clearly taller than the
   children) + the locked classroom description (golden-hour classroom, green
   chalkboard, bunting, bookshelves, globe, plants, diverse kids aged 6-9 seated at desks).
2. `kiki-character-reference.png` remains the visual style anchor ONLY — not a videogen input.
3. Every videogen prompt must include: "same character, outfit, art style and background
   as the starting image", "no text, no words, no letters, no captions, no signage", and
   "single character only, do not add any additional versions of the main character".
4. Concepts are glowing ICONS only — words (SAFE/KIND/TELL) go on in post via ffmpeg drawtext.
5. QC every clip (~5s frame) before stitching: one Kiki, props attached, kids present, no text.

Secondary character: Nala — https://kikiwarrior.com/__l5e/assets-v1/791f5f26-8fc3-4fec-8476-0e0f6fe5b13a/nala-character-reference.png
