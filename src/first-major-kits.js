(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipFirstMajorKits = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 1.1–1.6 first playable drafts. These are kept separate from release flags:
  // having a finished kit must never put a character into the active pool.
  return Object.freeze({
    cenwu: {
      rarity: 3, role: "控場", secondaryRole: "輔助", maxHp: 1040, attack: 132, defense: 145, speed: 119, range: 3,
      attackName: "路標短杖", skillName: "驛站複核", skillPower: 1.12, skillEffect: "標記敵人並降低其速度，協助隊伍集中攻擊。",
      signature: { type: "mark", power: 1.12, markBonus: .08, slow: .9, duration: 2, cooldown: 3 },
      constellations: ["C1 標記延長一輪", "C2 複核同時降低目標攻擊", "C3 複核傷害提高", "C4 標記期間全隊速度小幅提高", "C5 緩速與降攻效果增強", "C6 標記目標倒下後將路標轉給下一名敵人"]
    },
    ruida: {
      rarity: 3, role: "守衛", secondaryRole: "節奏", maxHp: 1240, attack: 139, defense: 174, speed: 102, range: 1,
      attackName: "車轅重擊", skillName: "護送換位", skillPower: 1.05, skillEffect: "為生命最低的隊友架盾，自己承受下一次攻擊。",
      signature: { type: "guard", shield: .13, guard: .3, duration: 2, cooldown: 3 },
      constellations: ["C1 護送護盾量小幅提高", "C2 護送時先反制首要敵人", "C3 護盾量再提高", "C4 全隊獲得短暫減傷", "C5 反制傷害提高", "C6 危急隊友額外得到一次救援護盾"]
    },
    yuan: {
      rarity: 3, role: "治療", secondaryRole: "輔助", maxHp: 1090, attack: 116, defense: 143, speed: 113, range: 2,
      attackName: "藥箱輕擊", skillName: "分次配藥", skillPower: 1.05, skillEffect: "先治療最低生命隊友，再按輪次追加小額治療。",
      signature: { type: "heal", instant: .16, overTime: .055, duration: 2, cooldown: 3, targets: 1 },
      constellations: ["C1 分次治療多持續一輪", "C2 溢補部分轉成護盾", "C3 立即治療提高", "C4 低生命目標可移除負面效果", "C5 每輪追加治療提高", "C6 配藥時對仍危急的目標再補一次"]
    },
    veyra: {
      rarity: 4, role: "測量", secondaryRole: "控場", maxHp: 1230, attack: 164, defense: 159, speed: 112, range: 2,
      attackName: "潮位刻線", skillName: "水工讀值", skillPower: 1.18, skillEffect: "標記弱點並降低敵方防禦，讓隊友集中打擊。",
      signature: { type: "mark", power: 1.18, markBonus: .1, defenseDown: .82, duration: 2, cooldown: 3 },
      constellations: ["C1 讀值標記延長一輪", "C2 測線延伸至第二個敵人", "C3 讀值傷害提高", "C4 全隊獲得短暫防護", "C5 降防幅度提高", "C6 擊倒測線目標後把讀值轉至下一敵人"]
    },
    harlow: {
      rarity: 4, role: "重裝", secondaryRole: "控場", maxHp: 1530, attack: 145, defense: 190, speed: 91, range: 1,
      attackName: "橋錘敲擊", skillName: "橋樑壁壘", skillPower: 1.08, skillEffect: "替前線架盾並承受衝擊，降低敵人的下一次攻擊。",
      signature: { type: "guard", shield: .16, guard: .36, attackDown: .85, duration: 2, cooldown: 3 },
      constellations: ["C1 壁壘護盾量小幅提高", "C2 施放壁壘時反敲首要敵人", "C3 護盾量再提高", "C4 全隊獲得短暫減傷", "C5 降攻效果提高", "C6 施放時為危急隊友補上救援壁壘"]
    },
    rena: {
      rarity: 3, role: "斥候", secondaryRole: "控場", maxHp: 1010, attack: 171, defense: 124, speed: 126, range: 2,
      attackName: "港口短刺", skillName: "港口快訊", skillPower: 1.48, skillEffect: "優先突擊生命最低的敵人，留下可供隊友追擊的標記。",
      signature: { type: "mark", power: 1.48, markBonus: .06, duration: 2, cooldown: 2, execute: .18 },
      constellations: ["C1 標記延長一輪", "C2 低生命目標受到額外突擊", "C3 突擊傷害提高", "C4 隊友追擊標記目標時獲得短暫速度", "C5 斬殺加成提高", "C6 擊倒目標後立即標記下一敵人"]
    },
    elorna: {
      rarity: 4, role: "支援", secondaryRole: "治療", maxHp: 1250, attack: 151, defense: 158, speed: 117, range: 2,
      attackName: "潮線短杖", skillName: "外勤回報", skillPower: 1.1, skillEffect: "陸地形態標記敵方測線；深水形態改為雙人救援，兩形態共用培養與命座。",
      signature: { type: "form", power: 1.1, markBonus: .08, instant: .095, duration: 2, cooldown: 3 },
      constellations: ["C1 測線或救援延長一輪", "C2 陸地降低敵方攻擊、深水產生溢補護盾", "C3 主要效果提高", "C4 陸地提供短暫減傷、深水救援可淨化危急目標", "C5 標記或救援增幅提高", "C6 陸地擊倒目標可轉移測線，深水救援附帶短暫測線"]
    },
    eda: {
      rarity: 4, role: "校準", secondaryRole: "輔助", maxHp: 1260, attack: 160, defense: 163, speed: 108, range: 2,
      attackName: "鐘針點擊", skillName: "彼岸校準", skillPower: 1.12, skillEffect: "清除隊友的一項負面效果，並提供短暫護盾。",
      signature: { type: "support", shield: .09, cleanse: true, duration: 2, cooldown: 3 },
      constellations: ["C1 校準護盾量小幅提高", "C2 淨化後隊友獲得短暫攻擊增益", "C3 護盾量再提高", "C4 可同時保護第二名隊友", "C5 攻擊增益提高", "C6 若無受傷隊友則把校準轉為全隊小護盾"]
    },
    mave: {
      rarity: 4, role: "仲裁", secondaryRole: "控場", maxHp: 1200, attack: 174, defense: 155, speed: 114, range: 2,
      attackName: "索引裁切", skillName: "公共索引", skillPower: 1.27, skillEffect: "削弱首要敵人並延後其下一次技能，不重置友方冷卻。",
      signature: { type: "control", power: 1.27, defenseDown: .84, duration: 2, cooldown: 3 },
      constellations: ["C1 索引削弱延長一輪", "C2 同時延後第二名敵人的技能", "C3 索引傷害提高", "C4 全隊獲得短暫防禦", "C5 削弱幅度提高", "C6 被仲裁目標倒下後將索引轉至下一敵人"]
    },
    rovienne: {
      rarity: 4, role: "守門", secondaryRole: "支援", maxHp: 1480, attack: 154, defense: 186, speed: 99, range: 2,
      attackName: "工程定標", skillName: "有限卸載", skillPower: 1.08, skillEffect: "為兩名危急隊友分配護盾，自己承受額外負載，效果不能無限疊加。",
      signature: { type: "guard", shield: .145, guard: .32, burden: .08, duration: 2, cooldown: 4, targets: 2 },
      constellations: ["C1 卸載護盾量小幅提高", "C2 卸載時先反制首要敵人", "C3 護盾量再提高", "C4 全隊獲得短暫減傷", "C5 負載降低、反制提高", "C6 施放時危急隊友得到額外護盾，羅薇恩仍須承受負載"]
    }
  });
}));
