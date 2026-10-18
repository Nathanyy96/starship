# Character walking atlases v2

All named playable and story characters now use author-art-derived transparent world cutouts. The former Q-style walking atlas roster in `docs/character-motion-roster-20261015.json` is empty. Twelve resident walking sprites remain until full-body source art is available.

`scripts/build-character-motion-manifest.cjs` reads alpha components to record individual source rectangles and a common body scale. Run with the project's `sharp` dependency available.

The shared `src/character-motion.js` renderer and image cache are used by the opening scene, village exploration and full world. The old heroine-only atlas and renderer have been removed. Static character portraits are independent of walking assets.

Generation brief: preserve the reference character's species, face, hair, costume and colors. Painted anime chibi, full body, four columns and four rows, equal scale, relaxed walking with alternating feet and arm swing. Rows face down/front, left/profile, up/back, right/profile. Real alpha transparency, no floor, shadows, labels, effects or background. Held instruments and large weapons stowed for walking.
