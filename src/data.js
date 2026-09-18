(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StarshipGachaData = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

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
      portraitImage: image ? "./assets/cards/complete/" + id + ".svg" : null
    });
  }

  // 只收錄文件與本次版本規劃中的角色；目前 live 卡池仍先開放 1.0–1.5，
  // 2.0–3.5 角色先作為後續版本資料，不會誤加入現行卡池。
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
    aster: card("aster", "艾斯特", "Aster", 4, "烈", "#e88955", "3.5", "3.5｜終端檔案守門人、空白座看火者", "./assets/cards/aster.png")
  };

  // 現行卡池只開放 1.0–1.5；保留文件原本的 3★／4★，不新增角色。
  var activeCards = [
    cards.celesia, cards.reyn, cards.lia, cards.isar, cards.rena, cards.eda,
    cards.veyra, cards.harlow, cards.elorna, cards.chodan, cards.magenta,
    cards.hina, cards.siyeon, cards.mave
  ];
  var activeFour = activeCards.filter(function (item) { return item.rarity === 4; });
  var activeThree = activeCards.filter(function (item) { return item.rarity === 3; });
  var futureCards = [cards.risan, cards.yaoze, cards.maro, cards.evelyn, cards.mirea, cards.ferye, cards.noreia, cards.orivelle, cards.jiera, cards.rotea, cards.sumine, cards.cenya, cards.lorne, cards.norell, cards.aster];
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
    siyeon: { rarity: 4, role: "拾音", maxHp: 1000, attack: 125, defense: 110, speed: 108, range: 2, attackName: "回音脈衝", skillName: "回音採集", skillPower: 1.15, skillEffect: "回復一名受傷隊友" },
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
  };

  var trialVersion = "1.0-1.5";
  var trialMaxRewards = 10;
  var trialReward = Object.freeze({ starSand: 100, tickets: 1 });
  var trialStages = [
    { id: 1, name: "回覆台外圍", region: "界痕入口", recommendedPower: 420, enemies: [{ name: "界痕幼體", maxHp: 560, attack: 78, defense: 38, speed: 65, count: 2 }], reward: trialReward },
    { id: 2, name: "獸靈村口", region: "獸靈之村", recommendedPower: 560, enemies: [{ name: "失序獸靈", maxHp: 720, attack: 92, defense: 48, speed: 70, count: 2 }], reward: trialReward },
    { id: 3, name: "北行測線", region: "北方界痕", recommendedPower: 720, enemies: [{ name: "裂痕獵犬", maxHp: 760, attack: 110, defense: 55, speed: 90, count: 2 }, { name: "裂痕巢核", maxHp: 980, attack: 82, defense: 70, speed: 48, count: 1 }], reward: trialReward },
    { id: 4, name: "移動舞台後台", region: "旅行舞台", recommendedPower: 900, enemies: [{ name: "噪音殘響", maxHp: 880, attack: 125, defense: 60, speed: 105, count: 2 }, { name: "失焦拾音器", maxHp: 920, attack: 105, defense: 68, speed: 75, count: 1 }], reward: trialReward },
    { id: 5, name: "橋下遺構", region: "水工線", recommendedPower: 1100, enemies: [{ name: "遺構鎧獸", maxHp: 1450, attack: 138, defense: 96, speed: 52, count: 2 }], reward: trialReward },
    { id: 6, name: "潮線斷口", region: "洛汀港", recommendedPower: 1320, enemies: [{ name: "潮痕寄生體", maxHp: 1180, attack: 155, defense: 88, speed: 108, count: 2 }, { name: "潮核", maxHp: 1550, attack: 124, defense: 108, speed: 56, count: 1 }], reward: trialReward },
    { id: 7, name: "鐘庭外廊", region: "彼岸鐘庭", recommendedPower: 1560, enemies: [{ name: "逆時鐘影", maxHp: 1420, attack: 178, defense: 102, speed: 112, count: 2 }, { name: "鐘庭守門核", maxHp: 1800, attack: 145, defense: 125, speed: 60, count: 1 }], reward: trialReward },
    { id: 8, name: "公共檔案庫下層", region: "公共檔案庫", recommendedPower: 1820, enemies: [{ name: "刪節檔案獸", maxHp: 1700, attack: 195, defense: 128, speed: 92, count: 2 }, { name: "空白頁", maxHp: 2100, attack: 158, defense: 145, speed: 58, count: 1 }], reward: trialReward },
    { id: 9, name: "五線回覆門", region: "1.0–1.5 交界", recommendedPower: 2100, enemies: [{ name: "多重界痕體", maxHp: 2050, attack: 220, defense: 145, speed: 118, count: 2 }, { name: "交界核心", maxHp: 2450, attack: 185, defense: 165, speed: 64, count: 1 }], reward: trialReward },
    { id: 10, name: "星界試煉終端", region: "回覆中樞", recommendedPower: 2440, enemies: [{ name: "終端界痕王", maxHp: 3300, attack: 255, defense: 190, speed: 105, count: 1 }, { name: "終端護衛", maxHp: 2200, attack: 210, defense: 155, speed: 122, count: 2 }], reward: trialReward }
  ];

  // 劇情入口先開放文件 1.0–1.5；每幕由前端與後端共用 id，完成獎勵才能安全地只領一次。
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

  // 文件中的第三大版本先完成資料與文本；live 劇情仍維持 1.0–1.5，避免未公告版本提前進入玩家流程。
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

  // 限定池的精選候選就是文件中的既有 4★；玩家選一隻後，其他 4★ 合計為 45%。
  var banners = [
    {
      id: "limited-1-0-to-2-0",
      name: "限定｜1.0–1.5 回覆召集",
      type: "limited",
      poolKey: "limited",
      defaultFeaturedId: "celesia",
      description: "可從 1.0–1.5 文件角色中選一隻限定 4★；選中者 55%，其餘 4★ 合計 45%。",
      featured4Stars: activeFour,
      standard4Stars: activeFour,
      standard3Stars: activeThree
    },
    {
      id: "rerun-1-0-to-2-0",
      name: "復刻｜1.0–1.5 回覆召集",
      type: "rerun",
      poolKey: "limited",
      active: false,
      defaultFeaturedId: "celesia",
      description: "復刻卡池尚未開放；未來仍會只使用文件既有角色，並承接限定池計數。",
      featured4Stars: activeFour,
      standard4Stars: activeFour,
      standard3Stars: activeThree
    },
    {
      id: "standard-echo",
      name: "常駐｜回音召集（1.0–1.5）",
      type: "standard",
      poolKey: "standard",
      description: "常駐池獨立計數；只收錄文件中 1.0–1.5 的 3★／4★，沒有精選保證。",
      featured4Stars: [],
      standard4Stars: activeFour,
      standard3Stars: activeThree
    }
  ];

  return {
    cards: cards,
    activeCards: activeCards,
    futureCards: futureCards,
    version3Cards: version3Cards,
    activeFour: activeFour,
    activeThree: activeThree,
    banners: banners,
    // 1.0–1.5 是 live 劇情；3.0–3.5 先完整建檔但保持鎖定，供後續版本開放。
    storyChapters: storyChapters.concat(version3StoryChapters),
    liveStoryChapters: storyChapters,
    version3StoryChapters: version3StoryChapters,
    characterBattleStats: characterBattleStats,
    trialStages: trialStages,
    trialVersion: trialVersion,
    trialMaxRewards: trialMaxRewards,
    trialReward: trialReward
  };
}));
