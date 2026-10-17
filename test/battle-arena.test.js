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

test("future cast uses distinct normal proportion action atlases without changing release gating", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
  for (const id of ["eda", "mave", "rovienne"]) {
    const atlas = path.resolve(__dirname, "..", "assets", "combat", `${id}-normal-actions-v1.webp`);
    assert.ok(fs.statSync(atlas).size > 100_000, `${id} atlas should contain full action art`);
    assert.ok(css.includes(`.battle-action-sprite.${id} { background-image: url('./assets/combat/${id}-normal-actions-v1.webp')`));
    const team = [{ id, hp: 100, maxHp: 100, shield: 0, slot: 3 }];
    const enemies = [{ id: "enemy-0", name: "敵人", image: data.trialStages[9].enemies[0].image, hp: 100, maxHp: 100, shield: 0 }];
    const html = battleArenaMarkup({ team, enemies, actorId: id, actorIsEnemy: false, events: [`${id}攻擊敵人`] }, { team: structuredClone(team), enemies: structuredClone(enemies) }, {});
    assert.ok(html.includes(`battle-action-sprite ${id} attack`), id);
  }
});

test("2.0 cast previews use their own skill effects and action atlases", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
  for (const [id, effect] of [["risan", "tidechart"], ["yaoze", "beacon"], ["maro", "clinic"]]) {
    const atlas = path.resolve(__dirname, "..", "assets", "combat", `${id}-normal-actions-v1.webp`);
    assert.ok(fs.statSync(atlas).size > 100_000, `${id} atlas should contain full action art`);
    assert.ok(css.includes(`.battle-action-sprite.${id} { background-image: url('./assets/combat/${id}-normal-actions-v1.webp')`));
    const team = [{ id, hp: 100, maxHp: 100, shield: 0, slot: 3 }];
    const enemies = [{ id: "enemy-0", name: "敵人", image: data.trialStages[9].enemies[0].image, hp: 100, maxHp: 100, shield: 0 }];
    const previous = { team: structuredClone(team), enemies: structuredClone(enemies) };
    if (id === "risan") enemies[0].hp = 80;
    else team[0].shield = 20;
    const event = `${id}使用「${data.characterBattleStats[id].skillName}」`;
    const html = battleArenaMarkup({ team, enemies, actorId: id, actorIsEnemy: false, events: [event] }, previous, {});
    assert.ok(html.includes(`battle-action-sprite ${id} attack`), id);
    assert.ok(html.includes(`effect-${effect}`), id);
    assert.equal(Number(data.cards[id].releaseVersion), 2);
  }
});
