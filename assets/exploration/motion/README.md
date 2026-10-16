# Character walking atlases v2

Eighteen named characters appearing in versions 1.0–1.1. Each transparent PNG contains sixteen painted chibi frames: front, left, back, right; four walking poses per direction. All were generated from the corresponding existing character reference listed in `docs/character-motion-roster-20261015.json` on 2026-10-15.

The PNG originals are retained unchanged. `scripts/build-character-motion-manifest.cjs` reads alpha components to record individual source rectangles and a common body scale. Feet stay anchored through a walk cycle, without clipping hair into adjacent cells. Run with the project's `sharp` dependency available.

The shared `src/character-motion.js` renderer and image cache are used by the opening scene, village exploration and full world. The old heroine-only atlas and renderer have been removed. Static character portraits are independent of walking assets.

Generation brief: preserve the reference character's species, face, hair, costume and colors. Painted anime chibi, full body, four columns and four rows, equal scale, relaxed walking with alternating feet and arm swing. Rows face down/front, left/profile, up/back, right/profile. Real alpha transparency, no floor, shadows, labels, effects or background. Held instruments and large weapons stowed for walking.
