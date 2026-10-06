(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipFirstMajorKits = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Verified 1.1–1.6 first-major kits. Release flags remain separate:
  // a completed design must not unlock a character in the active pool.
  return Object.freeze({
    cenwu: {
      rarity: 3, role: "控場", secondaryRole: "輔助", maxHp: 1040, attack: 132, defense: 145, speed: 119, range: 3,
      attackName: "路標短杖", skillName: "驛站複核", skillPower: 1.12, skillEffect: "以攻擊力 112% 傷害標記敵人，使其受傷增加 8%、速度降低 10%，持續 2 輪。",
      signature: { type: "mark", power: 1.12, markBonus: .08, slow: .9, duration: 2, cooldown: 3 },
      constellations: ["C1 測線造成的受傷增加 8% 與減速 10% 由 2 輪延為 3 輪。", "C2 施放時另使主目標攻擊力降低 10%，持續 1 輪。", "C3 技能直接傷害由自身攻擊力 112% 提至 120.96%；命座強化倍率為 1.08。", "C4 施放後全隊速度提高 6%，持續 1 輪。", "C5 減速由 10% 提至 14.5%；目標受傷增加由 8% 提至 10.8%。C2 的降攻仍為 10%。", "C6 技能擊倒主目標時，將受傷增加 8% 的測線轉給生命比例最低的存活敵人，持續 3 輪；轉移不附帶減速。"]
    },
    ruida: {
      rarity: 3, role: "守衛", secondaryRole: "節奏", maxHp: 1240, attack: 139, defense: 174, speed: 102, range: 1,
      attackName: "車轅重擊", skillName: "護送換位", skillPower: 1.05, skillEffect: "為生命比例最低的隊友提供芮妲最大生命 13% 的護盾；該隊友受擊時將剩餘傷害的 30% 轉給芮妲，持續 2 輪。芮妲另抵擋下一次自身受擊的 30%。",
      signature: { type: "guard", shield: .13, guard: .3, duration: 2, cooldown: 3 },
      constellations: ["C1 護盾由芮妲最大生命 13% 提至 14.04%（乘 1.08）；護送分擔期限由 2 輪延為 3 輪。", "C2 施放護送時對首名敵人造成自身攻擊力 55% 的傷害。", "C3 護盾再乘 1.08，總計為芮妲最大生命 15.1632%；每名受盾者的護盾總上限為自身最大生命 28%。", "C4 施放後全隊受傷減少 6%，持續 1 輪。", "C5 施放時的反制傷害由自身攻擊力 55% 提至 80%。", "C6 施放時若被保護者生命低於 35%，額外獲得芮妲最大生命 6% 的護盾；仍受單人最大生命 28% 的護盾總上限限制。"]
    },
    yuan: {
      rarity: 3, role: "治療", secondaryRole: "輔助", maxHp: 1090, attack: 116, defense: 143, speed: 113, range: 2,
      attackName: "藥箱輕擊", skillName: "分次配藥", skillPower: 1.05, skillEffect: "立即治療生命比例最低隊友，回復榆安最大生命 16%；之後每輪再回復 5.5%，共 2 輪。",
      signature: { type: "heal", instant: .16, overTime: .055, duration: 2, cooldown: 3, targets: 1 },
      constellations: ["C1 每輪回復榆安最大生命 5.5% 的效果由 2 輪延為 3 輪。", "C2 即時治療溢出時，以溢出量 50% 形成護盾，上限為榆安最大生命 8%；受盾者護盾總上限為自身最大生命 28%。", "C3 即時治療由榆安最大生命 16% 提至 17.28%（乘 1.08）。", "C4 施放後若受療者生命仍低於 40%，移除其可淨化負面效果。", "C5 每輪持續治療由榆安最大生命 5.5% 提至 6.875%（乘 1.25），共 3 輪。", "C6 施放後若受療者生命仍低於 30%，再立即回復榆安最大生命 8%。"]
    },
    veyra: {
      rarity: 4, role: "測量", secondaryRole: "控場", maxHp: 1230, attack: 164, defense: 159, speed: 112, range: 2,
      attackName: "潮位刻線", skillName: "水工讀值", skillPower: 1.18, skillEffect: "以攻擊力 118% 傷害標記敵人，使其受傷增加 10%、防禦降低 18%，持續 2 輪。",
      signature: { type: "mark", power: 1.18, markBonus: .1, defenseDown: .82, duration: 2, cooldown: 3 },
      constellations: ["C1 主目標受傷增加 10%、防禦降低 18% 的效果由 2 輪延為 3 輪。", "C2 施放時對另一名存活敵人施加防禦降低 10%，持續 1 輪；不造成直接傷害。", "C3 直接傷害由自身攻擊力 118% 提至 127.44%（乘 1.08）。", "C4 施放後全隊防禦提高 6%，持續 1 輪。", "C5 主目標防禦倍率由 0.82 降至 0.7708（降低 22.92%）；受傷增加由 10% 提至 13.5%。", "C6 技能擊倒主目標時，將受傷增加 10% 轉給生命比例最低的存活敵人，持續 3 輪；轉移不附帶降防。"]
    },
    harlow: {
      rarity: 4, role: "重裝", secondaryRole: "控場", maxHp: 1530, attack: 145, defense: 190, speed: 91, range: 1,
      attackName: "橋錘敲擊", skillName: "橋樑壁壘", skillPower: 1.08, skillEffect: "為生命比例最低隊友提供赫洛最大生命 16% 的護盾，2 輪內替其分擔 30% 剩餘傷害；自己下一次受擊減少 36%，主目標攻擊力降低 15% 共 2 輪。",
      signature: { type: "guard", shield: .16, guard: .36, attackDown: .85, duration: 2, cooldown: 3 },
      constellations: ["C1 護盾由赫洛最大生命 16% 提至 17.28%（乘 1.08）；承傷期限由 2 輪延為 3 輪。", "C2 施放時對首名敵人造成自身攻擊力 55% 的傷害。", "C3 護盾再乘 1.08，總計為赫洛最大生命 18.6624%；受盾者護盾總上限為自身最大生命 28%。", "C4 施放後全隊受傷減少 6%，持續 1 輪。", "C5 敵方攻擊力倍率由 0.85 降至 0.799（降低 20.1%）；C2 反制由攻擊力 55% 提至 80%。", "C6 施放時若被保護者生命低於 35%，額外獲得赫洛最大生命 6% 的護盾；仍受單人最大生命 28% 的護盾總上限限制。"]
    },
    rena: {
      rarity: 3, role: "斥候", secondaryRole: "控場", maxHp: 1010, attack: 171, defense: 124, speed: 126, range: 2,
      attackName: "港口短刺", skillName: "港口快訊", skillPower: 1.48, skillEffect: "優先攻擊生命比例最低的敵人，造成攻擊力 148% 傷害；若命中前目標生命低於 40%，傷害再提高 18%。目標受傷增加 6% 共 2 輪。",
      signature: { type: "mark", power: 1.48, markBonus: .06, duration: 2, cooldown: 2, execute: .18 },
      constellations: ["C1 目標受傷增加 6% 的標記由 2 輪延為 3 輪。", "C2 施放後若目標仍存活且生命低於 40%，再造成自身攻擊力 20% 的額外攻擊；同時目標攻擊力降低 10% 共 1 輪。", "C3 技能基礎傷害由自身攻擊力 148% 提至 159.84%（乘 1.08）。", "C4 施放後全隊速度提高 6%，持續 1 輪。", "C5 對施放前生命低於 40% 目標的斬殺加成由 18% 提至 27%；目標受傷增加由 6% 提至 8.1%。", "C6 技能擊倒主目標時，將受傷增加 6% 的標記轉給生命比例最低的存活敵人，持續 3 輪。"]
    },
    elorna: {
      rarity: 4, role: "支援", secondaryRole: "治療", maxHp: 1250, attack: 151, defense: 158, speed: 117, range: 2,
      attackName: "潮線短杖", skillName: "外勤回報", skillPower: 1.1, skillEffect: "陸地造成攻擊力 110% 傷害並使目標受傷增加 8% 共 2 輪；深水改為治療生命比例最低的 2 名隊友，各回復艾洛娜最大生命 9.5%。",
      signature: { type: "form", power: 1.1, markBonus: .08, instant: .095, duration: 2, cooldown: 3 },
      constellations: ["C1 陸地測線受傷增加 8% 由 2 輪延至 3 輪；深水救援另給受療者每輪回復艾洛娜最大生命 3% 的效果，共 3 輪。", "C2 陸地施放後使主目標攻擊力降低 10% 共 1 輪；深水即時治療溢出時，以溢出量 50% 形成護盾，上限為艾洛娜最大生命 8%。", "C3 陸地直接傷害由攻擊力 110% 提至 118.8%；深水即時治療由艾洛娜最大生命 9.5% 提至 10.26%。", "C4 陸地施放後全隊防禦提高 6% 共 1 輪；深水治療後若目標生命仍低於 40%，移除其可淨化負面效果。", "C5 陸地目標受傷增加由 8% 提至 10.8%；深水即時治療再乘 1.15，最終為艾洛娜最大生命 11.799%。", "C6 陸地技能擊倒主目標時，將受傷增加 8% 轉給生命比例最低的存活敵人 3 輪；深水救援後使首名敵人受傷增加 5% 共 1 輪，且受療者生命仍低於 30% 時再治療艾洛娜最大生命 8%。"]
    },
    eda: {
      rarity: 4, role: "校準", secondaryRole: "輔助", maxHp: 1260, attack: 160, defense: 163, speed: 108, range: 2,
      attackName: "鐘針點擊", skillName: "彼岸校準", skillPower: 1.12, skillEffect: "選取生命比例最低的隊友，移除全部可淨化負面效果，並提供艾妲最大生命 9% 的護盾；護盾總上限為受盾者最大生命 28%。",
      signature: { type: "support", shield: .09, cleanse: true, duration: 2, cooldown: 3 },
      constellations: ["C1 校準護盾由艾妲最大生命 9% 提至 9.72%（乘 1.08）。", "C2 接受校準的隊友攻擊力提高 8%，持續 1 輪；淨化會移除可淨化負面效果。", "C3 校準護盾再乘 1.08，總計為艾妲最大生命 10.4976%。", "C4 每次校準由保護生命比例最低的 1 人改為 2 人，各自獲得護盾、淨化與攻擊增益。", "C5 校準攻擊增益由 8% 提至 12%，持續 1 輪。", "C6 若 2 名受校準者施放時皆為滿生命，額外替全隊各加艾妲最大生命 4% 的護盾；每名隊友護盾總上限為自身最大生命 28%。"]
    },
    mave: {
      rarity: 4, role: "仲裁", secondaryRole: "控場", maxHp: 1200, attack: 174, defense: 155, speed: 114, range: 2,
      attackName: "索引裁切", skillName: "公共索引", skillPower: 1.27, skillEffect: "造成攻擊力 127% 傷害，使目標受傷增加 6%、防禦降低 16% 共 2 輪，並使其技能冷卻增加 1（最多到原上限加 1）。",
      signature: { type: "control", power: 1.27, defenseDown: .84, duration: 2, cooldown: 3 },
      constellations: ["C1 主目標防禦降低 16% 的效果由 2 輪延為 3 輪；主目標技能冷卻仍延後 1。", "C2 施放時使另一名存活敵人的技能冷卻也增加 1，最多到其冷卻上限加 1。", "C3 直接傷害由自身攻擊力 127% 提至 137.16%（乘 1.08）。", "C4 施放後全隊防禦提高 6%，持續 1 輪。", "C5 主目標防禦倍率由 0.84 降至 0.7896（降低 21.04%），受傷增加由 6% 提至 8.1%；技能冷卻延後量仍為 1。", "C6 技能擊倒主目標時，下一名生命比例最低的敵人受傷增加 6% 共 3 輪；轉移不附帶降防或冷卻延後。"]
    },
    rovienne: {
      rarity: 4, role: "守門", secondaryRole: "支援", maxHp: 1480, attack: 154, defense: 186, speed: 99, range: 2,
      attackName: "工程定標", skillName: "有限卸載", skillPower: 1.08, skillEffect: "為生命比例最低的 2 名隊友各提供羅薇恩最大生命 14.5% 的護盾，2 輪內各替其分擔 32% 剩餘傷害；自己每次施放失去最大生命 8%，最低保留 1 點。",
      signature: { type: "guard", shield: .145, guard: .32, burden: .08, duration: 2, cooldown: 4, targets: 2 },
      constellations: ["C1 兩名受保護者各獲護盾由羅薇恩最大生命 14.5% 提至 15.66%（乘 1.08）；分擔期限由 2 輪延為 3 輪。", "C2 施放時對首名敵人造成自身攻擊力 55% 的傷害。", "C3 兩名受保護者護盾再乘 1.08，總計各為羅薇恩最大生命 16.9128%；各自護盾總上限為自身最大生命 28%。", "C4 施放後全隊受傷減少 6%，持續 1 輪。", "C5 每次施放的自身工程負載由最大生命 8% 降至 5.6%；C2 反制由自身攻擊力 55% 提至 80%。", "C6 施放時若任一受保護者生命低於 35%，該人額外獲得羅薇恩最大生命 6% 的護盾；每名隊友護盾總上限仍為自身最大生命 28%。"]
    }
  });
}));
