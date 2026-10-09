(function (root, factory) {
  var config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.StarshipReleaseConfig = config;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Change only after the author approves the final story, artwork and release notice.
  var approved11 = true;
  var test11 = typeof process !== "undefined" && process.env.NODE_ENV === "test" && process.env.STARSHIP_RELEASE_11_TEST === "true";
  var open11 = approved11 || test11;
  return Object.freeze({
    approved11: approved11, open11: open11, version: open11 ? "1.1" : "1.0",
    cycle: open11 ? "release-1-1" : "2026-10-05-major-combat-repair-1-0",
    compensationCycle: "2026-10-05-major-combat-repair-1-0",
    story11Reward: Object.freeze({ version: "1.1", starSand: 1600, characterExp: 3600, starMarks: 1 })
  });
}));
