# Character motion release — 2026-10-15

## Changes

- Opening story, village exploration and world exploration share one character motion renderer, roster and image cache. Entering from a story scene preserves the selected explorer and cannot fall back to the old heroine walking art while a new atlas loads.
- All eighteen named 1.0–1.1 characters have four directions × four walking poses. Travel distance advances the player cycle; stopping retains facing. Reduced motion uses a stable pose. World NPC patrols use their own character atlas.
- Removed the old `hero-motion.js`, heroine walking PNG and its prompt. Character portraits remain available for dialogue.
- Removed the article archive's world-map jump button, click listener and unused CSS; preserved the story scene play action and normal world entry.
- Added a standalone character preview with direct links into real opening/world controllers.

## Verification

- Full suite: 202 tests, 193 passed, 9 skipped, 0 failed.
- Targeted controller and animation checks after final rendering cleanup: 21 passed.
- Every PNG has sixteen separate alpha components; source rectangles follow actual art bounds, preserve feet and maintain a common per-character scale.
- Browser: all eighteen atlases loaded; front and back poses inspected. Magenta retained the same art in opening and world exploration, and left movement changed facing. The heroine remained visible on the 390 × 844 mobile world view. No browser console errors in those scene checks.
- Regression tests cover real atlas drawing in all three controllers using the same selected character and one shared image request, plus cancellation/retry behavior and removal of old runtime assets.
