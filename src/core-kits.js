(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipCoreKits = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return Object.freeze({
    celesia: { rarity: 4, role: "指揮", secondaryRole: "協同輸出", maxHp: 1320, attack: 188, defense: 160, speed: 112, range: 2, attackName: "星式協作斬", skillName: "星痕指令", skillPower: 1.4, skillEffect: "星痕2輪，隊友命中後每輪協同斬擊一次", signature: { type: "core", kind: "star", cooldown: 3 }, constellations: ["C1 星痕延長", "C2 第二位隊友追加傷害", "C3 技能與協同增強", "C4 擊倒轉移星痕並縮短冷卻", "C5 星痕與協同增強", "C6 三人接續觸發額外協同"] },
    reyn: { rarity: 3, role: "守衛", secondaryRole: "護衛", maxHp: 1200, attack: 148, defense: 178, speed: 119, range: 1, attackName: "巡林短弓", skillName: "巡林掩護", skillPower: 1, skillEffect: "保護生命比例最低隊友並分擔傷害", signature: { type: "core", kind: "cover", cooldown: 3 }, constellations: ["C1 被保護者加速", "C2 承傷後反擊", "C3 提高分擔減傷", "C4 危急護盾", "C5 反擊強化並降攻", "C6 承接一次致命傷"] },
    lia: { rarity: 3, role: "治療", secondaryRole: "防護", maxHp: 1100, attack: 112, defense: 152, speed: 110, range: 2, attackName: "星光藥針", skillName: "回覆援護", skillPower: 1, skillEffect: "單體立即治療與持續回復", signature: { type: "core", kind: "lia", cooldown: 3 }, constellations: ["C1 持續治療延長", "C2 溢補轉護盾", "C3 立即治療提高", "C4 危急淨化", "C5 持續治療提高", "C6 首次危急自動救援"] },
    isar: { rarity: 3, role: "獵人", secondaryRole: "前排", maxHp: 1260, attack: 175, defense: 160, speed: 88, range: 1, attackName: "獵線重擊", skillName: "大型獵擊", skillPower: 1.65, skillEffect: "高生命目標重擊，使用後短暫減傷", signature: { type: "core", kind: "hunt", cooldown: 3 }, constellations: ["C1 高生命傷害與減傷提高", "C2 受擊反擊", "C3 重擊提高", "C4 低生命防禦與受療提高", "C5 反擊強化並降攻", "C6 分擔危急隊友傷害"] },
    chodan: { rarity: 4, role: "節奏", secondaryRole: "輔助", maxHp: 1260, attack: 160, defense: 160, speed: 122, range: 2, attackName: "月式鼓擊", skillName: "月式鼓點", skillPower: 1, skillEffect: "全隊加速並提供合拍增幅", signature: { type: "core", kind: "beat", cooldown: 3 }, constellations: ["C1 合拍次數增加", "C2 防護合拍附帶減傷", "C3 加速提高", "C4 首次合拍縮短冷卻", "C5 合拍增幅提高", "C6 三人合拍後追加一次"] },
    magenta: { rarity: 4, role: "爆發", secondaryRole: "削弱", maxHp: 1160, attack: 228, defense: 130, speed: 105, range: 2, attackName: "低音震波", skillName: "旅行低音", skillPower: 1.75, skillEffect: "群體傷害並降低主要目標防禦", signature: { type: "core", kind: "bass", cooldown: 3 }, constellations: ["C1 降防提高", "C2 附加低頻脈衝", "C3 技能倍率提高", "C4 擊倒轉移降防", "C5 負面目標增傷提高", "C6 隊友命中觸發回響"] },
    hina: { rarity: 4, role: "射手", secondaryRole: "標記", maxHp: 1100, attack: 220, defense: 124, speed: 128, range: 3, attackName: "弦音箭", skillName: "弦音標記", skillPower: 1.5, skillEffect: "單體標記，隊友命中可觸發追擊", signature: { type: "core", kind: "string", cooldown: 2 }, constellations: ["C1 標記延長並加速", "C2 隊友命中追擊", "C3 技能倍率提高", "C4 標記附帶緩速", "C5 追擊提高", "C6 擊倒轉移標記並追擊"] },
    siyeon: { rarity: 4, role: "拾音", secondaryRole: "延遲治療", maxHp: 1240, attack: 148, defense: 160, speed: 116, range: 2, attackName: "回音脈衝", skillName: "回音採集", skillPower: 1, skillEffect: "治療兩人並記錄受傷，下一輪延遲回復", signature: { type: "core", kind: "echo", cooldown: 3 }, constellations: ["C1 延遲回復上限提高", "C2 超額轉護盾", "C3 即時治療提高", "C4 結算時淨化", "C5 記錄比例提高", "C6 危急時提前結算"] }
  });
}));
