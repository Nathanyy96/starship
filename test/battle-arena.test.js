const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../src/data.js");

const source = fs.readFileSync(path.resolve(__dirname, "..", "src", "player-app.js"), "utf8");
const markupSource = source.slice(source.indexOf("function battleArenaMarkup("), source.indexOf("function battleSceneMarkup("));
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const battleArenaMarkup = new Function("data", "battleCharacterById", "characterPortraitSource", "enemyArtFor", "battleHealthPercent", "escapeHtml", "battleLogText", "number", `${markupSource}; return battleArenaMarkup;`)(
  data,
  id => data.cards[id],
  card => `./assets/cards/${card.id}.png`,
  unit => unit.image,
  unit => Math.round(unit.hp / unit.maxHp * 100),
  escapeHtml,
  text => text,
  value => String(value)
);

test("stage 10 arena keeps every combatant visible while only the actor and target animate", () => {
  const team = ["celesia", "magenta", "chodan", "hina"].map(id => ({ id, hp: 100, maxHp: 100, shield: 0 }));
  const enemies = data.trialStages[9].enemies.map((enemy, index) => ({ id: `enemy-${index}`, name: enemy.name, image: enemy.image, hp: 100, maxHp: 100, shield: 0 }));
  const previous = { team: structuredClone(team), enemies: structuredClone(enemies) };
  enemies[1].hp = 70;
  const frame = { team, enemies, actorId: "magenta", actorIsEnemy: false, events: ["瑪珍塔攻擊鏡核巡獸"] };
  const html = battleArenaMarkup(frame, previous, {});
  assert.equal((html.match(/class="battle-arena-fighter/g) || []).length, 7);
  assert.equal((html.match(/battle-arena-fighter[^\"]* acting/g) || []).length, 1);
  assert.equal((html.match(/battle-arena-fighter[^\"]* targeted/g) || []).length, 1);
  assert.equal((html.match(/battle-action-sprite [^\"]+ attack/g) || []).length, 1);
  for (const slot of [1, 2, 3, 4]) assert.ok(html.includes(`position-slot-${slot}`));
  assert.ok(html.includes("magenta attack"));
  assert.ok(html.includes("spine-beast hurt"), html.match(/battle-action-sprite[^\"]+/g).join(" | "));
  assert.ok(html.includes("我方") && html.includes("敵方"));
  const css = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
  assert.ok(!css.includes(".battle-timeline-active .battle-unit-visual { display: none; }"));
  assert.match(css, /\.ally-formation \.position-slot-1 \{ grid-area: 1 \/ 2/);
  assert.match(css, /\.ally-formation \.position-slot-2 \{ grid-area: 2 \/ 2/);
  assert.match(css, /\.ally-formation \.position-slot-3 \{ grid-area: 1 \/ 1/);
  assert.match(css, /\.ally-formation \.position-slot-4 \{ grid-area: 2 \/ 1/);
  assert.match(css, /\.enemy-formation \.battle-arena-roster \{ grid-template-columns: minmax\(0,1fr\)/);
  assert.match(css, /\.battle-arena \{[^}]*min-height: 590px/);
});

test("enemy area attacks animate every affected ally without moving the rest", () => {
  const team = ["celesia", "magenta", "chodan", "hina"].map(id => ({ id, hp: 100, maxHp: 100, shield: 0 }));
  const enemies = data.trialStages[9].enemies.map((enemy, index) => ({ id: `enemy-${index}`, name: enemy.name, image: enemy.image, hp: 100, maxHp: 100, shield: 0 }));
  const previous = { team: structuredClone(team), enemies: structuredClone(enemies) };
  team[0].hp = 80;
  team[2].hp = 75;
  const html = battleArenaMarkup({ team, enemies, actorId: "enemy-0", actorIsEnemy: true, events: ["雙相終端發動範圍攻擊"] }, previous, {});
  assert.equal((html.match(/class="battle-arena-fighter/g) || []).length, 7);
  assert.equal((html.match(/battle-arena-fighter[^\"]* acting/g) || []).length, 1);
  assert.equal((html.match(/battle-arena-fighter[^\"]* targeted/g) || []).length, 2);
  assert.ok(html.includes("crystal-beast attack"));
});
