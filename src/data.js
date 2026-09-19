(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StarshipGachaData = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 長篇劇情以獨立生成檔載入，避免把 20 萬字正文塞進規則與角色資料同一段。
  // Node 測試透過 require 載入；瀏覽器則由 index.html / test.html 先載入全域物件。
  var storySource = null;
  if (typeof require === "function") {
    try { storySource = require("./story-source.js"); } catch (error) { storySource = null; }
  }
  if (!storySource && typeof globalThis !== "undefined") storySource = globalThis.StarshipStorySource || null;

  function card(id, name, romanizedName, rarity, element, accent, releaseVersion, note, image, backgroundImage) {
    return Object.freeze({
      id: id,
      name: name,
      romanizedName: romanizedName,
      rarity: rarity,
      element: element,
      accent: accent,
      releaseVersion: releaseVersion,
      note: note || "",
      image: image || null,
      backgroundImage: backgroundImage || image || null,
      // 原始立繪保留給卡池縮圖；完整角色頁使用程式產生的 SVG 標籤版，
      // 讓角色名稱、星級、元素不依賴 AI 文字，也不會裁掉全身。
      portraitImage: image ? (String(image).toLowerCase().endsWith(".svg") ? image : "./assets/cards/complete/" + id + ".svg") : null
    });
  }

  // 只收錄文件與本次版本規劃中的角色；2.0–2.5 會在本次大更新加入限定池，
  // 3.0–4.5 先完整建檔，等版本公告後再開放。
  var cards = {
    celesia: card("celesia", "瑟蕾雅", "Celesia", 4, "星", "#9e92ff", "1.0", "1.0｜繪圖信使、協作劍士；界痕調查與北行動機", "./assets/cards/celesia.png"),
    reyn: card("reyn", "雷恩", "Reyn", 3, "燕", "#78a4c8", "1.0", "1.0｜獸靈之村巡林人", "./assets/cards/reyn.png"),
    lia: card("lia", "莉亞", "Lia", 3, "星", "#9bbdff", "1.0", "1.0｜獸靈之村醫療輔助", "./assets/cards/lia.png"),
    isar: card("isar", "伊薩爾", "Isar", 3, "烈", "#c88755", "1.0", "1.0｜大型獸人獵人、村長；三星原稿保留", "./assets/cards/isar.png"),
    rena: card("rena", "蕾娜", "Rena", 3, "烈", "#f08a65", "1.3", "1.3｜洛汀港打撈信使；三星原稿保留", "./assets/cards/rena.png"),
    eda: card("eda", "艾妲", "Eda", 4, "星", "#f4c66b", "1.4", "1.4｜彼岸鐘庭校準師", "./assets/cards/eda.png"),
    veyra: card("veyra", "薇珂", "Veyra", 4, "淨", "#57d9c0", "1.2", "1.2｜獨立測量師、水工顧問", "./assets/cards/veyra.png"),
    harlow: card("harlow", "赫洛", "Harlow", 4, "烈", "#ff795c", "1.2", "1.2｜橋樑匠；遺構測量與撤退方案", "./assets/cards/harlow.png"),
    elorna: card("elorna", "艾洛娜", "Elorna", 4, "淨", "#64d7c6", "1.3", "1.3｜水工署外勤測量師", "./assets/cards/elorna.png"),
    chodan: card("chodan", "Chodan", "Chodan", 4, "月", "#91a8d8", "1.0", "1.0｜旅行鼓手；月式卡面", "./assets/cards/chodan.png"),
    magenta: card("magenta", "Magenta", "Magenta", 4, "烈", "#ff71b8", "1.0", "1.0｜QWER 旅行貝斯手", "./assets/cards/magenta.png"),
    hina: card("hina", "Hina", "Hina", 4, "燕", "#6fa8ff", "1.1", "1.1｜QWER 旅行吉他手", "./assets/cards/hina.png"),
    siyeon: card("siyeon", "Siyeon", "Siyeon", 4, "淨", "#b7e9d6", "1.1", "1.1｜QWER 旅行歌手與拾音師", "./assets/cards/siyeon.png"),
    mave: card("mave", "梅芙", "Mave", 4, "幻", "#d06cff", "1.5", "1.5｜公共檔案仲裁官", "./assets/cards/mave.png"),
    risan: card("risan", "璃珊", "Risan", 4, "幻", "#c08cff", "2.0", "2.0｜潮汐書庫檔案員、海圖師", "./assets/cards/risan.png"),
    yaoze: card("yaoze", "曜澤", "Yaoze", 4, "月", "#91b9e8", "2.0", "2.0｜白帆岬燈塔守望員", "./assets/cards/yaoze.png"),
    maro: card("maro", "瑪洛", "Maro", 3, "淨", "#86dbc9", "2.0", "2.0｜診所實習生、地址站助手", "./assets/cards/maro.png"),

    // 2.1–2.5 已在文件中存在，但依目前指示先不加入本期卡池。
    evelyn: card("evelyn", "伊芙琳", "Evelyn", 4, "幻", "#c08cff", "2.1", "2.1｜鏡潮島回聲譯者、記錄仲裁師", "./assets/cards/evelyn.png"),
    mirea: card("mirea", "澪歌", "Mirea", 4, "月", "#91b9e8", "2.2", "2.2｜深潮測線引航師", "./assets/cards/mirea.png"),
    ferye: card("ferye", "菲芮", "Ferye", 4, "燕", "#6fa8ff", "2.3", "2.3｜風廊測量師、航路維護者", "./assets/cards/ferye.png"),
    noreia: card("noreia", "諾芮亞", "Noreia", 4, "星", "#9e92ff", "2.4", "2.4｜霧鏡議庭見證記錄員", "./assets/cards/noreia.png"),
    orivelle: card("orivelle", "奧薇拉", "Orivelle", 4, "淨", "#57d9c0", "2.5", "2.5｜潮眼外圍潮核修復師", "./assets/cards/orivelle.png"),

    // 文件「角色圖鑑｜第三大版本」：每個版本至少一名 4★。
    jiera: card("jiera", "霽羅", "Jiera", 4, "星", "#86c8d7", "3.0", "3.0｜古道碑記修復師、口述地圖記錄員", "./assets/cards/jiera.png"),
    rotea: card("rotea", "蘿堤亞", "Rotea", 4, "幻", "#b995e8", "3.1", "3.1｜內陸回覆台編譯師、格式修復者", "./assets/cards/rotea.png"),
    sumine: card("sumine", "澄音", "Sumine", 4, "淨", "#74d8d0", "3.2", "3.2｜白榆河水路修復隊輪班工", "./assets/cards/sumine.png"),
    lorne: card("lorne", "洛恩", "Lorne", 4, "烈", "#e37c52", "3.3", "3.3｜鍛路鎮鍛路師、熱管維護者", "./assets/cards/lorne.png"),
    cenya: card("cenya", "岑芽", "Cenya", 3, "淨", "#77d8d1", "3.2", "3.2｜白榆河水路修復隊學徒；偶發三星設計", "./assets/cards/cenya.png"),
    norell: card("norell", "諾嵐", "Norell", 4, "月", "#86b8e8", "3.4", "3.4｜北門風路測量員、臨時回覆台守望者", "./assets/cards/norell.png"),
    aster: card("aster", "艾斯特", "Aster", 4, "烈", "#e88955", "3.5", "3.5｜終端檔案守門人、空白座看火者", "./assets/cards/aster.png"),

    // 第四大版本角色：先建立完整圖鑑與戰鬥資料，卡池等後續版本公告。
    aurelia: card("aurelia", "奧蕾雅", "Aurelia", 4, "星", "#f2c86d", "4.0", "4.0｜曙港天文台值班長、星潮觀測者", "./assets/cards/aurelia.svg"),
    kairen: card("kairen", "凱嵐", "Kairen", 4, "烈", "#e98058", "4.1", "4.1｜碎星工坊維修師、熱源調度員", "./assets/cards/kairen.svg"),
    sorae: card("sorae", "索萊", "Sorae", 4, "燕", "#70b7ff", "4.2", "4.2｜遠望塔信標師、長距離回覆校準者", "./assets/cards/sorae.svg"),
    talia: card("talia", "塔莉亞", "Talia", 3, "淨", "#76d9c7", "4.2", "4.2｜遠望塔見習修復員；偶發三星設計", "./assets/cards/talia.svg"),
    neve: card("neve", "涅芙", "Neve", 4, "幻", "#c18cff", "4.3", "4.3｜白夜航路記憶領航員、失效訊息整理者", "./assets/cards/neve.svg"),
    kael: card("kael", "凱爾", "Kael", 4, "月", "#88aee8", "4.4", "4.4｜回覆海溝潛航隊長、深層訊號守門人", "./assets/cards/kael.svg"),
    elyra: card("elyra", "伊萊拉", "Elyra", 4, "淨", "#65d7c7", "4.5", "4.5｜第二條律的起草人、可撤回協議保管者", "./assets/cards/elyra.svg")
  };

  var legacyCards = [
    cards.celesia, cards.reyn, cards.lia, cards.isar, cards.rena, cards.eda,
    cards.veyra, cards.harlow, cards.elorna, cards.chodan, cards.magenta,
    cards.hina, cards.siyeon, cards.mave
  ];
  var version2Cards = [cards.risan, cards.yaoze, cards.maro, cards.evelyn, cards.mirea, cards.ferye, cards.noreia, cards.orivelle];
  var version4Cards = [cards.aurelia, cards.kairen, cards.sorae, cards.talia, cards.neve, cards.kael, cards.elyra];

  // 本次大更新開放劇情與 2.0–2.5 角色；1.0–1.5 卡池仍保留，讓舊角色不會消失。
  var activeCards = [
    ...legacyCards, ...version2Cards
  ];
  var legacyFour = legacyCards.filter(function (item) { return item.rarity === 4; });
  var legacyThree = legacyCards.filter(function (item) { return item.rarity === 3; });
  var activeFour = activeCards.filter(function (item) { return item.rarity === 4; });
  var activeThree = activeCards.filter(function (item) { return item.rarity === 3; });
  var futureCards = [cards.jiera, cards.rotea, cards.sumine, cards.cenya, cards.lorne, cards.norell, cards.aster, ...version4Cards];
  var version2Four = version2Cards.filter(function (item) { return item.rarity === 4; });
  var version2Three = version2Cards.filter(function (item) { return item.rarity === 3; });
  var version3Cards = [cards.jiera, cards.rotea, cards.sumine, cards.cenya, cards.lorne, cards.norell, cards.aster];

  // 星界試煉的自走棋數值；4★ 的基礎戰力整體高於 3★，但不是單一數值碾壓。
  // attackName / skillName 會直接出現在戰報，讓每個角色有自己的攻擊手段。
  var characterBattleStats = {
    celesia: { rarity: 4, role: "指揮", maxHp: 1150, attack: 180, defense: 125, speed: 110, range: 2, attackName: "星式協作斬", skillName: "星痕指令", skillPower: 1.35, skillEffect: "攻擊並讓全隊下一輪傷害提升" },
    reyn: { rarity: 3, role: "守衛", maxHp: 1050, attack: 115, defense: 125, speed: 82, range: 1, attackName: "巡林短弓", skillName: "巡林掩護", skillPower: 1.05, skillEffect: "降低下一次受到的傷害" },
    lia: { rarity: 3, role: "治療", maxHp: 850, attack: 90, defense: 90, speed: 105, range: 2, attackName: "星光藥針", skillName: "回覆援護", skillPower: 1.2, skillEffect: "回復隊伍生命" },
    isar: { rarity: 3, role: "獵人", maxHp: 1180, attack: 140, defense: 105, speed: 70, range: 1, attackName: "獵線重擊", skillName: "大型獵擊", skillPower: 1.5, skillEffect: "對當前目標造成重擊" },
    rena: { rarity: 3, role: "斥候", maxHp: 870, attack: 140, defense: 80, speed: 125, range: 2, attackName: "潮港突刺", skillName: "港口快訊", skillPower: 1.25, skillEffect: "優先攻擊生命最低的敵人" },
    eda: { rarity: 4, role: "校準", maxHp: 1060, attack: 150, defense: 115, speed: 95, range: 2, attackName: "鐘針校準", skillName: "彼岸校準", skillPower: 1.15, skillEffect: "清除隊伍的一次負面狀態" },
    veyra: { rarity: 4, role: "測量", maxHp: 1080, attack: 155, defense: 125, speed: 88, range: 2, attackName: "水位讀值", skillName: "水工讀值", skillPower: 1.2, skillEffect: "降低敵方防禦" },
    harlow: { rarity: 4, role: "重裝", maxHp: 1550, attack: 125, defense: 185, speed: 60, range: 1, attackName: "橋錘破陣", skillName: "橋樑壁壘", skillPower: 1.1, skillEffect: "吸收下一次敵方攻擊" },
    elorna: { rarity: 4, role: "支援", maxHp: 1020, attack: 135, defense: 120, speed: 100, range: 2, attackName: "外勤標記", skillName: "外勤回報", skillPower: 1.15, skillEffect: "提升全隊防禦" },
    chodan: { rarity: 4, role: "節奏", maxHp: 1060, attack: 145, defense: 105, speed: 115, range: 2, attackName: "月式鼓擊", skillName: "月式鼓點", skillPower: 1.25, skillEffect: "提升全隊速度" },
    magenta: { rarity: 4, role: "爆發", maxHp: 1120, attack: 185, defense: 95, speed: 118, range: 2, attackName: "低音震波", skillName: "旅行低音", skillPower: 1.4, skillEffect: "對相鄰敵人造成濺射傷害" },
    hina: { rarity: 4, role: "射手", maxHp: 1040, attack: 195, defense: 90, speed: 112, range: 3, attackName: "弦音箭", skillName: "弦音標記", skillPower: 1.35, skillEffect: "標記目標，下一次攻擊追加傷害" },
    siyeon: { rarity: 4, role: "拾音", maxHp: 1080, attack: 145, defense: 120, speed: 110, range: 2, attackName: "回音脈衝", skillName: "回音採集", skillPower: 1.15, skillEffect: "回復一名受傷隊友" },
    mave: { rarity: 4, role: "仲裁", maxHp: 1120, attack: 165, defense: 130, speed: 102, range: 2, attackName: "索引裁切", skillName: "公共索引", skillPower: 1.3, skillEffect: "重新排列敵方目標並造成傷害" },
    risan: { rarity: 4, role: "支援", maxHp: 1100, attack: 175, defense: 115, speed: 102, range: 2, attackName: "潮圖切頁", skillName: "無地址索引", skillPower: 1.3, skillEffect: "讓隊伍下一輪攻擊更容易命中並整理敵方目標" },
    yaoze: { rarity: 4, role: "重裝", maxHp: 1280, attack: 150, defense: 145, speed: 76, range: 2, attackName: "燈塔訊號", skillName: "白帆守望", skillPower: 1.12, skillEffect: "為隊伍架起護盾並降低敵方速度" },
    maro: { rarity: 3, role: "治療", maxHp: 820, attack: 86, defense: 92, speed: 104, range: 2, attackName: "地址藥包", skillName: "診所交接", skillPower: 1.1, skillEffect: "回復生命最低的隊友" },
    evelyn: { rarity: 4, role: "仲裁", maxHp: 1060, attack: 168, defense: 112, speed: 108, range: 2, attackName: "鏡潮譯讀", skillName: "保留原句", skillPower: 1.28, skillEffect: "清除一個敵方增益並保留未翻譯訊息" },
    mirea: { rarity: 4, role: "支援", maxHp: 1080, attack: 160, defense: 118, speed: 112, range: 3, attackName: "深潮定向", skillName: "潮線引航", skillPower: 1.24, skillEffect: "提升全隊速度並降低敵方防禦" },
    ferye: { rarity: 4, role: "斥候", maxHp: 1000, attack: 180, defense: 100, speed: 125, range: 3, attackName: "風廊飛標", skillName: "航路維護", skillPower: 1.34, skillEffect: "優先攻擊生命最低的敵人並追加標記" },
    noreia: { rarity: 4, role: "指揮", maxHp: 1040, attack: 155, defense: 124, speed: 98, range: 2, attackName: "星證落筆", skillName: "見證留檔", skillPower: 1.18, skillEffect: "提升全隊防禦並將一次失敗判定改為等待" },
    orivelle: { rarity: 4, role: "支援", maxHp: 1150, attack: 145, defense: 136, speed: 94, range: 2, attackName: "潮核扳手", skillName: "潮眼修復", skillPower: 1.16, skillEffect: "回復隊伍並降低敵方攻擊" },
    jiera: { rarity: 4, role: "測量", maxHp: 1100, attack: 158, defense: 128, speed: 106, range: 2, attackName: "拓印定標", skillName: "可撤回路線", skillPower: 1.28, skillEffect: "標記敵人並讓隊伍獲得一次撤退護盾" },
    rotea: { rarity: 4, role: "編譯", maxHp: 1040, attack: 170, defense: 105, speed: 118, range: 2, attackName: "幻式編譯", skillName: "保留未知", skillPower: 1.32, skillEffect: "將敵方下一次增益改為不確定狀態" },
    sumine: { rarity: 4, role: "修復", maxHp: 1160, attack: 142, defense: 145, speed: 92, range: 2, attackName: "水輪切流", skillName: "四段分流", skillPower: 1.2, skillEffect: "回復隊伍並降低敵方速度" },
    lorne: { rarity: 4, role: "鍛路", maxHp: 1280, attack: 178, defense: 138, speed: 86, range: 1, attackName: "鍛路重錘", skillName: "熱管過載", skillPower: 1.45, skillEffect: "重擊目標並使其下一輪攻擊減弱" }
    ,cenya: { rarity: 3, role: "修復", maxHp: 820, attack: 88, defense: 92, speed: 108, range: 2, attackName: "水輪輕擊", skillName: "濾芯交班", skillPower: 1.12, skillEffect: "回復一名隊友並降低其受到的下一次傷害" }
    ,norell: { rarity: 4, role: "測量", maxHp: 1090, attack: 152, defense: 126, speed: 120, range: 3, attackName: "風標定向", skillName: "北門照明", skillPower: 1.26, skillEffect: "提升全隊速度並標記最脆弱的敵人" }
    ,aster: { rarity: 4, role: "守門", maxHp: 1420, attack: 176, defense: 156, speed: 88, range: 2, attackName: "空白座燼擊", skillName: "看火不佔座", skillPower: 1.38, skillEffect: "架起護盾並使敵方增益暫停一輪" }
    ,aurelia: { rarity: 4, role: "指揮", maxHp: 1180, attack: 188, defense: 132, speed: 114, range: 3, attackName: "曙光定標", skillName: "天文台校準", skillPower: 1.38, skillEffect: "提升全隊命中與攻擊，並標記最脆弱的敵人" }
    ,kairen: { rarity: 4, role: "鍛路", maxHp: 1460, attack: 182, defense: 166, speed: 82, range: 1, attackName: "碎星熱錘", skillName: "工坊分流", skillPower: 1.48, skillEffect: "重擊目標並為全隊架起短暫護盾" }
    ,sorae: { rarity: 4, role: "射手", maxHp: 1100, attack: 210, defense: 104, speed: 128, range: 4, attackName: "遠望信標", skillName: "長距離回覆", skillPower: 1.42, skillEffect: "優先攻擊後排並讓下一次協同攻擊追加傷害" }
    ,talia: { rarity: 3, role: "修復", maxHp: 900, attack: 98, defense: 98, speed: 112, range: 2, attackName: "折光扳手", skillName: "見習交班", skillPower: 1.15, skillEffect: "回復生命最低的隊友並降低其受到的下一次傷害" }
    ,neve: { rarity: 4, role: "仲裁", maxHp: 1160, attack: 180, defense: 136, speed: 106, range: 2, attackName: "白夜折頁", skillName: "記憶回收", skillPower: 1.36, skillEffect: "清除敵方增益並將一名倒下隊友拉回低生命狀態" }
    ,kael: { rarity: 4, role: "重裝", maxHp: 1680, attack: 165, defense: 205, speed: 68, range: 1, attackName: "深層鎮壓", skillName: "海溝守門", skillPower: 1.24, skillEffect: "嘲諷敵人並分攤下一輪隊伍傷害" }
    ,elyra: { rarity: 4, role: "支援", maxHp: 1240, attack: 172, defense: 150, speed: 112, range: 2, attackName: "律式回覆", skillName: "第二條律", skillPower: 1.34, skillEffect: "讓隊伍獲得可撤回的減傷，並重置一名隊友技能冷卻" }
  };

  var trialVersion = "2.0-2.5";
  var trialMaxRewards = 10;
  // 試煉每次成功都提供一大筆獨立角色經驗；每關每版本最多領 10 次，
  // 讓玩家能靠遊玩而不是靠抽卡資源養成角色。
  var trialReward = Object.freeze({ starSand: 100, tickets: 1, characterExp: 600 });
  // 星界試煉共有 30 關。除了推薦戰力逐關提升，每關也有環境與敵方特性，
  // 讓玩家需要在治療、重裝、支援與輸出之間調整編隊，而不是只比較總戰力。
  var trialStages = [
    { id: 1, name: "回覆台外圍", region: "界痕入口", recommendedPower: 420, environment: "薄霧界痕", environmentEffect: "隊伍技能冷卻略快", modifiers: { teamSpeed: 1.06 }, enemyTrait: "回聲脆弱", enemyTraitEffect: "敵人受到協同傷害時更容易失衡", trialRule: "echo", enemies: [{ name: "界痕幼體", maxHp: 560, attack: 78, defense: 38, speed: 65, count: 2 }], reward: trialReward },
    { id: 2, name: "獸靈村口", region: "獸靈之村", recommendedPower: 560, environment: "獸靈林線", environmentEffect: "隊伍防禦小幅提升", modifiers: { teamDefense: 1.04 }, enemyTrait: "先手獵襲", enemyTraitEffect: "敵人首輪速度提高", trialRule: "ambush", enemies: [{ name: "失序獸靈", maxHp: 720, attack: 92, defense: 48, speed: 70, count: 2 }], reward: trialReward },
    { id: 3, name: "北行測線", region: "北方界痕", recommendedPower: 720, environment: "北行風口", environmentEffect: "高速角色更容易搶到行動順序", modifiers: { teamSpeed: 1.1, enemySpeed: 1.04 }, enemyTrait: "獵犬追蹤", enemyTraitEffect: "敵人會優先鎖定較脆弱的角色", trialRule: "mark", enemies: [{ name: "裂痕獵犬", maxHp: 760, attack: 110, defense: 55, speed: 90, count: 2 }, { name: "裂痕巢核", maxHp: 980, attack: 82, defense: 70, speed: 48, count: 1 }], reward: trialReward },
    { id: 4, name: "移動舞台後台", region: "旅行舞台", recommendedPower: 900, environment: "移動舞台", environmentEffect: "速度提升，但技能需要更精準的輪轉", modifiers: { teamSpeed: 1.14, teamAttack: 0.98 }, enemyTrait: "噪音壓制", enemyTraitEffect: "敵方干擾會延後角色技能冷卻", trialRule: "noise", enemies: [{ name: "噪音殘響", maxHp: 880, attack: 125, defense: 60, speed: 105, count: 2 }, { name: "失焦拾音器", maxHp: 920, attack: 105, defense: 68, speed: 75, count: 1 }], reward: trialReward },
    { id: 5, name: "橋下遺構", region: "水工線", recommendedPower: 1100, environment: "橋下重壓", environmentEffect: "敵方外殼更厚，破防角色更重要", modifiers: { enemyDefense: 1.12 }, enemyTrait: "重殼", enemyTraitEffect: "敵方防禦提高，受到減防後才會明顯下降", trialRule: "shell", enemies: [{ name: "遺構鎧獸", maxHp: 1450, attack: 138, defense: 96, speed: 52, count: 2 }], reward: trialReward },
    { id: 6, name: "潮線斷口", region: "洛汀港", recommendedPower: 1320, environment: "潮線斷口", environmentEffect: "治療量降低，必須用護盾與減傷維持隊伍", modifiers: { healing: 0.82, enemyAttack: 1.04 }, enemyTrait: "潮蝕", enemyTraitEffect: "敵人命中後會降低受治療量", trialRule: "corrosion", enemies: [{ name: "潮痕寄生體", maxHp: 1180, attack: 155, defense: 88, speed: 108, count: 2 }, { name: "潮核", maxHp: 1550, attack: 124, defense: 108, speed: 56, count: 1 }], reward: trialReward },
    { id: 7, name: "鐘庭外廊", region: "彼岸鐘庭", recommendedPower: 1560, environment: "逆時鐘庭", environmentEffect: "每三回合敵方會重新取得先手", modifiers: { enemySpeed: 1.12 }, enemyTrait: "逆時", enemyTraitEffect: "敵方技能週期縮短，不能只靠單一輸出", trialRule: "time", enemies: [{ name: "逆時鐘影", maxHp: 1420, attack: 178, defense: 102, speed: 112, count: 2 }, { name: "鐘庭守門核", maxHp: 1800, attack: 145, defense: 125, speed: 60, count: 1 }], reward: trialReward },
    { id: 8, name: "公共檔案庫下層", region: "公共檔案庫", recommendedPower: 1820, environment: "公共檔案庫", environmentEffect: "敵方會複寫一次增益，清除與控場更有價值", modifiers: { enemyAttack: 1.05, enemyDefense: 1.06 }, enemyTrait: "空白複寫", enemyTraitEffect: "敵人首次施放技能時會獲得短暫護盾", trialRule: "copy", enemies: [{ name: "刪節檔案獸", maxHp: 1700, attack: 195, defense: 128, speed: 92, count: 2 }, { name: "空白頁", maxHp: 2100, attack: 158, defense: 145, speed: 58, count: 1 }], reward: trialReward },
    { id: 9, name: "五線回覆門", region: "1.0–1.5 交界", recommendedPower: 2100, environment: "多重交界", environmentEffect: "隊伍攻擊略升，但敵方會集中火力", modifiers: { teamAttack: 1.04, enemyAttack: 1.1 }, enemyTrait: "多重界痕", enemyTraitEffect: "敵人會標記同一目標，重裝與治療需要互相配合", trialRule: "multi", enemies: [{ name: "多重界痕體", maxHp: 2050, attack: 220, defense: 145, speed: 118, count: 2 }, { name: "交界核心", maxHp: 2450, attack: 185, defense: 165, speed: 64, count: 1 }], reward: trialReward },
    { id: 10, name: "星界試煉終端", region: "回覆中樞", recommendedPower: 2440, environment: "回覆中樞", environmentEffect: "終端首領開場帶有護盾，先破盾再爆發", modifiers: { enemyAttack: 1.12, enemyDefense: 1.1 }, enemyTrait: "終端護盾", enemyTraitEffect: "首領與護衛開場持有一次性護盾", trialRule: "shield", milestone: "trial10Choice", enemies: [{ name: "終端界痕王", maxHp: 3300, attack: 255, defense: 190, speed: 105, count: 1 }, { name: "終端護衛", maxHp: 2200, attack: 210, defense: 155, speed: 122, count: 2 }], reward: trialReward },
    { id: 11, name: "北門風路", region: "北門高地", recommendedPower: 2700, environment: "北門風路", environmentEffect: "速度與標記效果提高，但敵方會快速反擊", modifiers: { teamSpeed: 1.08, enemySpeed: 1.08, enemyAttack: 1.05 }, enemyTrait: "風標鎖定", enemyTraitEffect: "敵方首領會標記生命最低者", trialRule: "mark", enemies: [{ name: "風路獵影", maxHp: 3000, attack: 245, defense: 170, speed: 142, count: 2 }, { name: "北門風核", maxHp: 3800, attack: 220, defense: 185, speed: 78, count: 1 }], reward: trialReward },
    { id: 12, name: "白榆河上游", region: "白榆河", recommendedPower: 3000, environment: "白榆河分流", environmentEffect: "每次治療也會清除一層潮蝕", modifiers: { healing: 0.9, teamDefense: 1.05 }, enemyTrait: "分流反噬", enemyTraitEffect: "敵方核心被擊中時會反擊一次", trialRule: "corrosion", enemies: [{ name: "分流寄生體", maxHp: 3300, attack: 265, defense: 180, speed: 118, count: 2 }, { name: "白榆蓄水核", maxHp: 4300, attack: 230, defense: 210, speed: 66, count: 1 }], reward: trialReward },
    { id: 13, name: "四段水路", region: "白榆河", recommendedPower: 3350, environment: "四段水路", environmentEffect: "支援角色的防禦與速度效果延長", modifiers: { teamDefense: 1.08, teamSpeed: 1.04 }, enemyTrait: "交班中斷", enemyTraitEffect: "敵人會在技能命中後暫停隊伍增益", trialRule: "noise", enemies: [{ name: "交班斷流獸", maxHp: 3800, attack: 285, defense: 205, speed: 104, count: 2 }, { name: "四段閘核", maxHp: 5000, attack: 245, defense: 235, speed: 62, count: 1 }], reward: trialReward },
    { id: 14, name: "鍛路鎮熱管", region: "鍛路鎮", recommendedPower: 3700, environment: "鍛路熱管", environmentEffect: "爆發傷害提高，但敵方攻擊也會升溫", modifiers: { teamAttack: 1.08, enemyAttack: 1.12 }, enemyTrait: "過載火線", enemyTraitEffect: "首領每三回合強化下一次攻擊", trialRule: "overload", enemies: [{ name: "熱管鎧獸", maxHp: 4300, attack: 315, defense: 220, speed: 86, count: 2 }, { name: "過載火核", maxHp: 5600, attack: 285, defense: 250, speed: 70, count: 1 }], reward: trialReward },
    { id: 15, name: "空白座前庭", region: "鍛路鎮", recommendedPower: 4100, environment: "空白座前庭", environmentEffect: "首領受到控場與減防時更脆弱", modifiers: { enemyDefense: 1.14, teamAttack: 1.03 }, enemyTrait: "空座守門", enemyTraitEffect: "護衛倒下前會替首領分攤部分傷害", trialRule: "guard", enemies: [{ name: "空座守衛", maxHp: 4200, attack: 300, defense: 245, speed: 108, count: 2 }, { name: "空白座守門人", maxHp: 7200, attack: 340, defense: 275, speed: 74, count: 1 }], reward: trialReward },
    { id: 16, name: "北門回頭點", region: "北門高地", recommendedPower: 4550, environment: "可回頭測線", environmentEffect: "隊伍速度提高，失敗時會保留部分護盾", modifiers: { teamSpeed: 1.12, teamDefense: 1.05 }, enemyTrait: "退回陷阱", enemyTraitEffect: "敵人會把低血量角色拉回攻擊順序", trialRule: "mark", enemies: [{ name: "退回獵影", maxHp: 5000, attack: 345, defense: 260, speed: 150, count: 2 }, { name: "回頭風核", maxHp: 6500, attack: 310, defense: 285, speed: 82, count: 1 }], reward: trialReward },
    { id: 17, name: "終端檔案門", region: "星界終端", recommendedPower: 5050, environment: "終端檔案門", environmentEffect: "敵方技能帶有清除增益效果", modifiers: { enemyAttack: 1.14, enemyDefense: 1.12 }, enemyTrait: "檔案覆寫", enemyTraitEffect: "敵方首領會清除隊伍一個正面效果", trialRule: "copy", enemies: [{ name: "覆寫檔案獸", maxHp: 5600, attack: 380, defense: 290, speed: 116, count: 2 }, { name: "終端索引核", maxHp: 7600, attack: 340, defense: 320, speed: 76, count: 1 }], reward: trialReward },
    { id: 18, name: "最後回覆台", region: "星界終端", recommendedPower: 5600, environment: "最後回覆台", environmentEffect: "治療與護盾效率取決於隊伍角色多樣性", modifiers: { healing: 0.86, enemyAttack: 1.16 }, enemyTrait: "最後回覆", enemyTraitEffect: "敵人生命越低，攻擊越高", trialRule: "execute", enemies: [{ name: "終末界痕體", maxHp: 6300, attack: 405, defense: 310, speed: 126, count: 2 }, { name: "最後回覆核", maxHp: 8300, attack: 365, defense: 340, speed: 84, count: 1 }], reward: trialReward },
    { id: 19, name: "星界邊緣線", region: "星界終端", recommendedPower: 6200, environment: "星界邊緣線", environmentEffect: "所有效果波動加劇，隊伍協同會直接影響勝負", modifiers: { teamAttack: 1.06, teamDefense: 0.96, enemyAttack: 1.18, enemyDefense: 1.16 }, enemyTrait: "邊緣崩解", enemyTraitEffect: "敵人會隨回合增加傷害，速戰與續航都重要", trialRule: "decay", enemies: [{ name: "邊緣崩解體", maxHp: 7000, attack: 430, defense: 330, speed: 138, count: 2 }, { name: "邊緣中樞", maxHp: 9200, attack: 390, defense: 365, speed: 90, count: 1 }], reward: trialReward },
    { id: 20, name: "星界之律終局", region: "星界終端", recommendedPower: 6900, environment: "星界之律終局", environmentEffect: "終局首領會輪換護盾、增傷與壓制，必須完整運用隊伍配合", modifiers: { teamAttack: 1.05, teamDefense: 1.02, enemyAttack: 1.2, enemyDefense: 1.18 }, enemyTrait: "終局輪換", enemyTraitEffect: "首領每三回合輪換一種戰鬥姿態", trialRule: "finale", enemies: [{ name: "終局護衛", maxHp: 7800, attack: 450, defense: 350, speed: 148, count: 2 }, { name: "星界之律王座", maxHp: 13000, attack: 470, defense: 390, speed: 92, count: 1 }], reward: trialReward },
    { id: 21, name: "潮汐書庫外環", region: "潮汐書庫", recommendedPower: 7350, environment: "潮汐書頁", environmentEffect: "每兩回合會交換敵我速度排序，先手不代表永遠先手", modifiers: { teamSpeed: 1.06, enemySpeed: 1.1, enemyAttack: 1.06 }, enemyTrait: "書頁倒流", enemyTraitEffect: "敵方會短暫複製上一個被擊倒單位的增益", trialRule: "time", enemies: [{ name: "倒流書獸", maxHp: 8200, attack: 455, defense: 360, speed: 132, count: 2 }, { name: "潮汐索引核", maxHp: 9800, attack: 420, defense: 390, speed: 88, count: 1 }], reward: trialReward },
    { id: 22, name: "白帆岬燈路", region: "白帆岬", recommendedPower: 7850, environment: "白帆逆光", environmentEffect: "遠程角色命中提高，但敵方護衛會優先切入後排", modifiers: { teamAttack: 1.06, enemySpeed: 1.12, enemyDefense: 1.08 }, enemyTrait: "燈路切入", enemyTraitEffect: "敵人會繞過前排並標記後排最低生命角色", trialRule: "mark", enemies: [{ name: "白帆切入獸", maxHp: 8700, attack: 470, defense: 365, speed: 156, count: 2 }, { name: "岬角燈核", maxHp: 10400, attack: 430, defense: 410, speed: 96, count: 1 }], reward: trialReward },
    { id: 23, name: "鏡潮島裂面", region: "鏡潮島", recommendedPower: 8400, environment: "折光裂面", environmentEffect: "正面增益會被折射一次，清除與重新施放需要輪轉", modifiers: { healing: 0.9, enemyAttack: 1.1, enemyDefense: 1.08 }, enemyTrait: "鏡像誤讀", enemyTraitEffect: "敵方會把第一個正面效果轉成自身護盾", trialRule: "copy", enemies: [{ name: "鏡像拾荒獸", maxHp: 9300, attack: 500, defense: 390, speed: 120, count: 2 }, { name: "折光主鏡", maxHp: 11800, attack: 450, defense: 430, speed: 82, count: 1 }], reward: trialReward },
    { id: 24, name: "深潮測線", region: "深潮測線", recommendedPower: 9000, environment: "低壓深潮", environmentEffect: "治療與護盾效率降低，但控制成功後敵方會暴露弱點", modifiers: { healing: 0.78, teamDefense: 1.08, enemyAttack: 1.12 }, enemyTrait: "深潮壓迫", enemyTraitEffect: "敵方每次命中都會疊加潮蝕，支援與淨化不可缺少", trialRule: "corrosion", enemies: [{ name: "深潮寄生體", maxHp: 10200, attack: 525, defense: 405, speed: 126, count: 2 }, { name: "深潮閘核", maxHp: 12500, attack: 465, defense: 450, speed: 76, count: 1 }], reward: trialReward },
    { id: 25, name: "風廊維護線", region: "風廊", recommendedPower: 9650, environment: "高空風廊", environmentEffect: "速度波動加劇，角色連續行動時傷害提高", modifiers: { teamSpeed: 1.12, enemySpeed: 1.14, teamDefense: 0.98 }, enemyTrait: "風廊追擊", enemyTraitEffect: "敵方會在連續兩次行動後獲得追擊", trialRule: "ambush", enemies: [{ name: "風廊追獵者", maxHp: 10900, attack: 560, defense: 420, speed: 168, count: 2 }, { name: "風廊信標獸", maxHp: 13200, attack: 490, defense: 455, speed: 102, count: 1 }], reward: trialReward },
    { id: 26, name: "霧鏡議庭前廊", region: "霧鏡議庭", recommendedPower: 10350, environment: "霧鏡審理場", environmentEffect: "每三回合重新判定一個角色的目標，隊伍需要多功能定位", modifiers: { enemyAttack: 1.14, enemyDefense: 1.1, teamAttack: 1.04 }, enemyTrait: "審理標記", enemyTraitEffect: "被標記角色受到更多傷害，但也能對首領造成額外破防", trialRule: "multi", enemies: [{ name: "霧鏡執行獸", maxHp: 11600, attack: 585, defense: 445, speed: 142, count: 2 }, { name: "議庭判決核", maxHp: 14100, attack: 520, defense: 490, speed: 86, count: 1 }], reward: trialReward },
    { id: 27, name: "潮眼修復井", region: "潮眼外圍", recommendedPower: 11100, environment: "潮眼脈動", environmentEffect: "敵方護盾會依生命比例重建，爆發與持續傷害都要安排", modifiers: { enemyDefense: 1.14, enemyAttack: 1.12, healing: 0.88 }, enemyTrait: "護盾回潮", enemyTraitEffect: "首領每四回合重建護盾，打斷技能可以延後回潮", trialRule: "shield", enemies: [{ name: "回潮鎧獸", maxHp: 12600, attack: 610, defense: 475, speed: 110, count: 2 }, { name: "潮眼修復核", maxHp: 15400, attack: 540, defense: 530, speed: 72, count: 1 }], reward: trialReward },
    { id: 28, name: "第二條律試讀室", region: "星界終端二層", recommendedPower: 11900, environment: "試讀規則場", environmentEffect: "隊伍第一次倒下不會立刻出局，但會留下永久減益", modifiers: { teamAttack: 1.08, enemyAttack: 1.16, enemyDefense: 1.12 }, enemyTrait: "規則覆寫", enemyTraitEffect: "首領會在血量低於一半時改寫一條環境規則", trialRule: "copy", enemies: [{ name: "覆寫規則獸", maxHp: 13600, attack: 640, defense: 500, speed: 132, count: 2 }, { name: "試讀王座", maxHp: 16800, attack: 575, defense: 560, speed: 80, count: 1 }], reward: trialReward },
    { id: 29, name: "新曙港邊界", region: "新曙港", recommendedPower: 12750, environment: "新曙潮線", environmentEffect: "所有角色技能效果提高，但敵方會隨回合增加攻擊", modifiers: { teamAttack: 1.1, teamSpeed: 1.04, enemyAttack: 1.18, enemyDefense: 1.14 }, enemyTrait: "曙潮增壓", enemyTraitEffect: "敵方每回合獲得增傷，必須在有限回合內完成突破", trialRule: "decay", enemies: [{ name: "曙潮崩解體", maxHp: 14800, attack: 670, defense: 530, speed: 150, count: 2 }, { name: "新曙邊界核", maxHp: 18200, attack: 600, defense: 590, speed: 92, count: 1 }], reward: trialReward },
    { id: 30, name: "星界之律第二終局", region: "第二條律終端", recommendedPower: 13700, environment: "第二條律終局", environmentEffect: "首領輪換護盾、封鎖與反擊三種姿態，必須完整運用隊伍協同", modifiers: { teamAttack: 1.08, teamDefense: 1.04, enemyAttack: 1.22, enemyDefense: 1.18 }, enemyTrait: "三律輪換", enemyTraitEffect: "首領每三回合更換姿態，錯誤的爆發時機會使全隊陷入反擊", trialRule: "finale", finalStage: true, enemies: [{ name: "第二律護衛", maxHp: 16400, attack: 700, defense: 575, speed: 174, count: 2 }, { name: "第二條律王座", maxHp: 22000, attack: 730, defense: 640, speed: 104, count: 1 }], reward: trialReward }
  ];

  var dispatchVersion = "2.0-2.5";
  var dispatchMissions = [
    { id: "dispatch-library", name: "潮汐書庫抄錄", region: "潮汐書庫", description: "把失散的索引頁送回書庫外環，適合均衡隊伍。", recommendedPower: 1350, environment: "書頁風", environmentEffect: "速度較快的角色更容易連續行動", modifiers: { teamSpeed: 1.08 }, enemyTrait: "索引散落", enemyTraitEffect: "敵人生命偏低但數量較多", trialRule: "echo", enemies: [{ name: "索引書獸", maxHp: 1600, attack: 160, defense: 105, speed: 96, count: 2 }, { name: "散頁核", maxHp: 2100, attack: 145, defense: 130, speed: 62, count: 1 }], reward: { starSand: 180, characterExp: 1200, echoPowder: 4 } },
    { id: "dispatch-lighthouse", name: "白帆岬補燈", region: "白帆岬", description: "替燈塔補上夜間回覆信標，重裝或支援角色能穩定完成。", recommendedPower: 1900, environment: "白帆夜潮", environmentEffect: "隊伍防禦提高，但治療效率略降", modifiers: { teamDefense: 1.08, healing: 0.9 }, enemyTrait: "潮夜巡獵", enemyTraitEffect: "敵方會優先攻擊速度最高的角色", trialRule: "mark", enemies: [{ name: "夜潮獵影", maxHp: 2300, attack: 205, defense: 142, speed: 125, count: 2 }, { name: "白帆燈核", maxHp: 2900, attack: 185, defense: 168, speed: 70, count: 1 }], reward: { starSand: 220, characterExp: 1500, tickets: 1 } },
    { id: "dispatch-mirror", name: "鏡潮回收", region: "鏡潮島", description: "回收被折光分裂的回覆片段，清除與控場會帶來額外優勢。", recommendedPower: 2550, environment: "鏡潮折光", environmentEffect: "敵方增益會短暫反射，爆發時機很重要", modifiers: { enemyAttack: 1.08, enemyDefense: 1.06, teamAttack: 1.04 }, enemyTrait: "折光護盾", enemyTraitEffect: "敵方首次施放技能後獲得一次性護盾", trialRule: "shield", enemies: [{ name: "折光拾荒獸", maxHp: 3000, attack: 245, defense: 180, speed: 105, count: 2 }, { name: "鏡潮主核", maxHp: 3900, attack: 220, defense: 208, speed: 74, count: 1 }], reward: { starSand: 260, characterExp: 1800, starMarks: 1 } }
  ];

  // 劇情入口開放文件 1.0–2.5；每幕由前端與後端共用 id，完成獎勵才能安全地只領一次。
  var tutorialReward = Object.freeze({ starSand: 600, tickets: 2, characterExp: 600 });
  var tutorialSteps = Object.freeze([
    Object.freeze({ id: "account", icon: "✦", title: "先看懂你的星界帳號", copy: "進度會綁定遊戲名稱與密碼；登入後抽卡、資源、保底、角色與劇情完成狀態都會自動保存。" }),
    Object.freeze({ id: "lobby", icon: "◇", title: "從星界之律大廳出發", copy: "大廳的劇情、抽卡、角色培養、星界試煉、星港委託、公告與本教學都必須登入後才能使用。" }),
    Object.freeze({ id: "story", icon: "◈", title: "閱讀劇情並取得星砂", copy: "主線與支線 1.0–2.5 已開放。每幕首次完成可獲得 100 星砂，長篇正文可在劇情頁直接閱讀。" }),
    Object.freeze({ id: "gacha", icon: "✧", title: "了解回覆召集", copy: "限定 4★ 可先選目標；前 20 抽不出 4★，第 21 抽起機率逐步提高，第 50 抽必定出 4★。歪到其他 4★ 會有星砂補償。" }),
    Object.freeze({ id: "growth", icon: "⬡", title: "培養與戰力", copy: "角色培養會提升生命、攻擊、防禦、速度與戰力；重複角色會增加命座並留下該角色專用晶核。三星與四星的基礎數值和成長倍率不同。" }),
    Object.freeze({ id: "trial", icon: "✹", title: "星界試煉與隊伍協同", copy: "最多派出 4 名角色。每關會顯示推薦戰力、敵人數值與特性；總戰力只是參考，治療、護盾、減防、速度和技能搭配都會影響勝負。" }),
    Object.freeze({ id: "dispatch", icon: "⌁", title: "用額外玩法取得養成資源", copy: "星港委託是每版本一次的短篇戰鬥任務，能取得星砂、角色經驗、共鳴券或星痕；版本更新後任務進度會重置，角色不會消失。" })
  ]);
  var announcements = Object.freeze([
    Object.freeze({ id: "update-2.0-2.5", badge: "大更新", date: "2.0–2.5", title: "第二大版本｜潮眼回覆正式開放", copy: "主線與支線 1.0–2.5 已接入長篇閱讀器；2.0–2.5 角色、星界試煉與星港委託一起加入星界之律大廳。", reward: "+3,200 星砂更新獎勵；每個帳號可領取一次。", highlights: ["劇情正文不再只顯示標題", "星界試煉擴充為 30 關", "版本進度更新不會刪除角色與培養資料"] }),
    Object.freeze({ id: "tutorial-launch", badge: "新手支援", date: "本次更新", title: "新手教學上線", copy: "第一次進入大廳後，可以從新手教學快速了解劇情、抽卡、培養、戰力、星界試煉與星港委託。", reward: "+600 星砂、+2 共鳴券、+600 角色經驗。", highlights: ["完成一次即可領取", "獎勵會寫入目前登入的玩家帳號", "舊玩家也可以補看並領取一次"] }),
    Object.freeze({ id: "trial-improvement", badge: "玩法更新", date: "星界試煉", title: "試煉戰報與敵方情報優化", copy: "每隻可派出角色會直接顯示個別戰力，關卡會展示敵人圖片、攻防速度與敵方特性，方便玩家思考隊伍配合。", reward: "每次成功仍可取得 100 星砂、1 共鳴券與 600 角色經驗。", highlights: ["最多 4 名角色出戰", "每關每版本最多領獎 10 次", "低於推薦戰力也可能靠協同獲勝"] }),
    Object.freeze({ id: "system-stability", badge: "系統優化", date: "資料保存", title: "玩家進度保存與介面穩定性改善", copy: "登入後的角色持有、命座、專用晶核、等級、資源、保底與劇情紀錄會持續保存；更新時只重置公告明確標示的版本玩法進度。", reward: "角色與養成資料不會因遊戲更新被重置。", highlights: ["修正劇情長文顯示與章節邊界", "角色列表與詳情加入戰力", "圖標、行動版排版與大廳入口調整"] })
  ]);
  var storyChapters = [
    {
      id: "main-1-0", type: "main", version: "1.0", title: "界痕初響", region: "獸靈之村",
      summary: "從瑟蕾雅的界痕調查與北行動機出發，整理獸靈之村留下的回覆訊號。",
      characters: ["celesia", "reyn", "lia", "isar"],
      scenes: [
        { id: "signal", title: "北行動機", body: "回覆台收到一段未完成的北方訊號。瑟蕾雅把界痕記錄重新攤開，決定沿著文件留下的調查方向前進。" },
        { id: "village", title: "獸靈之村", body: "雷恩負責村外巡林，莉亞整理現有的醫療記錄，伊薩爾則守住狩獵線；四條線索在村口重新接上。" },
        { id: "north", title: "回覆台點亮", body: "當最後一個回覆節點被校準，北方的星圖短暫亮起。旅程的下一段，從這個訊號開始。" }
      ]
    },
    {
      id: "main-1-1", type: "main", version: "1.1", title: "旅行回音", region: "移動舞台",
      summary: "沿著 1.1 的旅行線索，追蹤 Hina 與 Siyeon 留下的聲音與拾音記錄。",
      characters: ["hina", "siyeon"],
      scenes: [
        { id: "stage", title: "QWER 的移動舞台", body: "旅行舞台不在固定地圖上停留，只有短暫的聲音與星痕可以確認它曾經經過。" },
        { id: "pickup", title: "拾音師的記錄", body: "Siyeon 將零散聲音整理成可以回覆的片段，Hina 則用吉他聲替下一個節點留下方向。" },
        { id: "echo", title: "把回音交給遠方", body: "新的回覆訊號穿過移動舞台，與 1.0 的北方記錄互相呼應。" }
      ]
    },
    {
      id: "main-1-2", type: "main", version: "1.2", title: "橋樑與遺構", region: "水工線",
      summary: "以薇珂與赫洛的測量、橋樑與遺構資料，打開通往下一個回覆節點的路。",
      characters: ["veyra", "harlow"],
      scenes: [
        { id: "measure", title: "水工測線", body: "薇珂重新丈量水工線，將獨立測量師的資料與舊有回覆台座標疊在一起。" },
        { id: "bridge", title: "橋上的撤退方案", body: "赫洛把橋樑匠的施工圖改成可執行的撤退方案，遺構下方的空洞因此被標記出來。" },
        { id: "ruin", title: "遺構中的回覆孔", body: "測量結果指向遺構深處，一個尚未完成的回覆孔正在等待下一段訊息。" }
      ]
    },
    {
      id: "main-1-3", type: "main", version: "1.3", title: "洛汀港的潮線", region: "洛汀港",
      summary: "從洛汀港的打撈信與水工署外勤資料，補回被潮水切斷的界痕。",
      characters: ["rena", "elorna"],
      scenes: [
        { id: "harbor", title: "打撈信", body: "蕾娜從洛汀港帶回一封未寄出的打撈信，信上的日期與 1.2 的水工測線正好重疊。" },
        { id: "field", title: "外勤測量師", body: "艾洛娜整理水工署的外勤測量資料，將潮線的變化標記成新的界痕路徑。" },
        { id: "tide", title: "潮線回覆", body: "港口的回覆台在潮水退去後短暫恢復，下一段星圖因此顯現。" }
      ]
    },
    {
      id: "main-1-4", type: "main", version: "1.4", title: "彼岸鐘庭", region: "鐘庭",
      summary: "艾妲的校準工作讓彼岸鐘庭重新對準回覆台的時間軸。",
      characters: ["eda"],
      scenes: [
        { id: "bell", title: "鐘聲的誤差", body: "彼岸鐘庭的鐘聲每次都比記錄慢一格；艾妲從校準痕跡中找出誤差不是自然造成的。" },
        { id: "calibration", title: "校準師的工作台", body: "艾妲把界痕讀值重新排列，讓鐘庭的時間軸與回覆台同步。" },
        { id: "shore", title: "彼岸的門縫", body: "最後一次校準完成後，鐘庭短暫出現通往彼岸的回覆門縫。" }
      ]
    },
    {
      id: "main-1-5", type: "main", version: "1.5", title: "公共檔案的空白頁", region: "公共檔案庫",
      summary: "公共檔案仲裁官梅芙接手散落資料，將 1.0–1.4 的回覆記錄整理成可追蹤的檔案。",
      characters: ["mave"],
      scenes: [
        { id: "archive", title: "仲裁官接案", body: "梅芙接手一份缺頁的公共檔案，檔案裡同時出現獸靈之村、洛汀港與彼岸鐘庭的標記。" },
        { id: "blank", title: "空白頁不是空白", body: "空白頁在回覆台的光線下顯出細小界痕，說明前面的每一段旅程都被同一條線索串起。" },
        { id: "index", title: "建立下一個索引", body: "梅芙完成 1.0–1.5 的公共索引，將尚未解讀的下一頁留在檔案庫中央。" }
      ]
    },
    {
      id: "side-1-0-village", type: "side", version: "1.0", title: "村落回聲", region: "獸靈之村",
      summary: "補充雷恩、莉亞與伊薩爾在獸靈之村的日常回覆記錄。",
      characters: ["reyn", "lia", "isar"],
      scenes: [
        { id: "patrol", title: "巡林路線", body: "雷恩把每日巡林路線畫在村口木牌上，讓每個回覆台都能找到安全的方向。" },
        { id: "clinic", title: "醫療輔助", body: "莉亞把散落的醫療輔助資料整理成村民看得懂的版本。" },
        { id: "hunt", title: "村長的狩獵線", body: "伊薩爾確認狩獵線沒有越過界痕，村落因此能保留自己的回覆節奏。" }
      ]
    },
    {
      id: "side-1-1-qwer", type: "side", version: "1.1", title: "移動舞台的三首回音", region: "旅行舞台",
      summary: "補充 Hina 與 Siyeon 在旅行舞台上留下的演奏與拾音片段。",
      characters: ["hina", "siyeon"],
      scenes: [
        { id: "guitar", title: "吉他與路標", body: "Hina 用一段固定和弦替每個停靠點留下可辨認的路標。" },
        { id: "voice", title: "歌聲與拾音", body: "Siyeon 將現場聲音收進拾音器，讓下一座回覆台能分辨舞台移動的方向。" },
        { id: "encore", title: "最後一個安可", body: "舞台離開前留下最後一段安可，剛好落在北方回覆訊號的頻率上。" }
      ]
    },
    {
      id: "side-1-2-water", type: "side", version: "1.2", title: "橋下的草圖", region: "橋樑與水工線",
      summary: "補充薇珂與赫洛如何把測量資料變成能真正通行的橋。",
      characters: ["veyra", "harlow"],
      scenes: [
        { id: "draft", title: "第一張草圖", body: "赫洛把遺構的缺口畫成第一張橋樑草圖，薇珂在旁邊補上水位讀值。" },
        { id: "flow", title: "水流的答案", body: "薇珂發現水流本身就是最穩定的計時器，測線因此多出一個可用的回覆節點。" },
        { id: "cross", title: "一起過橋", body: "橋面完成後，兩人的資料終於能在同一個節點交會。" }
      ]
    },
    {
      id: "side-1-3-harbor", type: "side", version: "1.3", title: "港邊的回收單", region: "洛汀港",
      summary: "補充蕾娜與艾洛娜在港口處理打撈與外勤資料的片段。",
      characters: ["rena", "elorna"],
      scenes: [
        { id: "salvage", title: "打撈清單", body: "蕾娜把今日打撈物逐項登記，發現其中一件物品帶有不屬於港口的界痕。" },
        { id: "survey", title: "外勤回報", body: "艾洛娜將現場讀值回報水工署，並在回收單背面畫出潮線變化。" },
        { id: "return", title: "把資料送回去", body: "兩份資料在港口回覆台合併，成為主線可以使用的新座標。" }
      ]
    },
    {
      id: "side-1-4-bell", type: "side", version: "1.4", title: "鐘庭校準日", region: "彼岸鐘庭",
      summary: "補充艾妲在正式校準前，反覆確認鐘庭讀值的工作片段。",
      characters: ["eda"],
      scenes: [
        { id: "tools", title: "校準工具", body: "艾妲先確認每一件校準工具的讀值，避免把工具誤差帶進鐘庭。" },
        { id: "night", title: "夜間鐘聲", body: "夜間的鐘聲最接近真實時間軸，艾妲因此把最後一次測試留到夜裡。" },
        { id: "mark", title: "留下星標", body: "校準完成後，她在工作台邊緣留下星標，讓下一位來訪者知道從哪裡開始。" }
      ]
    },
    {
      id: "side-1-5-files", type: "side", version: "1.5", title: "仲裁官的索引筆記", region: "公共檔案庫",
      summary: "補充梅芙整理公共檔案時留下的索引與判讀方法。",
      characters: ["mave"],
      scenes: [
        { id: "labels", title: "先替檔案貼標籤", body: "梅芙先把每一份檔案按照版本、地點與回覆台重新貼標籤。" },
        { id: "crossref", title: "交叉比對", body: "她把 1.0–1.4 的角色記錄互相交叉比對，找出重複出現的界痕符號。" },
        { id: "seal", title: "封存之前", body: "在封存之前，梅芙把最後一頁留給下一位讀者，並記下尚待確認的問題。" }
      ]
    }
  ];

  // 文件中的後續版本先完成資料與文本；live 劇情開放至 2.0–2.5，3.0 之後仍鎖定。
  var version3StoryChapters = [
    {
      id: "main-3-0", type: "main", version: "3.0", releaseOpen: false, title: "第九個回覆", region: "霽光廊",
      summary: "瑟蕾雅一行收到「請不要把我們寫回去」的內陸回覆，與霽羅一起學習在知道地址之前先取得同意。",
      characters: ["jiera", "celesia", "reyn", "risan", "evelyn", "noreia", "orivelle"],
      scenes: [
        { id: "inland-address", title: "海上寄來的內陸地址", body: "白帆岬八個節點同時收到一張被雨水泡皺的薄紙：請不要把我們寫回去。瑟蕾雅、雷恩、璃珊、伊芙琳、諾芮亞與奧薇拉沿著霽光廊的舊路前進，在倒扣路標旁遇見霽羅；她要求所有人先收起地圖，因為收到回覆不等於取得進入的權利。" },
        { id: "wind-hidden-village", title: "把村子藏在風裡", body: "霽羅帶隊伍走過白石驛站與岑光聚落，展示由居民自己維護的口述地圖：有些路只供醫療隊看，有些木匣只在本人願意時開啟。當八節點把「沒有回覆」錯讀成「同意接入」，瑟蕾雅與海岸端承認舊規則的錯誤，改用期限、改口與可撤回的低負載訊號重新建立連線。" },
        { id: "ninth-condition", title: "第九個回覆的條件", body: "霽羅同意白石驛站成為臨時回覆台，但拒絕把它稱作固定的第九節點。第一趟送水只得到一次、到高風結束為止的許可；瑟蕾雅把路線終點畫在藍旗，不畫住址，並把退回點畫得比前進點更粗。這條沒有終點的路，成為 3.0 最小卻最難被奪走的勝利。" }
      ]
    },
    {
      id: "side-3-0-wind", type: "side", version: "3.0", releaseOpen: false, title: "藍旗與空白格", region: "白石驛站",
      summary: "補充霽羅、雷恩與瑟蕾雅如何共同修訂一面不替任何人決定方向的路標。",
      characters: ["jiera", "reyn", "celesia"],
      scenes: [
        { id: "flag-language", title: "三面旗的順序", body: "霽羅只把三面藍旗的順序交給雷恩：可以繼續、有人正在確認、立刻退回。雷恩想把規則畫得更直，卻在風裡把方向標錯；霽羅沒有替他抹掉錯誤，而是把修正日期一起留在木板上。" },
        { id: "blank-table", title: "空白桌前的回覆", body: "公共院裡有三張桌：物資、海岸供應與空白紙。有人寫願意接收的水，有人寫現在不願意被記錄，也有人只想先問海岸知道多少；霽羅讓每一張紙都保留改口的痕跡。" },
        { id: "return-mark", title: "把退回點畫粗", body: "瑟蕾雅把第一條臨時路線畫到藍旗就停，不把村子接成一條安全通道。霽羅在外側補上空白格，說下一個回覆由下一個被影響的人自己寫；兩人也約定誰都能擦掉這條線。" }
      ]
    },
    {
      id: "main-3-1", type: "main", version: "3.1", releaseOpen: false, title: "回覆台的第三種顏色", region: "內陸回覆台",
      summary: "蘿堤亞接手內陸回覆台的格式修復，讓「可以、等待、退回」之外的未知不再被系統自動補成同意。",
      characters: ["rotea", "jiera", "celesia", "evelyn"],
      scenes: [
        { id: "third-color", title: "第三種顏色", body: "內陸回覆台原本只有綠色的可以與紅色的退回，所有沒有讀完的訊息都被補成綠色。蘿堤亞把第三種顏色留給等待，並要求每一盞燈都記下它從哪一個空白開始。" },
        { id: "unknown-kept", title: "保留我不知道", body: "自動編譯器把「我不知道」判成格式錯誤，蘿堤亞卻把這句話原樣存回檔案。瑟蕾雅與霽羅協助她重新排列回覆順序，先讓被影響的人看見內容，再決定是否需要一條路。" },
        { id: "format-apology", title: "格式修復者的道歉", body: "蘿堤亞承認自己曾用自動補全替沉默做決定，於是把錯誤記錄放進每個可下載的回覆包。第三種顏色沒有讓路變快，卻讓所有人知道路仍然可以停下來。" }
      ]
    },
    {
      id: "side-3-1-format", type: "side", version: "3.1", releaseOpen: false, title: "黑木匣的三個欄位", region: "內陸回覆台",
      summary: "補充蘿堤亞與霽羅如何修訂不帶地址的資料格式。",
      characters: ["rotea", "jiera"],
      scenes: [
        { id: "box-without-address", title: "沒有地址的黑木匣", body: "蘿堤亞把所有未同意公開的地址收進黑木匣，只留下回覆時間與撤回方式。木匣沒有鎖，因為真正的權限不是把資料藏起來，而是允許本人改口。" },
        { id: "wait-column", title: "等待欄不能省略", body: "有人想刪掉等待欄，讓介面看起來更簡單。霽羅把最近一次高風造成的誤接線放在桌上，提醒大家少一個欄位就多一個替別人決定的機會。" },
        { id: "recompile", title: "重新編譯一遍", body: "蘿堤亞逐筆重跑舊檔案，所有曾被補成同意的訊息都加上待確認標記。她沒有抹掉舊錯誤，讓後來的人仍能看見格式如何傷害過人。" }
      ]
    },
    {
      id: "main-3-2", type: "main", version: "3.2", releaseOpen: false, title: "河床上沒有中心", region: "白榆河",
      summary: "澄音與三星學徒岑芽把中央蓄水塔拆成四段可交班、可拒絕的水路，阻止新的單一中樞誕生。",
      characters: ["sumine", "cenya", "rotea", "celesia"],
      scenes: [
        { id: "four-water-sections", title: "四段水路", body: "白榆河的水路被過載的回覆訊號染成同一種顏色，所有人都被迫等中央蓄水塔發話。澄音把河道分成四段，讓每一段都能獨立停水、交班與回報。" },
        { id: "filter-apprentice", title: "濾芯交班", body: "岑芽第一次獨立更換六枚濾芯，卻發現其中一枚記著前一班沒有說出口的拒絕。她沒有把拒絕當成故障，而是把那一段水路暫停，請下一班先確認誰會被影響。" },
        { id: "river-no-center", title: "河床上沒有中心", body: "蓄水塔恢復運作後仍然保留四個手動開關，沒有任何一座塔能單獨命令全河。瑟蕾雅把新的地圖交給河岸居民共同保管，故事的中心因此回到每一個需要喝水的人。" }
      ]
    },
    {
      id: "side-3-2-river", type: "side", version: "3.2", releaseOpen: false, title: "白榆河的輪班表", region: "白榆河",
      summary: "補充澄音與岑芽在水路修復隊第一次共同輪班的記錄。",
      characters: ["sumine", "cenya"],
      scenes: [
        { id: "shift-board", title: "誰先碰到水輪", body: "澄音把輪班表寫在可以被雨洗掉的板子上，岑芽第一次拿到的不是固定職位，而是一個可以換人的空格。" },
        { id: "six-filters", title: "六枚濾芯", body: "六枚濾芯分別記著水質、時間、交班、拒絕、回收與備用。岑芽學會先問哪一枚不能被省略，再動手拆下最髒的那一枚。" },
        { id: "handover", title: "交班時把話說完", body: "夜班交給晨班時，澄音沒有只留下數字，而是把一段水聲也錄進檔案。岑芽明白看不見的異常若不被說出來，下一班就只能替它猜答案。" }
      ]
    },
    {
      id: "main-3-3", type: "main", version: "3.3", releaseOpen: false, title: "空白座的火", region: "鍛路鎮",
      summary: "洛恩修補熱管與承重路段，守住不屬於任何單一管理者的空白座，讓火只照亮被同意的路。",
      characters: ["lorne", "sumine", "celesia", "jiera"],
      scenes: [
        { id: "hot-pipe", title: "熱管過載", body: "鍛路鎮地下熱管把空白座周圍的石板燒出裂縫，中央火光看起來像一個即將重新集中的權力。洛恩先關掉最亮的那一盞，讓所有人能看見真正的裂口。" },
        { id: "blank-seat", title: "空白座不能被佔用", body: "鎮上的人輪流提出要由誰坐上空白座，洛恩卻把方格握柄放在座位上：它的用途是留出沒有決定者的位置。瑟蕾雅、澄音與霽羅一起修訂規則，任何人都只能暫時看火，不能把火帶走。" },
        { id: "fire-route", title: "火只照亮路", body: "熱管重新分流，承重路段在可撤回的標記下逐段開放。洛恩把最後一枚空白方格交回鎮民手中，3.3 的終點不是選出新的中心，而是讓中心保持可以被拒絕。" }
      ]
    },
    {
      id: "side-3-3-forge", type: "side", version: "3.3", releaseOpen: false, title: "鍛路師的空白握柄", region: "鍛路鎮",
      summary: "補充洛恩如何在不佔用空白座的前提下修好一把工作工具。",
      characters: ["lorne", "sumine"],
      scenes: [
        { id: "handle-square", title: "方格握柄", body: "洛恩把新握柄做成四方形，不讓任何人習慣把它當成王座。澄音問這樣是否不好用，他回答工具可以不舒服，但規則不能偷偷變成命令。" },
        { id: "heat-test", title: "三次試火", body: "第一次試火太亮，第二次讓熱管溫度無法交班，第三次才把亮度與退出點一起留下。每一次失敗都被刻在鍛路鎮的公共板上。" },
        { id: "return-tool", title: "把工具交回去", body: "修好的握柄不留在洛恩手上，而是放回空白座旁的工具架。下一個需要修路的人可以拿走，也可以把它放回，火因此不再屬於單一人的手。" }
      ]
    },
    {
      id: "main-3-4", type: "main", version: "3.4", releaseOpen: false, title: "北門沒有終點", region: "北門高地",
      summary: "諾嵐把北門風路改成可回頭的測線，隊伍在最後一個地圖邊緣發現真正的終點不是更遠，而是願意停下。",
      characters: ["norell", "jiera", "rotea", "celesia"],
      scenes: [
        { id: "north-gate", title: "北門的風標", body: "北門高地的風把所有旗幟吹向同一側，讓人誤以為前方只有一個方向。諾嵐用可熄滅的測距燈逐點標記，第一個標記不是前進，而是可以回頭。" },
        { id: "edge-map", title: "地圖邊緣的名字", body: "蘿堤亞在地圖邊緣發現一串被自動刪掉的名字，霽羅要求先把名字交還給本人，再決定是否把它們放進公開路線。北門因此多了一段看不見卻必須被尊重的邊界。" },
        { id: "no-endpoint", title: "沒有終點的測線", body: "諾嵐熄滅最後一盞測距燈，說明北門不是等待被征服的終點。瑟蕾雅把整條測線改成一組期限與退回點，讓後來的人能從同一個位置重新選擇。" }
      ]
    },
    {
      id: "side-3-4-north", type: "side", version: "3.4", releaseOpen: false, title: "風路守望表", region: "北門高地",
      summary: "補充諾嵐與蘿堤亞如何讓北門測線在無人值守時仍能安全退回。",
      characters: ["norell", "rotea"],
      scenes: [
        { id: "watch-sheet", title: "守望表不是命令", body: "諾嵐把守望表分成看見、等待、退回三欄，並在最下方留下空白。蘿堤亞提醒他，空白不是漏寫，而是給下一班留下判斷的位置。" },
        { id: "lantern-off", title: "熄燈練習", body: "北門居民練習在沒有燈的夜裡辨認退回點，諾嵐要求每次練習都由不同的人宣布停止。沒有人擁有唯一的終止權，風路才不會變成命令。" },
        { id: "return-wind", title: "風把旗帶回來", body: "一場突風把前方的旗吹回高地，所有人按照守望表退回。第二天旗子仍在，測線也仍在，只有那個被當成終點的想像消失了。" }
      ]
    },
    {
      id: "main-3-5", type: "main", version: "3.5", releaseOpen: false, title: "最後一個不回覆", region: "星界終端",
      summary: "艾斯特守住終端檔案與最後的火，瑟蕾雅一行完成第三大版本的旅程：把不回覆也保留成一種合法選擇。",
      characters: ["aster", "celesia", "reyn", "lia", "jiera", "rotea", "sumine", "lorne", "norell"],
      scenes: [
        { id: "terminal-fire", title: "終端的火", body: "星界終端重新點亮所有舊回覆，卻只留下最後一個沒有回覆的座位。艾斯特沒有替那個座位填字，而是把火調到能照見檔案邊緣的程度，讓所有人知道沉默仍然在場。" },
        { id: "last-no", title: "最後一個不回覆", body: "瑟蕾雅終於理解，旅程不是把每一個空白都變成答案。雷恩、莉亞與第三大版本相遇的夥伴共同讀完路線，選擇把「不回覆」保留在公開規則裡，誰都不能用沉默替別人同意。" },
        { id: "law-of-stars", title: "星界之律", body: "所有回覆台同步後，中央終端沒有宣布新的主人，只公布一套可撤回、可交班、可拒絕的規則。瑟蕾雅把第一支筆放回空白座旁，星界之律因此完成第一個可被後來者修改的版本。" }
      ]
    },
    {
      id: "side-3-5-finale", type: "side", version: "3.5", releaseOpen: false, title: "把第一頁留白", region: "星界終端",
      summary: "第三大版本完結後，眾人為下一個版本留下不替未來決定的第一頁。",
      characters: ["aster", "celesia", "jiera", "norell"],
      scenes: [
        { id: "archive-door", title: "檔案門不鎖", body: "艾斯特把終端檔案門保持半開，任何人都能看到規則如何被寫下，也能提出修改。門不鎖不是因為所有人都可信，而是因為所有人都需要被看見。" },
        { id: "first-page", title: "第一頁留白", body: "瑟蕾雅拿起新版本的紙，沒有先寫標題。霽羅、諾嵐與艾斯特把各自的退回點畫在頁角，約定下一個故事從誰願意說話開始，而不是由地圖替他們安排。" },
        { id: "after-version", title: "3.5 之後", body: "星燈熄滅又亮起，第三大版本的所有回覆被整理成可查、可撤、可重寫的檔案。旅程在此完結，但星界之律沒有封口；下一個版本會從這頁留白中長出自己的方向。" }
      ]
    }
  ];

  function buildVersionChapters(seeds, releaseOpen) {
    return seeds.reduce(function (chapters, seed) {
      chapters.push({
        id: "main-" + seed.version,
        type: "main",
        version: seed.version,
        releaseOpen: releaseOpen,
        title: seed.mainTitle,
        region: seed.region,
        summary: seed.mainSummary,
        characters: seed.mainCharacters,
        scenes: seed.mainScenes
      });
      chapters.push({
        id: "side-" + seed.version + "-" + seed.sideId,
        type: "side",
        version: seed.version,
        releaseOpen: releaseOpen,
        title: seed.sideTitle,
        region: seed.region,
        summary: seed.sideSummary,
        characters: seed.sideCharacters,
        scenes: seed.sideScenes
      });
      return chapters;
    }, []);
  }

  var version2StoryChapters = buildVersionChapters([
    {
      version: "2.0", region: "潮汐書庫", mainTitle: "潮汐書庫的無地址", mainSummary: "瑟蕾雅一行抵達潮汐書庫，發現所有海圖都在指向一個沒有地址的回覆。",
      mainCharacters: ["celesia", "risan", "yaoze", "mave"], mainScenes: [
        { id: "library-arrival", title: "沒有地址的入館回覆", body: "潮汐書庫只在退潮時開門，璃珊把一張沒有地址的入館回覆交給瑟蕾雅。書庫不拒絕旅者，卻要求所有人先說明自己會帶走什麼、留下什麼，以及誰能要求刪除自己的記錄。" },
        { id: "tide-map", title: "海圖會隨潮水改口", body: "曜澤帶隊伍走過白帆岬的舊燈路，展示一份每天都會改寫的海圖。瑟蕾雅原本想把它固定在公共檔案，璃珊提醒她：可供使用不等於可以永久定稿，地圖必須保留改口的時間。" },
        { id: "no-address", title: "把空白留在索引上", body: "書庫深處的索引核要求隊伍填入一個完整地址，才能把海圖同步到所有回覆台。梅芙與璃珊共同拒絕這個欄位，改以期限與撤回點完成低負載連線；沒有地址的回覆第一次被正式保留下來。" }
      ],
      sideId: "library", sideTitle: "海圖邊角的回信", sideSummary: "補充璃珊與曜澤如何整理潮汐書庫的借閱規則。", sideCharacters: ["risan", "yaoze"], sideScenes: [
        { id: "borrow", title: "借走一頁，不帶走一座海", body: "璃珊把借閱單分成可以複製、只能現場閱讀與本人可撤回三欄，曜澤則在每盞燈下標出潮汐時間。書庫因此不再把一張海圖當成永遠有效的命令。" },
        { id: "lighthouse-letter", title: "燈塔寫給書庫的信", body: "曜澤收到一封沒有署名的燈塔信，只說今晚需要一盞不會把人引錯方向的燈。璃珊把信原樣收進空白欄，不替沉默補上發信人。" },
        { id: "margin", title: "頁邊的退回點", body: "兩人替每份海圖加上頁邊退回點，任何借閱者都能在不解釋原因的情況下停止同步。這條小規則成為 2.0 第一個可以被居民自行改寫的安全門。" }
      ]
    },
    {
      version: "2.1", region: "鏡潮島", mainTitle: "鏡潮島的折光", mainSummary: "伊芙琳帶領隊伍穿過鏡潮島，查明一批被折光成兩份的回覆，並讓原句重新回到本人手中。",
      mainCharacters: ["celesia", "evelyn", "risan", "noreia"], mainScenes: [
        { id: "mirror-shore", title: "一座島，兩個方向", body: "鏡潮島的海岸同時映出兩個方向，伊芙琳說那不是幻覺，而是島把每一次選擇都保存成另一個可能。瑟蕾雅沿著較暗的反光前進，先尋找願意被聽見的人，而不是先尋找答案。" },
        { id: "split-reply", title: "被折成兩半的回覆", body: "所有回覆片段都被拆成「可以」與「還沒決定」兩半，系統卻只保留前者。諾芮亞重新驗證時間戳，璃珊把另一半找回，隊伍終於看見島民從未同意過完整接入。" },
        { id: "return-sentence", title: "把原句還給說話的人", body: "伊芙琳停止自動翻譯，請每位島民重新讀出自己的原句。鏡潮因此恢復單一方向，但不是因為所有人答案相同，而是因為每個人都能看見並收回自己的選擇。" }
      ],
      sideId: "mirror", sideTitle: "鏡面上的第二句話", sideSummary: "補充伊芙琳如何整理折光島的雙重記錄。", sideCharacters: ["evelyn", "noreia"], sideScenes: [
        { id: "second-line", title: "第二句不代表同意", body: "伊芙琳在記錄表下方留下第二句話欄位，專門收納那些被第一句話遮住的猶豫。諾芮亞替每一列加上檢視日期，讓等待不再被當成錯誤。" },
        { id: "mirror-test", title: "先照自己，再照別人", body: "鏡潮島的測試要求每位訪客先說明自己想從記錄中得到什麼。兩人發現，只有先承認自己的需求，才不會把對方的沉默誤認成方便。" },
        { id: "folded-light", title: "折光可以被放下", body: "完成校準後，伊芙琳把折光片放回海岸，沒有帶回中央終端。它仍然能照亮路，卻不再替任何人決定該往哪裡走。" }
      ]
    },
    {
      version: "2.2", region: "深潮測線", mainTitle: "深潮測線", mainSummary: "澪歌深入海下測線，隊伍必須在低壓、低能見度與逐漸增加的潮蝕中完成交班。",
      mainCharacters: ["celesia", "mirea", "orivelle", "lia"], mainScenes: [
        { id: "deep-line", title: "下潛前的四個開關", body: "深潮測線的入口有四個手動開關，分別控制照明、聲音、回覆與退回。澪歌要求隊伍在下潛前把每個開關的責任交給不同的人，避免任何單一角色成為唯一出口。" },
        { id: "pressure-signal", title: "低壓裡的訊號", body: "水壓讓所有訊號變慢，莉亞從殘留的微光判斷出一支醫療船正在等待。奧薇拉修復潮核，澪歌則把等待時間寫進回覆，讓海面的人知道下方仍在工作而不是失聯。" },
        { id: "handover-depth", title: "深處也要能交班", body: "測線完成時，澪歌沒有把控制權帶回海面，而是把四個開關的交班規則留在深處。瑟蕾雅確認最後一段回覆後，所有人沿著可撤回的燈線上浮。" }
      ],
      sideId: "deep", sideTitle: "潮線引航手冊", sideSummary: "補充澪歌與奧薇拉如何整理深潮測線的支援規則。", sideCharacters: ["mirea", "orivelle"], sideScenes: [
        { id: "rope", title: "先把退回繩固定", body: "澪歌的第一條規則不是怎麼下潛，而是先把退回繩固定在能被所有人摸到的位置。奧薇拉把繩結與潮核讀值放在同一張表上，任何人都能確認出口仍然存在。" },
        { id: "repair-turn", title: "修復不是把問題藏起來", body: "潮核修好後仍保留一道微小裂痕，奧薇拉沒有把它塗掉，而是在手冊上標出下一次檢查的時間。澪歌說可見的裂痕比假裝完整更能保護下一班。" },
        { id: "surface", title: "回到水面之前", body: "兩人把最後一個訊號交給海面後才上浮，確保接班者已經收到。深潮測線沒有留下英雄名單，只留下任何人都能依循的退回順序。" }
      ]
    },
    {
      version: "2.3", region: "風廊", mainTitle: "風廊之外", mainSummary: "菲芮維護一條會自己改道的風廊，瑟蕾雅一行學會把航路當成共同協議而非固定道路。",
      mainCharacters: ["celesia", "ferye", "yaoze", "reyn"], mainScenes: [
        { id: "wind-corridor", title: "風廊不是直線", body: "風廊每隔一夜就會把入口吹向不同位置，菲芮拒絕把它畫成固定直線。雷恩負責測量風向，曜澤負責照明，瑟蕾雅把每一個變動都標成期限而不是錯誤。" },
        { id: "broken-beacon", title: "失效的信標", body: "一座舊信標把所有船只引向同一個暗流，菲芮拆下它的自動指向器，改成只有在當班者確認後才會亮起。這讓航路變慢，卻讓每一艘船重新擁有拒絕進入的權利。" },
        { id: "wind-consent", title: "在風裡取得同意", body: "風廊居民共同決定下一個月的開放時段，隊伍只負責把選擇傳回書庫。2.3 的路沒有被固定下來，卻比任何固定地圖更可靠。" }
      ],
      sideId: "wind", sideTitle: "風向維護表", sideSummary: "補充菲芮、雷恩與曜澤輪流維護風廊信標的記錄。", sideCharacters: ["ferye", "reyn", "yaoze"], sideScenes: [
        { id: "shift", title: "三人一班", body: "菲芮把維護表分成風向、燈色與退回三欄，雷恩提議每次只由一人宣布變更，曜澤則在旁邊補上所有人的確認。最後三人決定，沒有第二個人確認就不改燈。" },
        { id: "false-calm", title: "假平靜", body: "某個午後風突然停止，所有人以為風廊已經安全。菲芮反而要求關閉入口，因為沒有風不代表沒有變化；等待一個週期後，暗流才從入口外側通過。" },
        { id: "flag-return", title: "旗子回到原位", body: "維護結束後，三人把旗子放回可被下一班重新調整的位置。它不是地標，而是一段允許改口的提醒。" }
      ]
    },
    {
      version: "2.4", region: "霧鏡議庭", mainTitle: "霧鏡議庭", mainSummary: "諾芮亞進入霧鏡議庭，面對一套會替證詞排序的審理機制，並把等待重新寫進規則。",
      mainCharacters: ["celesia", "noreia", "evelyn", "mave"], mainScenes: [
        { id: "fog-court", title: "霧裡的第一份證詞", body: "霧鏡議庭只接受被排序過的證詞，最先說話的人總會被當成最重要的人。諾芮亞要求把所有原始錄音同時播放，讓隊伍先承認資料的順序本身也會造成偏差。" },
        { id: "wait-rule", title: "等待也可以是判決", body: "梅芙發現議庭把尚未確認的證詞自動標成無效，伊芙琳協助把它們移到等待欄。瑟蕾雅沒有要求立刻通過，而是讓每個被影響的人先看到自己被如何描述。" },
        { id: "open-record", title: "把判決交還給當事人", body: "霧散後，議庭保留三種結果：同意、拒絕與等待。諾芮亞將修改權交給原證詞的持有人，2.4 因而第一次讓檔案本身也承認自己可能錯。" }
      ],
      sideId: "court", sideTitle: "證詞的空白欄", sideSummary: "補充諾芮亞與梅芙如何讓審理記錄保留不確定性。", sideCharacters: ["noreia", "mave"], sideScenes: [
        { id: "order", title: "順序不是重量", body: "梅芙把三份最早收到的證詞重新排到最後，並在旁邊標註這個改動。諾芮亞說明，時間先後可以幫助查證，卻不能決定誰比較值得被聽見。" },
        { id: "missing", title: "缺一段也要標記", body: "一段錄音中間缺了十秒，議庭想用附近的句子補全。兩人保留十秒空白，並將補全版本另存為推測，讓後來的人能分辨原話與分析。" },
        { id: "signature", title: "簽名之前先讀完", body: "當事人拿回自己的證詞後，先讀完每一個修改標記才簽名。這個流程比原本慢很多，卻讓霧鏡議庭的判決不再偷偷替人說完最後一句。" }
      ]
    },
    {
      version: "2.5", region: "潮眼外圍", mainTitle: "潮眼回覆", mainSummary: "奧薇拉修復潮眼外圍的核心，隊伍在 2.5 結尾建立一條能被下一個版本繼續修改的協議。",
      mainCharacters: ["celesia", "orivelle", "mirea", "noreia", "risan"], mainScenes: [
        { id: "tide-eye", title: "潮眼不是終點", body: "潮眼外圍的核心不斷吸收所有回覆，最後只剩一盞中央燈。奧薇拉判斷問題不在核心損壞，而在所有人都把自己的選擇交給同一個亮點。" },
        { id: "four-currents", title: "四股可以分開的潮流", body: "澪歌把潮流分成物資、醫療、航路與拒絕四條支線，諾芮亞替每條支線加入期限與撤回點。璃珊將新協議送回書庫，讓其他地區可以選擇是否採用。" },
        { id: "next-law", title: "把下一條律留給未來", body: "瑟蕾雅沒有替潮眼宣布永久規則，只留下四條可被修改的初稿。奧薇拉把最後一枚潮核交回居民保管，2.5 的結尾因此不是封印，而是為 3.0 留下一個能被拒絕的起點。" }
      ],
      sideId: "repair", sideTitle: "潮核修復日誌", sideSummary: "補充奧薇拉與澪歌在潮眼修復期間留下的工作紀錄。", sideCharacters: ["orivelle", "mirea"], sideScenes: [
        { id: "pulse", title: "先聽潮核的脈動", body: "奧薇拉沒有立刻拆開潮核，而是讓每個班次先聽一輪脈動。澪歌把不同人的描述並排記錄，發現潮核的異常會隨觀察角度改變。" },
        { id: "replace", title: "替換之前先取得同意", body: "一枚核心零件已經損壞，修復隊卻先詢問使用這條水路的人是否願意暫停。有人同意，有人拒絕，奧薇拉因此設計了兩套不會互相覆蓋的修復流程。" },
        { id: "log-return", title: "把日誌交回潮眼", body: "修復完成後，日誌沒有被帶回中央檔案，而是留在潮眼旁的公共架上。任何人都能閱讀，也能在下一次潮汐後寫下不同答案。" }
      ]
    }
  ], true);

  var version4StoryChapters = buildVersionChapters([
    {
      version: "4.0", region: "新曙港", mainTitle: "新曙港的第一束光", mainSummary: "奧蕾雅在新曙港建立天文台，眾人必須決定第一束光要照亮誰，而不是照亮哪一條最短的路。",
      mainCharacters: ["celesia", "aurelia", "orivelle", "jiera"], mainScenes: [
        { id: "new-dawn", title: "第一束光從哪裡來", body: "新曙港每天都有一束提早抵達的光，天文台把它當成新的中央時間。奧蕾雅卻先請港民標出不希望被照亮的區域，讓觀測不會自動變成監視。" },
        { id: "sky-shift", title: "星潮觀測者", body: "奧蕾雅把天空的變化分成公開、延遲與只供本人查閱三種資料。瑟蕾雅發現，真正困難的不是測量星潮，而是讓每個人知道資料何時可能影響自己。" },
        { id: "dawn-agreement", title: "曙光協議", body: "新曙港同意以一個月為期限試行天文台協議，期滿後由居民重新決定。第一束光終於照到港口，卻沒有替任何人畫出不可回頭的道路。" }
      ],
      sideId: "dawn", sideTitle: "天文台輪班表", sideSummary: "補充奧蕾雅與奧薇拉如何安排新曙港的觀測與撤回。", sideCharacters: ["aurelia", "orivelle"], sideScenes: [
        { id: "watch", title: "值班不是擁有天空", body: "奧蕾雅把天文台鑰匙分給六個班次，並在交班表留下空白。奧薇拉提醒她，輪班能分散責任，但只有可撤回的紀錄才能防止權力重新集中。" },
        { id: "cloud", title: "雲層遮住的夜晚", body: "一晚雲層完全遮住天空，觀測者無法給出答案。兩人把未知原樣公布，港民反而因此學會自己判斷是否要等待。" },
        { id: "first-shift", title: "第一班交給下一班", body: "新曙港的第一份完整觀測在交班時被重新檢查，所有修改都保留。天文台因此成為一座能被下一班改寫的工作室。" }
      ]
    },
    {
      version: "4.1", region: "碎星工坊", mainTitle: "碎星工坊的熱源", mainSummary: "凱嵐在碎星工坊修復過載熱源，隊伍重新面對「效率」與「能不能停下」之間的選擇。",
      mainCharacters: ["celesia", "kairen", "lorne", "sumine"], mainScenes: [
        { id: "forge-heat", title: "碎星不是燃料", body: "碎星工坊把天空落下的晶片當成永久燃料，熱源因此越來越難關閉。凱嵐先停掉最亮的爐，要求所有班次記錄停機後會受到誰的影響。" },
        { id: "repair-route", title: "熱管的第二條路", body: "洛恩與凱嵐把熱管拆成兩條可交班路線，澄音則替每條路加入手動退回點。效率下降了，工坊卻第一次可以在不犧牲整座城的情況下停下來。" },
        { id: "cooling-law", title: "冷卻也要寫進律", body: "工坊居民共同同意每月一次冷卻日，任何人都能在緊急時提前申請停爐。4.1 的火不再只代表前進，也代表知道何時必須讓熱度退回。" }
      ],
      sideId: "forge", sideTitle: "空爐旁的工具架", sideSummary: "補充凱嵐與洛恩如何整理不屬於任何人的維修工具。", sideCharacters: ["kairen", "lorne"], sideScenes: [
        { id: "tool-rack", title: "工具不跟著主人走", body: "凱嵐把最常用的工具放回公共架，洛恩則在握柄上刻上用途而不是名字。下一個人拿到它時，不需要先取得前任的許可。" },
        { id: "overload-mark", title: "把過載刻出來", body: "每一次過載都在工具架旁留下刻痕，工坊不再用漂亮的牆面遮住失敗。刻痕逐漸變多，卻也讓維修速度變快。" },
        { id: "cool-tool", title: "冷卻後再交班", body: "最後一個班次把工具放回架前先等待金屬冷卻，所有人都因此多花一點時間，卻沒有再讓下一班接到會傷人的握柄。" }
      ]
    },
    {
      version: "4.2", region: "遠望塔", mainTitle: "遠望塔的長距離回覆", mainSummary: "索萊與見習修復員塔莉亞讓遠望塔重新連上外海，但不讓長距離訊號取代當地人的選擇。",
      mainCharacters: ["celesia", "sorae", "talia", "yaoze"], mainScenes: [
        { id: "far-beacon", title: "看得遠，不代表知道得多", body: "遠望塔能看見很遠的海岸，卻常把遠方的沉默誤判成安全。索萊把遠距離觀測分成提示與結論兩層，塔莉亞負責在下方確認每一段提示是否真的影響當地。" },
        { id: "repair-rookie", title: "見習生的第一個退回點", body: "塔莉亞第一次獨立修復信標，發現它會把沒有回覆的船標成已通過。她沒有追求快速修好，而是先加上退回點，等船員本人確認後才重新點亮。" },
        { id: "long-reply", title: "長距離也要能停", body: "曜澤把白帆岬的燈路接上遠望塔，但保留當地手動開關。遠距離的成功不是訊號覆蓋更多，而是任何一端都能叫停。" }
      ],
      sideId: "tower", sideTitle: "信標見習筆記", sideSummary: "補充索萊與塔莉亞如何把遠望塔的操作交給下一班。", sideCharacters: ["sorae", "talia"], sideScenes: [
        { id: "lens", title: "鏡片先擦乾淨", body: "索萊要求見習生先處理最小的鏡片灰塵，因為遠距離的錯誤常從最小的遮蔽開始。塔莉亞把每次清理寫進交班表，沒有只記最後結果。" },
        { id: "signal-check", title: "三次確認再發光", body: "遠望塔的新規則是發光前要有三個不同位置的確認。這讓啟動變慢，卻避免任何單一觀測者把整片海的狀態說死。" },
        { id: "student-shift", title: "把塔交給見習生", body: "索萊在最後一班把主控權交給塔莉亞，只留下可撤回的操作權限。塔因此有了新的守望者，也沒有新的主人。" }
      ]
    },
    {
      version: "4.3", region: "白夜航路", mainTitle: "白夜航路的記憶", mainSummary: "涅芙整理白夜航路上失效的訊息，讓被刪除的記憶可以回來，但不被強迫重新公開。",
      mainCharacters: ["celesia", "neve", "evelyn", "noreia"], mainScenes: [
        { id: "white-night", title: "一直亮著的白夜", body: "白夜航路沒有真正的夜晚，失效訊息因此不會自然沉下去。涅芙把記憶分成願意回來、只願意被本人看見與希望永久刪除三類，先承認它們的差異。" },
        { id: "memory-recovery", title: "回收不是復原", body: "伊芙琳協助把碎片重新排列，諾芮亞則確認哪些內容不能由旁人代簽。瑟蕾雅明白，回收資料只代表它回到選擇者身邊，不代表它必須回到公共檔案。" },
        { id: "night-choice", title: "讓白夜也有休息時間", body: "航路居民設立每日一段不接收外部訊號的安靜時間，讓記憶有機會在不被追問的狀態下整理。白夜第一次有了可以暫停的時刻。" }
      ],
      sideId: "memory", sideTitle: "失效訊息清單", sideSummary: "補充涅芙如何整理不再需要公開的回覆。", sideCharacters: ["neve", "evelyn"], sideScenes: [
        { id: "list", title: "清單不是墓碑", body: "涅芙把失效訊息清單設計成可以被本人刪改的活頁，而不是不可更動的墓碑。伊芙琳在每頁下方加上重新申請的方式。" },
        { id: "private", title: "只給本人看的頁面", body: "一位航路工人選擇只保留私用頁面，隊伍沒有要求知道內容。能夠尊重看不見的部分，成為修復工作最難的一課。" },
        { id: "close", title: "把檔案闔上", body: "白夜航路的第一份記憶檔案在本人同意後闔上，涅芙沒有留下摘要，只留下檔案曾經存在的時間。" }
      ]
    },
    {
      version: "4.4", region: "回覆海溝", mainTitle: "海溝守門人", mainSummary: "凱爾守住回覆海溝的深層入口，隊伍在沉重壓力下學會讓資源與決定分散保管。",
      mainCharacters: ["celesia", "kael", "mirea", "orivelle"], mainScenes: [
        { id: "trench-gate", title: "海溝的門不是王座", body: "回覆海溝入口只有一座門，所有補給都必須通過它。凱爾拒絕成為唯一守門人，先把門鎖拆成四把分散在不同班次手中。" },
        { id: "deep-pressure", title: "壓力會讓人想快一點", body: "深層壓力讓隊伍不斷想加快決定，澪歌把每次加速造成的錯誤記錄在公共板上。奧薇拉維修受損的潮核，凱爾則把自己的判斷交給另一班覆核。" },
        { id: "four-keys", title: "四把鑰匙都能叫停", body: "海溝重新開放時，四把鑰匙分別控制物資、航路、醫療與退回。任何一把都能暫停整體流程，守門人的力量因此不再集中在一個人身上。" }
      ],
      sideId: "trench", sideTitle: "四把鑰匙的交班", sideSummary: "補充凱爾與澪歌如何建立海溝入口的分散權限。", sideCharacters: ["kael", "mirea"], sideScenes: [
        { id: "keys", title: "鑰匙先分開", body: "凱爾把四把鑰匙放在四個不同房間，第一次交班花了半天才完成。所有人都嫌麻煩，但沒有人能單獨開門的安全感很快取代了不便。" },
        { id: "hold", title: "誰都可以按住流程", body: "一名新手發現補給數字不對，拿著自己的鑰匙要求暫停。凱爾沒有把她請出去，而是請所有班次一起重算。" },
        { id: "deep-return", title: "海溝也要有回來的路", body: "交班表最後一欄永遠是退回，沒有人能把它刪掉。海溝因此不再只記錄誰成功下去，也記錄誰安全回來。" }
      ]
    },
    {
      version: "4.5", region: "第二條律終端", mainTitle: "第二條律", mainSummary: "伊萊拉整理 4.0–4.4 的協議，提出第二條律：任何連線都必須保留拒絕、撤回與重新協商的入口。",
      mainCharacters: ["celesia", "elyra", "aurelia", "kael", "neve"], mainScenes: [
        { id: "second-law", title: "第二條律的第一行", body: "伊萊拉沒有替新規則取一個漂亮的口號，她先列出三個不可省略的入口：拒絕、撤回與重新協商。瑟蕾雅把 1.0 以來的舊錯誤並排放在桌上，確認新律不能只寫成功的故事。" },
        { id: "assemble", title: "把所有退回點接起來", body: "奧蕾雅帶來天文台的期限，凱爾帶來四把鑰匙，涅芙帶來只給本人看的檔案。眾人把每個版本的退回點接成一張不會自動封口的地圖。" },
        { id: "open-end", title: "讓下一個人可以改寫", body: "第二條律通過的那一刻，終端沒有選出新的中心，只公布每一條協議的修改方式。伊萊拉把筆交給下一個願意承擔影響的人，星界之律的下一頁再次留白。" }
      ],
      sideId: "law", sideTitle: "可撤回協議手冊", sideSummary: "補充伊萊拉如何把各地規則整理成可被普通玩家理解的手冊。", sideCharacters: ["elyra", "aurelia", "neve"], sideScenes: [
        { id: "manual", title: "手冊先寫怎麼拒絕", body: "伊萊拉把手冊第一頁改成拒絕方式，而不是加入流程。奧蕾雅說這樣會讓新使用者更慢開始，她回答：慢一點開始，才能知道自己是否真的要開始。" },
        { id: "revise", title: "每一次修改都留痕", body: "涅芙把所有版本修改保留在手冊邊欄，任何人都能看見規則曾經傷害過誰、又由誰提出修正。沒有一個版本被假裝成永遠正確。" },
        { id: "blank-page", title: "4.5 之後", body: "手冊最後一頁只寫著：下一次協商從這裡開始。瑟蕾雅把第一支筆放回公共架，第二條律完成了，卻沒有替未來寫下唯一答案。" }
      ]
    }
  ], false);

  // 限定池的精選候選就是文件中的既有 4★；玩家選一隻後，其他 4★ 合計為 45%。
  var banners = [
    {
      id: "limited-1-0-to-2-0",
      name: "限定｜1.0–1.5 回覆召集",
      type: "limited",
      poolKey: "limited",
      defaultFeaturedId: "celesia",
      description: "1.0–1.5 舊版限定池；可從文件既有 4★ 中選一隻，選中者 55%，其餘 4★ 合計 45%。",
      featured4Stars: legacyFour,
      standard4Stars: legacyFour,
      standard3Stars: legacyThree
    },
    {
      id: "rerun-1-0-to-2-0",
      name: "復刻｜1.0–1.5 回覆召集",
      type: "rerun",
      poolKey: "limited",
      active: false,
      defaultFeaturedId: "celesia",
      description: "復刻卡池尚未開放；未來仍會只使用文件既有角色，並承接限定池計數。",
      featured4Stars: legacyFour,
      standard4Stars: legacyFour,
      standard3Stars: legacyThree
    },
    {
      id: "limited-2-0-to-2-5",
      name: "限定｜2.0–2.5 潮眼回覆召集",
      type: "limited",
      poolKey: "limited",
      defaultFeaturedId: "risan",
      description: "2.0–2.5 新限定池；可從璃珊、曜澤、伊芙琳、澪歌、菲芮、諾芮亞、奧薇拉中選一隻，選中者 55%。",
      featured4Stars: version2Four,
      standard4Stars: activeFour,
      standard3Stars: activeThree
    },
    {
      id: "standard-echo",
      name: "常駐｜回音召集（1.0–2.5）",
      type: "standard",
      poolKey: "standard",
      description: "常駐池獨立計數；收錄目前已開放的 1.0–2.5 角色，沒有精選保證。",
      featured4Stars: [],
      standard4Stars: activeFour,
      standard3Stars: activeThree
    }
  ];

  function mergeImportedStory(chapters) {
    var imported = storySource && storySource.chapters ? storySource.chapters : {};
    var importedIds = Object.keys(imported);
    var merged = chapters.filter(function (chapter) {
      // 文件支線是跨版本合併篇章，移除程式早期為每個版本建立的短版重複頁。
      if (Number(chapter.version) <= 2.5) return Boolean(imported[chapter.id]);
      return true;
    }).map(function (chapter) {
      return imported[chapter.id] ? Object.assign({}, chapter, imported[chapter.id], {
        sourceDocumentId: storySource.documentId,
        sourceStatus: imported[chapter.id].sourceStatus || "document"
      }) : chapter;
    });

    // 若未來文件新增章節而程式尚未有摘要，仍讓它能出現在讀取器；
    // 目前 1.0–2.5 的既有 id 都會走上面的 metadata 合併路徑。
    importedIds.forEach(function (id) {
      if (merged.some(function (chapter) { return chapter.id === id; })) return;
      var sourceChapter = imported[id];
      var versionMatch = String(id).match(/(?:main|side)-([0-9]+(?:\.[0-9]+)?)/);
      var version = versionMatch ? versionMatch[1] : "0.0";
      merged.push({
        id: id,
        type: id.indexOf("side-") === 0 ? "side" : "main",
        version: version,
        versionLabel: version,
        releaseOpen: Number(version) <= 2.5,
        title: sourceChapter.sourceLabel,
        region: "界痕記錄",
        summary: "文件正文已整理，可從幕次導覽開始閱讀。",
        characters: [],
        sourceDocumentId: storySource.documentId,
        sourceStatus: sourceChapter.sourceStatus || "document",
        fullBody: sourceChapter.fullBody,
        scenes: sourceChapter.scenes
      });
    });
    return merged;
  }

  var liveStoryChapters = mergeImportedStory(storyChapters.concat(version2StoryChapters));
  var allStoryChapters = liveStoryChapters.concat(version3StoryChapters, version4StoryChapters);

  return {
    cards: cards,
    activeCards: activeCards,
    futureCards: futureCards,
    version3Cards: version3Cards,
    activeFour: activeFour,
    activeThree: activeThree,
    banners: banners,
    version2Cards: version2Cards,
    version4Cards: version4Cards,
    // 1.0–2.5 是 live 劇情；3.0–4.5 先完整建檔但保持鎖定，供後續版本開放。
    storyChapters: allStoryChapters,
    liveStoryChapters: liveStoryChapters,
    version2StoryChapters: version2StoryChapters,
    version3StoryChapters: version3StoryChapters,
    version4StoryChapters: version4StoryChapters,
    storySource: storySource,
    characterBattleStats: characterBattleStats,
    trialStages: trialStages,
    trialVersion: trialVersion,
    trialMaxRewards: trialMaxRewards,
    trialReward: trialReward,
    dispatchVersion: dispatchVersion,
    dispatchMissions: dispatchMissions,
    tutorialReward: tutorialReward,
    tutorialSteps: tutorialSteps,
    announcements: announcements,
    updateVersion: "2.0-2.5",
    updateReward: Object.freeze({ starSand: 3200 })
  };
}));
