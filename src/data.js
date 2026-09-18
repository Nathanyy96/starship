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
      backgroundImage: backgroundImage || image || null
    });
  }

  // 只收錄文件已經列出的角色；目前 active pool 先開放 1.0–1.5，2.0–2.5 留作後續補入。
  var cards = {
    celesia: card("celesia", "瑟蕾雅", "Celesia", 4, "星", "#9e92ff", "1.0", "1.0｜繪圖信使、協作劍士；界痕調查與北行動機", "./assets/cards/celesia.png"),
    reyn: card("reyn", "雷恩", "Reyn", 3, "燕", "#78a4c8", "1.0", "1.0｜獸靈之村巡林人", "./assets/cards/reyn.png"),
    lia: card("lia", "莉亞", "Lia", 3, "星", "#9bbdff", "1.0", "1.0｜獸靈之村醫療輔助", "./assets/cards/lia.png"),
    isar: card("isar", "伊薩爾", "Isar", 3, "烈", "#c88755", "1.0", "1.0｜大型獸人獵人、村長；三星原稿保留", "./assets/cards/isar.png"),
    rena: card("rena", "蕾娜", "Rena", 3, "烈", "#f08a65", "1.3", "1.3｜洛汀港打撈信使；三星原稿保留", "./assets/cards/rena.png"),
    // 舊圖曾把艾妲標成「淨」，與文件角色表的 4★ 星不一致；先不用錯誤舊圖，改由卡面疊上正確標示。
  eda: card("eda", "艾妲", "Eda", 4, "星", "#f4c66b", "1.4", "1.4｜彼岸鐘庭校準師", null, "./assets/cards/eda.png"),
    veyra: card("veyra", "薇珂", "Veyra", 4, "淨", "#57d9c0", "1.2", "1.2｜獨立測量師、水工顧問", "./assets/cards/veyra.png"),
    harlow: card("harlow", "赫洛", "Harlow", 4, "烈", "#ff795c", "1.2", "1.2｜橋樑匠；遺構測量與撤退方案", "./assets/cards/harlow.png"),
    elorna: card("elorna", "艾洛娜", "Elorna", 4, "淨", "#64d7c6", "1.3", "1.3｜水工署外勤測量師", null),
    chodan: card("chodan", "Chodan", "Chodan", 4, "月", "#91a8d8", "1.0", "1.0｜旅行鼓手；月式卡面", "./assets/cards/chodan.png"),
    magenta: card("magenta", "Magenta", "Magenta", 4, "烈", "#ff71b8", "1.0", "1.0｜QWER 旅行貝斯手", "./assets/cards/magenta.png"),
    hina: card("hina", "Hina", "Hina", 4, "燕", "#6fa8ff", "1.1", "1.1｜QWER 旅行吉他手", "./assets/cards/hina.png"),
    siyeon: card("siyeon", "Siyeon", "Siyeon", 4, "淨", "#b7e9d6", "1.1", "1.1｜QWER 旅行歌手與拾音師", "./assets/cards/siyeon.png"),
    mave: card("mave", "梅芙", "Mave", 4, "幻", "#d06cff", "1.5", "1.5｜公共檔案仲裁官", null),
    risan: card("risan", "璃珊", "Risan", 4, "幻", "#c08cff", "2.0", "2.0｜潮汐書庫檔案員、海圖師", null),
    yaoze: card("yaoze", "曜澤", "Yaoze", 4, "月", "#91b9e8", "2.0", "2.0｜白帆岬燈塔守望員", null),
    maro: card("maro", "瑪洛", "Maro", 3, "淨", "#86dbc9", "2.0", "2.0｜診所實習生、地址站助手", null),

    // 2.1–2.5 已在文件中存在，但依目前指示先不加入本期卡池。
    evelyn: card("evelyn", "伊芙琳", "Evelyn", 4, "幻", "#c08cff", "2.1", "2.1｜鏡潮島回聲譯者、記錄仲裁師", null),
    mirea: card("mirea", "澪歌", "Mirea", 4, "月", "#91b9e8", "2.2", "2.2｜深潮測線引航師", null),
    ferye: card("ferye", "菲芮", "Ferye", 4, "燕", "#6fa8ff", "2.3", "2.3｜風廊測量師、航路維護者", null),
    noreia: card("noreia", "諾芮亞", "Noreia", 4, "星", "#9e92ff", "2.4", "2.4｜霧鏡議庭見證記錄員", null),
    orivelle: card("orivelle", "奧薇拉", "Orivelle", 4, "淨", "#57d9c0", "2.5", "2.5｜潮眼外圍潮核修復師", null)
  };

  // 現行卡池只開放 1.0–1.5；保留文件原本的 3★／4★，不新增角色。
  var activeCards = [
    cards.celesia, cards.reyn, cards.lia, cards.isar, cards.rena, cards.eda,
    cards.veyra, cards.harlow, cards.elorna, cards.chodan, cards.magenta,
    cards.hina, cards.siyeon, cards.mave
  ];
  var activeFour = activeCards.filter(function (item) { return item.rarity === 4; });
  var activeThree = activeCards.filter(function (item) { return item.rarity === 3; });
  var futureCards = [cards.risan, cards.yaoze, cards.maro, cards.evelyn, cards.mirea, cards.ferye, cards.noreia, cards.orivelle];

  // 星界試煉的自走棋數值；所有數值都集中在資料層，之後可以依文件平衡調整。
  var characterBattleStats = {
    celesia: { role: "指揮", maxHp: 980, attack: 180, defense: 120, speed: 110, range: 2, skillName: "星痕指令", skillPower: 1.35, skillEffect: "攻擊並讓全隊下一輪傷害提升" },
    reyn: { role: "守衛", maxHp: 1150, attack: 130, defense: 150, speed: 82, range: 1, skillName: "巡林掩護", skillPower: 1.05, skillEffect: "降低下一次受到的傷害" },
    lia: { role: "治療", maxHp: 820, attack: 90, defense: 90, speed: 105, range: 2, skillName: "回覆援護", skillPower: 1.2, skillEffect: "回復隊伍生命" },
    isar: { role: "獵人", maxHp: 1320, attack: 155, defense: 115, speed: 70, range: 1, skillName: "大型獵擊", skillPower: 1.5, skillEffect: "對當前目標造成重擊" },
    rena: { role: "斥候", maxHp: 900, attack: 150, defense: 80, speed: 125, range: 2, skillName: "港口快訊", skillPower: 1.25, skillEffect: "優先攻擊生命最低的敵人" },
    eda: { role: "校準", maxHp: 860, attack: 120, defense: 95, speed: 95, range: 2, skillName: "彼岸校準", skillPower: 1.15, skillEffect: "清除隊伍的一次負面狀態" },
    veyra: { role: "測量", maxHp: 900, attack: 135, defense: 110, speed: 88, range: 2, skillName: "水工讀值", skillPower: 1.2, skillEffect: "降低敵方防禦" },
    harlow: { role: "重裝", maxHp: 1500, attack: 110, defense: 175, speed: 60, range: 1, skillName: "橋樑壁壘", skillPower: 1.1, skillEffect: "吸收下一次敵方攻擊" },
    elorna: { role: "支援", maxHp: 840, attack: 105, defense: 105, speed: 100, range: 2, skillName: "外勤回報", skillPower: 1.15, skillEffect: "提升全隊防禦" },
    chodan: { role: "節奏", maxHp: 900, attack: 125, defense: 88, speed: 115, range: 2, skillName: "月式鼓點", skillPower: 1.25, skillEffect: "提升全隊速度" },
    magenta: { role: "爆發", maxHp: 950, attack: 165, defense: 82, speed: 118, range: 2, skillName: "旅行低音", skillPower: 1.4, skillEffect: "對相鄰敵人造成濺射傷害" },
    hina: { role: "射手", maxHp: 880, attack: 175, defense: 78, speed: 112, range: 3, skillName: "弦音標記", skillPower: 1.35, skillEffect: "標記目標，下一次攻擊追加傷害" },
    siyeon: { role: "拾音", maxHp: 830, attack: 100, defense: 90, speed: 108, range: 2, skillName: "回音採集", skillPower: 1.15, skillEffect: "回復一名受傷隊友" },
    mave: { role: "仲裁", maxHp: 980, attack: 145, defense: 115, speed: 102, range: 2, skillName: "公共索引", skillPower: 1.3, skillEffect: "重新排列敵方目標並造成傷害" }
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
      defaultFeaturedId: "celesia",
      description: "復刻仍只使用文件 1.0–1.5 的既有角色，並承接限定池的 50 抽計數與未中精選保證。",
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
    activeFour: activeFour,
    activeThree: activeThree,
    banners: banners,
    storyChapters: storyChapters,
    characterBattleStats: characterBattleStats,
    trialStages: trialStages,
    trialVersion: trialVersion,
    trialMaxRewards: trialMaxRewards,
    trialReward: trialReward
  };
}));
