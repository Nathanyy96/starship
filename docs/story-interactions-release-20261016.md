# Story interaction release — 2026-10-16

Six interludes use exact published story anchors in versions 1.0–1.1:

| Scene | Interaction |
| --- | --- |
| 1.0 act 2, village path | Follow Reyn along walkable village ground. He stops for a player who falls behind. Approach him at the end and interact to resume. |
| 1.0 act 2, Reyn's nearby-route warning | Two brief replies; both return to the same original line. |
| 1.0 act 4, workshop near-bank preparation | Approach two safe ground markers to inspect the rope and stable footing. |
| 1.1 act 2, near-bank roll call | Assist with the light signal and roll call without crossing the water. |
| 1.1 act 3, upstream departure | Follow Reyn along the same-bank mountain route; wait and resume use the same rules. |
| 1.1 act 5, inn conversation | Listen quietly or offer water; both return to the same original dialogue. |

The interludes suspend the current dialogue line and resume that exact line after acknowledgement. They do not write rewards, mission answers, alternate story state or new persistent save fields. Closing a scene cancels temporary interaction state; reopening retains the existing scene checkpoint.

Navigation uses the game's obstacle-aware path planner. Both player and guide remain on playable ground. Region travel and teleport stay blocked during an unfinished story exchange. Keyboard movement, touch controls and point-and-click walking remain available during follow/inspection; dialogue choices retain keyboard focus.

## Verification

- Full suite: 214 tests; 205 passed, 9 skipped, 0 failed.
- New checks cover all six exact anchors and their reachable targets, guide waiting, proximity checks, task completion acknowledgement, duplicate triggers, cancellation and every reply returning without changing story state.
- Browser verified real village follow movement, waiting, route walking, approach-and-talk completion, both reply presentation and return to original line 8 / 39. No console errors.
- Desktop follow view and 390 × 844 mobile choice view inspected. Viewport restored afterward.
- Impeccable mechanical detector: no findings on the new interaction UI source and stylesheet.
- Integrated the latest published Mistbridge streets/resident update before final verification.
