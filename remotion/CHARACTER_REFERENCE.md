# Canonical character reference (LOCKED — v5 pipeline)

**V5 RULE (client-approved):** each clip's starting frame is generated ENTIRELY via
imagegen as ONE cohesive scene (Kiki + classroom + children together, premium model,
1920x1080). That unified image is the videogen `starting_frame`.

**NEVER PIL-composite** any static Kiki layer onto a background before videogen — the
pasted Kiki and the AI-animated Kiki coexist, producing TWO Kikis and floating/detached
props (the rejected v2 defect).

**CHARACTER (v5, client-corrected — supersedes the v4 "teenager" description):** Kiki is
a YOUNG CHILD, approximately 8-10 years old. NOT a teenager, NOT an adult. Locked
description for every imagegen prompt: "A young African girl, approximately 8-10 years
old, chibi/stylized 3D Pixar proportions with an oversized head relative to body and big
round expressive dark brown eyes with large whites. Dark brown skin. Chunky thick black
dreadlocks that stick out sideways at shoulder length. DISTINCTIVE flat-topped woven hat
with horizontal stripes in dark red (#6B1E1E) and midnight blue (#1D2E4A) sitting on top
of her dreadlocks — her most recognizable feature. Round childlike face, determined
brave expression. Dark leather sleeveless top with gold (#D4A017) chevron trim at the
neckline, gold collar trim, dark leather belt with gold studs, maroon/burgundy (#6B1E1E)
wrap skirt over dark shorts, gold ankle cuffs, leather sandals with ankle straps. Brown
leather oval Zulu-style shield with geometric triangle patterns in earth tones. Wooden
spear with metal point on BOTH ends (double-pointed) with gold bands at the joints. She
is a CHILD — small, compact, brave-looking, the same height as her classmates or only
slightly taller."

NEVER say "teenager", "young woman", or imply adult proportions — v1-v4 rendered her
too old and were all rejected. The old `src/assets/kiki-character-reference.png` is
OUTDATED and must not be used. The v5 visual references are the user-uploaded
`Kiki_main_avatar.png` and `Kiki_Pose_Sheet.png` (to be copied to
`src/assets/kiki-main-avatar-v5.png` / `kiki-pose-sheet-v5.png`).

**BRAND COLORS:** Earth Brown #3A2A1F, Warrior Red #6B1E1E, Midnight Blue #1D2E4A,
Gold #D4A017, Sand #C9B08A, Olive #56B2F.

**LIP SYNC (v5 decision):** do NOT bake voice into AI clips — AI video cannot lip sync.
Deliver the visual video with music + SFX only, plus the voice track as a separate file
(`src/assets/demo-classroom-v5-voice.m4a`) for post-production syncing.

Rules for every lesson video (all remaining lessons):

1. Generate a per-clip unified starting frame with imagegen using the locked child-Kiki
   description above. Locked classroom description: golden-hour classroom, green
   chalkboard, bunting, bookshelves, globe, plants, diverse kids aged 6-9 seated at desks
   in EVERY clip from frame 1.
2. Every videogen prompt must include: "same character, outfit, art style and background
   as the starting image", "no text, no words, no letters, no captions, no signage", and
   "single character only, do not add any additional versions of the main character".
3. Concepts are glowing ICONS only — words (SAFE/KIND/TELL) go on in post via ffmpeg
   drawtext (golden #D4A017, dark outline, alpha pop-in).
4. QC every clip (~5s frame) before stitching: one Kiki (a CHILD with the striped hat),
   props attached, kids present, no text.

Secondary character: Nala — https://kikiwarrior.com/__l5e/assets-v1/791f5f26-8fc3-4fec-8476-0e0f6fe5b13a/nala-character-reference.png
