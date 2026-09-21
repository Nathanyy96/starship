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

  // 後續角色可以先在劇情中登場，再於更適合的版本進入卡池。
  // 這份規劃刻意把「故事初登場」和「預計可抽版本」分開，避免為了卡池節奏
  // 讓每個小版本都硬塞一名新四星，導致角色關係只剩下快速報到。
  var futureCharacterPlan = {
    jiera: { plannedGachaVersion: "3.0", storyRelationship: "瑟蕾雅在 3.0 第一次把測線決定權交給霽羅；她不是導師，而是提醒瑟蕾雅也可以退回隊伍裡的人。" },
    rotea: { plannedGachaVersion: "3.2", storyRelationship: "蘿堤亞與瑟蕾雅從格式爭論走到信任；她敢刪掉瑟蕾雅的預設聲紋，兩人建立不替彼此代答的默契。" },
    sumine: { plannedGachaVersion: null, storyRelationship: "澄音用輪班、照護與慢修復承接 3.2 的代價；她讓瑟蕾雅看見修復不是英雄獨白，後續會以水路守護者身分回到隊伍。" },
    cenya: { plannedGachaVersion: "3.2", storyRelationship: "岑芽是瑟蕾雅第一次正式帶著做學徒工作的年輕夥伴；她的笨拙問題讓瑟蕾雅學會說明，而不是只示範答案。" },
    lorne: { plannedGachaVersion: "3.5", storyRelationship: "洛恩與瑟蕾雅在 3.3–3.5 共同拆解集中供能；他把『我能做到』改問成『誰能按停』，是火路上的互相尊重。" },
    norell: { plannedGachaVersion: null, storyRelationship: "諾嵐不追隨瑟蕾雅的方向，而是把每條路的退回點畫給她；兩人從測量合作變成能互相喊停的信任。" },
    aster: { plannedGachaVersion: null, storyRelationship: "艾斯特以門衛身分拒絕瑟蕾雅直接進入終端；他們在沉默與看火中建立不靠崇拜維持的夥伴關係。" },
    aurelia: { plannedGachaVersion: "4.0", storyRelationship: "奧蕾雅與瑟蕾雅從天文台的觀測爭論開始；她把光的解釋權拆開，讓瑟蕾雅第一次被當成共同研究者而非預言。" },
    kairen: { plannedGachaVersion: "4.2", storyRelationship: "凱嵐不接受瑟蕾雅替工坊承擔全部責任；兩人以輪值和停爐權互相試探，最後成為能把脆弱交出去的搭檔。" },
    sorae: { plannedGachaVersion: null, storyRelationship: "索萊與瑟蕾雅共享遠距離回覆的孤獨；他們不急著把熟悉聲音當邀請，關係建立在一起等待。" },
    talia: { plannedGachaVersion: "4.2", storyRelationship: "塔莉亞是瑟蕾雅身邊不怕問笨問題的見習者；瑟蕾雅在她身上補回與獸靈之村學徒們失去的平常相處。" },
    neve: { plannedGachaVersion: null, storyRelationship: "涅芙不替瑟蕾雅修復記憶，只把選擇權與缺頁放回她手中；兩人形成安靜但深的互信。" },
    kael: { plannedGachaVersion: null, storyRelationship: "凱爾與瑟蕾雅對『勇敢是否等於下潛』有根本分歧；他是第一個把她從母親線前拉回水面的人。" },
    elyra: { plannedGachaVersion: "4.5", storyRelationship: "伊萊拉與瑟蕾雅共同寫第二條律；她們不是師徒，而是兩個都願意修改自己的共同起草人。" },
    vestra: { plannedGachaVersion: "5.0", storyRelationship: "維斯妲在根冠教瑟蕾雅尊重空位；她不急著回答母親線索，卻陪她承受沒有答案的季節。" },
    brann: { plannedGachaVersion: null, storyRelationship: "布蘭把霜火工作拆成可交班的步驟，和瑟蕾雅在急於救人的衝動中互相拉住，讓信任變成具體流程。" },
    eirin: { plannedGachaVersion: "5.2", storyRelationship: "伊芮恩與瑟蕾雅在虹橋兩端守望；她把跨界相遇從浪漫邀請改成雙方都能說不的約定。" },
    sava: { plannedGachaVersion: null, storyRelationship: "薩芙理解瑟蕾雅害怕三種未來同時是真的；她不替她剪線，只陪她把選擇還給每條線的主人。" },
    niela: { plannedGachaVersion: "5.3", storyRelationship: "妮拉是織庭裡最早敢質疑瑟蕾雅的人；她的學習讓瑟蕾雅知道被依賴也不能取代別人思考。" },
    hervan: { plannedGachaVersion: null, storyRelationship: "赫爾凡在深海把第四把鑰匙交給瑟蕾雅又收回；兩人以安全與回返建立比英雄式犧牲更長久的情誼。" },
    daria: { plannedGachaVersion: "5.5", storyRelationship: "達莉雅在 5.5 陪瑟蕾雅把終端寫成可交班的見證；她讓瑟蕾雅把母親的私人回信與公共世界分開。" }
  };

  function card(id, name, romanizedName, rarity, element, accent, releaseVersion, note, image, backgroundImage) {
    var futurePlan = futureCharacterPlan[id] || {};
    return Object.freeze({
      id: id,
      name: name,
      romanizedName: romanizedName,
      rarity: rarity,
      element: element,
      accent: accent,
      releaseVersion: releaseVersion,
      storyDebutVersion: releaseVersion,
      plannedGachaVersion: Object.prototype.hasOwnProperty.call(futurePlan, "plannedGachaVersion") ? futurePlan.plannedGachaVersion : releaseVersion,
      storyRelationship: futurePlan.storyRelationship || "",
      note: note || "",
      image: image || null,
      backgroundImage: backgroundImage || image || null,
      // 原始立繪保留給卡池縮圖；完整角色頁使用程式產生的 SVG 標籤版，
      // 讓角色名稱、星級、元素不依賴 AI 文字，也不會裁掉全身。
      portraitImage: image ? (String(image).toLowerCase().endsWith(".svg") ? image : "./assets/cards/complete/" + id + ".svg") : null
    });
  }

  // 只收錄文件與本次版本規劃中的角色；2.0–2.5 會在本次大更新加入限定池，
  // 3.0–5.5 先完整建檔，等版本公告後再開放。
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

    // 3.0–3.5：先完整建立角色與劇情關係，實際卡池只安排少量新四星。
    jiera: card("jiera", "霽羅", "Jiera", 4, "星", "#86c8d7", "3.0", "3.0｜古道碑記修復師、口述地圖記錄員", "./assets/cards/jiera.png"),
    rotea: card("rotea", "蘿堤亞", "Rotea", 4, "幻", "#b995e8", "3.1", "3.1｜內陸回覆台編譯師、格式修復者", "./assets/cards/rotea.png"),
    sumine: card("sumine", "澄音", "Sumine", 4, "淨", "#74d8d0", "3.2", "3.2｜白榆河水路修復隊輪班工", "./assets/cards/sumine.png"),
    lorne: card("lorne", "洛恩", "Lorne", 4, "烈", "#e37c52", "3.3", "3.3｜鍛路鎮鍛路師、熱管維護者", "./assets/cards/lorne.png"),
    cenya: card("cenya", "岑芽", "Cenya", 3, "淨", "#77d8d1", "3.2", "3.2｜白榆河水路修復隊學徒；偶發三星設計", "./assets/cards/cenya.png"),
    norell: card("norell", "諾嵐", "Norell", 4, "月", "#86b8e8", "3.4", "3.4｜北門風路測量員、臨時回覆台守望者", "./assets/cards/norell.png"),
    aster: card("aster", "艾斯特", "Aster", 4, "烈", "#e88955", "3.5", "3.5｜終端檔案守門人、空白座看火者", "./assets/cards/aster.png"),

    // 第四大版本角色：先建立完整圖鑑與戰鬥資料；部分角色先作為劇情夥伴，避免每個小版本都換一批人。
    aurelia: card("aurelia", "奧蕾雅", "Aurelia", 4, "星", "#f2c86d", "4.0", "4.0｜曙港天文台值班長、星潮觀測者", "./assets/cards/aurelia.png"),
    kairen: card("kairen", "凱嵐", "Kairen", 4, "烈", "#e98058", "4.1", "4.1｜碎星工坊維修師、熱源調度員", "./assets/cards/kairen.png"),
    sorae: card("sorae", "索萊", "Sorae", 4, "燕", "#70b7ff", "4.2", "4.2｜遠望塔信標師、長距離回覆校準者", "./assets/cards/sorae.png"),
    talia: card("talia", "塔莉亞", "Talia", 3, "淨", "#76d9c7", "4.2", "4.2｜遠望塔見習修復員；偶發三星設計", "./assets/cards/talia.png"),
    neve: card("neve", "涅芙", "Neve", 4, "幻", "#c18cff", "4.3", "4.3｜白夜航路記憶領航員、失效訊息整理者", "./assets/cards/neve.png"),
    kael: card("kael", "凱爾", "Kael", 4, "月", "#88aee8", "4.4", "4.4｜回覆海溝潛航隊長、深層訊號守門人", "./assets/cards/kael.png"),
    elyra: card("elyra", "伊萊拉", "Elyra", 4, "淨", "#65d7c7", "4.5", "4.5｜第二條律的起草人、可撤回協議保管者", "./assets/cards/elyra.png"),

    // 第五大版本角色：保留完整角色規劃與戰鬥資料，但維持鎖定；只挑少數角色作為 5.x 新卡池核心。
    vestra: card("vestra", "維斯妲", "Vestra", 4, "星", "#e4b86b", "5.0", "5.0｜北境根冠守根者、未命名燈座保管人", "./assets/cards/vestra.png"),
    brann: card("brann", "布蘭", "Brann", 4, "烈", "#e87954", "5.1", "5.1｜霜火鍛環熱源調度員、輪值工程師", "./assets/cards/brann.png"),
    eirin: card("eirin", "伊芮恩", "Eirin", 4, "燕", "#70b7ff", "5.2", "5.2｜虹徑外環信標師、雙端通路測量者", "./assets/cards/eirin.png"),
    sava: card("sava", "薩芙", "Sava", 4, "幻", "#bd8ce8", "5.3", "5.3｜命線織庭編譯師、空白梭保管者", "./assets/cards/sava.png"),
    niela: card("niela", "妮拉", "Niela", 3, "淨", "#75d7cc", "5.3", "5.3｜織線學徒、公共梭房見習修復員；偶發三星設計", "./assets/cards/niela.png"),
    hervan: card("hervan", "赫爾凡", "Hervan", 4, "月", "#87aee7", "5.4", "5.4｜深海根門潛航隊長、四把鑰匙輪值者", "./assets/cards/hervan.png"),
    daria: card("daria", "達莉雅", "Daria", 4, "淨", "#64d7c7", "5.5", "5.5｜新曙終端交班見證人、九界協議記錄者", "./assets/cards/daria.png")
  };

  var legacyCards = [
    cards.celesia, cards.reyn, cards.lia, cards.isar, cards.rena, cards.eda,
    cards.veyra, cards.harlow, cards.elorna, cards.chodan, cards.magenta,
    cards.hina, cards.siyeon, cards.mave
  ];
  var version2Cards = [cards.risan, cards.yaoze, cards.maro, cards.evelyn, cards.mirea, cards.ferye, cards.noreia, cards.orivelle];
  var version4Cards = [cards.aurelia, cards.kairen, cards.sorae, cards.talia, cards.neve, cards.kael, cards.elyra];
  var version5Cards = [cards.vestra, cards.brann, cards.eirin, cards.sava, cards.niela, cards.hervan, cards.daria];

  // 本次大更新開放劇情與 2.0–2.5 角色；1.0–1.5 卡池仍保留，讓舊角色不會消失。
  var activeCards = [
    ...legacyCards, ...version2Cards
  ];
  var legacyFour = legacyCards.filter(function (item) { return item.rarity === 4; });
  var legacyThree = legacyCards.filter(function (item) { return item.rarity === 3; });
  var activeFour = activeCards.filter(function (item) { return item.rarity === 4; });
  var activeThree = activeCards.filter(function (item) { return item.rarity === 3; });
  var futureCards = [cards.jiera, cards.rotea, cards.sumine, cards.cenya, cards.lorne, cards.norell, cards.aster, ...version4Cards, ...version5Cards];
  var version2Four = version2Cards.filter(function (item) { return item.rarity === 4; });
  var version2Three = version2Cards.filter(function (item) { return item.rarity === 3; });
  var version3Cards = [cards.jiera, cards.rotea, cards.sumine, cards.cenya, cards.lorne, cards.norell, cards.aster];

  // 每個大版本維持五個小版本，但新四星集中在 2–3 名；其餘已設計角色
  // 仍保留在故事、立繪與戰鬥資料中，等劇情需要時再安排可抽版本。
  var futureCharacterReleasePlan = Object.freeze([
    Object.freeze({
      majorVersion: "3.0–3.5",
      fourStarIds: ["jiera", "rotea", "lorne"],
      threeStarIds: ["cenya"],
      storyOnlyIds: ["sumine", "norell", "aster"],
      focus: "從獸靈之村的共同生活延伸到不讓任何人永遠成為唯一中心；霽羅、蘿堤亞與洛恩各自代表測線、聲音與火路的不同選擇。"
    }),
    Object.freeze({
      majorVersion: "4.0–4.5",
      fourStarIds: ["aurelia", "kairen", "elyra"],
      threeStarIds: ["talia"],
      storyOnlyIds: ["sorae", "neve", "kael"],
      focus: "北境神話意象從傳說變成生活規則；奧蕾雅、凱嵐與伊萊拉分別把光、火與律法寫成可共同修改的制度。"
    }),
    Object.freeze({
      majorVersion: "5.0–5.5",
      fourStarIds: ["vestra", "eirin", "daria"],
      threeStarIds: ["niela"],
      storyOnlyIds: ["brann", "sava", "hervan"],
      focus: "瑟蕾雅面對母親與世界中心的最後選擇；維斯妲、伊芮恩與達莉雅讓空位、通路和交班成為她真正能留下的答案。"
    })
  ]);

  // 角色培養頁的動態立繪；素材檔名沿用角色 id，之後新增影片時只要補進這份清單。
  var characterAnimationDirectory = "./video/astralyn-1.0-1.5/";
  var characterAnimationIds = ["celesia", "reyn", "lia", "isar", "chodan", "magenta", "hina", "siyeon", "veyra", "harlow", "rena", "elorna", "eda", "mave"];
  var characterAnimations = Object.freeze(characterAnimationIds.reduce(function (animations, cardId) {
    animations[cardId] = Object.freeze({
      id: cardId,
      src: characterAnimationDirectory + cardId + "_5s.mp4",
      durationSeconds: 5
    });
    return animations;
  }, {}));

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
    ,vestra: { rarity: 4, role: "守門", maxHp: 1510, attack: 178, defense: 178, speed: 94, range: 2, attackName: "根冠定標", skillName: "空位守望", skillPower: 1.32, skillEffect: "架起護盾並讓隊伍下一輪可撤回一次傷害" }
    ,brann: { rarity: 4, role: "鍛路", maxHp: 1550, attack: 198, defense: 170, speed: 84, range: 1, attackName: "霜火輪錘", skillName: "雙核輪值", skillPower: 1.46, skillEffect: "重擊目標並降低敵方攻擊，為隊伍留下短暫護盾" }
    ,eirin: { rarity: 4, role: "測量", maxHp: 1320, attack: 220, defense: 142, speed: 132, range: 4, attackName: "虹徑定向", skillName: "雙端信標", skillPower: 1.34, skillEffect: "標記最脆弱敵人並提升全隊速度，下一輪可安全退回" }
    ,sava: { rarity: 4, role: "編譯", maxHp: 1390, attack: 224, defense: 158, speed: 118, range: 2, attackName: "命線編譯", skillName: "空白梭", skillPower: 1.38, skillEffect: "清除敵方增益並把一次敵方強化改成等待" }
    ,niela: { rarity: 3, role: "修復", maxHp: 900, attack: 96, defense: 98, speed: 110, range: 2, attackName: "織線輕補", skillName: "學徒交班", skillPower: 1.14, skillEffect: "回復生命最低的隊友並降低其下一次受到的傷害" }
    ,hervan: { rarity: 4, role: "重裝", maxHp: 1680, attack: 175, defense: 205, speed: 80, range: 1, attackName: "深門鎮潮", skillName: "四鑰分攤", skillPower: 1.3, skillEffect: "嘲諷敵人並把下一輪隊伍傷害分攤給自己" }
    ,daria: { rarity: 4, role: "指揮", maxHp: 1430, attack: 230, defense: 170, speed: 120, range: 3, attackName: "新曙落筆", skillName: "交班見證", skillPower: 1.4, skillEffect: "提升全隊攻擊與防禦，並重置一名隊友技能冷卻" }
  };

  // 4★ 仍保留重裝、支援、速度等職能差異，但整體基礎面板再上調。
  // 低基礎戰力的 4★ 會進入「平衡成長帶」：不是依性別加成，而是依實際面板
  // 補足起始戰力並提高 70–90 等成長，避免法師、支援或治療因功能定位被判定為低人一等。
  Object.keys(characterBattleStats).forEach(function (id) {
    var stats = characterBattleStats[id];
    if (stats.rarity !== 4) {
      stats.growthRates = { main: 0.03, defense: 0.022, speed: 0.009 };
      return;
    }
    stats.maxHp = Math.round(stats.maxHp * 1.16);
    stats.attack = Math.round(stats.attack * 1.16);
    stats.defense = Math.round(stats.defense * 1.16);
    stats.speed = Math.round(stats.speed * 1.06);
    var basePower = Math.round(stats.maxHp / 10 + stats.attack + stats.defense);
    // 520 是四星非坦克與高面板坦克之間的共同戰力帶目標；
    // 仍保留重裝／守門的耐久優勢，但不讓功能型四星在後期只因初始面板低而落後。
    var parityTarget = 520;
    if (basePower < parityTarget) {
      var deficit = parityTarget - basePower;
      stats.maxHp += Math.round(deficit * 1.5);
      stats.attack += Math.round(deficit * 0.5);
      stats.defense += Math.round(deficit * 0.35);
      stats.speed = Math.max(stats.speed, 100);
      stats.growthBand = "parity";
      stats.growthRates = { main: 0.05, defense: 0.036, speed: 0.014 };
    } else {
      stats.growthBand = "standard";
      stats.growthRates = { main: 0.04, defense: 0.03, speed: 0.012 };
    }
  });

  var trialVersion = "2.0-2.5";
  var trialMaxRewards = 10;
  // 試煉每次成功都提供一大筆獨立角色經驗；每關每版本最多領 10 次，
  // 讓玩家能靠遊玩而不是靠抽卡資源養成角色。完成 30 關並使用版本內
  // 的可重複獎勵後，足以養成一支 4★ 隊伍，不需要依賴重複抽卡。
  // 原共鳴券已取消；每張券按單抽等價 160 星砂併入獎勵。
  var trialReward = Object.freeze({ starSand: 50, characterExp: 1500 });
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
    { id: 21, name: "潮汐書庫外環", region: "潮汐書庫", recommendedPower: 7350, environment: "潮汐書頁", environmentEffect: "每兩回合會交換敵我速度排序，先手不代表永遠先手", modifiers: { teamSpeed: 1.06, enemySpeed: 1.1, enemyAttack: 1.06 }, enemyTrait: "書頁倒流", enemyTraitEffect: "敵方會短暫複製上一個被擊倒單位的增益", trialRule: "time", enemies: [{ name: "霜頁倒流獸", mythicClass: "frost-wolf", maxHp: 8200, attack: 500, defense: 360, speed: 132, count: 2 }, { name: "霜根索引核", mythicClass: "world-root", maxHp: 9800, attack: 460, defense: 390, speed: 88, count: 1 }], reward: trialReward },
    { id: 22, name: "白帆岬燈路", region: "白帆岬", recommendedPower: 7850, environment: "白帆逆光", environmentEffect: "遠程角色命中提高，但敵方護衛會優先切入後排", modifiers: { teamAttack: 1.06, enemySpeed: 1.12, enemyDefense: 1.08 }, enemyTrait: "燈路切入", enemyTraitEffect: "敵人會繞過前排並標記後排最低生命角色", trialRule: "mark", enemies: [{ name: "虹徑切入獸", mythicClass: "rainbow-warden", maxHp: 8700, attack: 520, defense: 365, speed: 156, count: 2 }, { name: "彩徑守望核", mythicClass: "rainbow-warden", maxHp: 10400, attack: 475, defense: 410, speed: 96, count: 1 }], reward: trialReward },
    { id: 23, name: "鏡潮島裂面", region: "鏡潮島", recommendedPower: 8400, environment: "折光裂面", environmentEffect: "正面增益會被折射一次，清除與重新施放需要輪轉", modifiers: { healing: 0.9, enemyAttack: 1.1, enemyDefense: 1.08 }, enemyTrait: "鏡像誤讀", enemyTraitEffect: "敵方會把第一個正面效果轉成自身護盾", trialRule: "copy", enemies: [{ name: "命線鏡獸", mythicClass: "fate-weaver", maxHp: 9300, attack: 550, defense: 390, speed: 120, count: 2 }, { name: "織命主鏡", mythicClass: "fate-weaver", maxHp: 11800, attack: 500, defense: 430, speed: 82, count: 1 }], reward: trialReward },
    { id: 24, name: "深潮測線", region: "深潮測線", recommendedPower: 9000, environment: "低壓深潮", environmentEffect: "治療與護盾效率降低，但控制成功後敵方會暴露弱點", modifiers: { healing: 0.78, teamDefense: 1.08, enemyAttack: 1.12 }, enemyTrait: "深潮壓迫", enemyTraitEffect: "敵方每次命中都會疊加潮蝕，支援與淨化不可缺少", trialRule: "corrosion", enemies: [{ name: "霜海寄生體", mythicClass: "frost-wolf", maxHp: 10200, attack: 575, defense: 405, speed: 126, count: 2 }, { name: "霜海閘核", mythicClass: "world-root", maxHp: 12500, attack: 510, defense: 450, speed: 76, count: 1 }], reward: trialReward },
    { id: 25, name: "風廊維護線", region: "風廊", recommendedPower: 9650, environment: "高空風廊", environmentEffect: "速度波動加劇，角色連續行動時傷害提高", modifiers: { teamSpeed: 1.12, enemySpeed: 1.14, teamDefense: 0.98 }, enemyTrait: "風廊追擊", enemyTraitEffect: "敵方會在連續兩次行動後獲得追擊", trialRule: "ambush", enemies: [{ name: "風角追獵者", mythicClass: "frost-wolf", maxHp: 10900, attack: 610, defense: 420, speed: 168, count: 2 }, { name: "虹風信標獸", mythicClass: "rainbow-warden", maxHp: 13200, attack: 535, defense: 455, speed: 102, count: 1 }], reward: trialReward },
    { id: 26, name: "霧鏡議庭前廊", region: "霧鏡議庭", recommendedPower: 10350, environment: "霧鏡審理場", environmentEffect: "每三回合重新判定一個角色的目標，隊伍需要多功能定位", modifiers: { enemyAttack: 1.14, enemyDefense: 1.1, teamAttack: 1.04 }, enemyTrait: "審理標記", enemyTraitEffect: "被標記角色受到更多傷害，但也能對首領造成額外破防", trialRule: "multi", enemies: [{ name: "符文執行獸", mythicClass: "fate-weaver", maxHp: 11600, attack: 640, defense: 445, speed: 142, count: 2 }, { name: "命線裁定核", mythicClass: "fate-weaver", maxHp: 14100, attack: 570, defense: 490, speed: 86, count: 1 }], reward: trialReward },
    { id: 27, name: "潮眼修復井", region: "潮眼外圍", recommendedPower: 11100, environment: "潮眼脈動", environmentEffect: "敵方護盾會依生命比例重建，爆發與持續傷害都要安排", modifiers: { enemyDefense: 1.14, enemyAttack: 1.12, healing: 0.88 }, enemyTrait: "護盾回潮", enemyTraitEffect: "首領每四回合重建護盾，打斷技能可以延後回潮", trialRule: "shield", enemies: [{ name: "世界根鎧獸", mythicClass: "world-root", maxHp: 12600, attack: 670, defense: 475, speed: 110, count: 2 }, { name: "根脈修復核", mythicClass: "world-root", maxHp: 15400, attack: 595, defense: 530, speed: 72, count: 1 }], reward: trialReward },
    { id: 28, name: "第二條律試讀室", region: "星界終端二層", recommendedPower: 11900, environment: "試讀規則場", environmentEffect: "隊伍第一次倒下不會立刻出局，但會留下永久減益", modifiers: { teamAttack: 1.08, enemyAttack: 1.16, enemyDefense: 1.12 }, enemyTrait: "規則覆寫", enemyTraitEffect: "首領會在血量低於一半時改寫一條環境規則", trialRule: "copy", enemies: [{ name: "霜火規則獸", mythicClass: "fire-giant", maxHp: 13600, attack: 700, defense: 500, speed: 132, count: 2 }, { name: "霜火試讀王座", mythicClass: "fire-giant", maxHp: 16800, attack: 630, defense: 560, speed: 80, count: 1 }], reward: trialReward },
    { id: 29, name: "新曙港邊界", region: "新曙港", recommendedPower: 12750, environment: "新曙潮線", environmentEffect: "所有角色技能效果提高，但敵方會隨回合增加攻擊", modifiers: { teamAttack: 1.1, teamSpeed: 1.04, enemyAttack: 1.18, enemyDefense: 1.14 }, enemyTrait: "曙潮增壓", enemyTraitEffect: "敵方每回合獲得增傷，必須在有限回合內完成突破", trialRule: "decay", enemies: [{ name: "長冬崩解體", mythicClass: "frost-wolf", maxHp: 14800, attack: 735, defense: 530, speed: 150, count: 2 }, { name: "長冬邊界核", mythicClass: "world-root", maxHp: 18200, attack: 660, defense: 590, speed: 92, count: 1 }], reward: trialReward },
    { id: 30, name: "星界之律第二終局", region: "第二條律終端", recommendedPower: 12800, recommendedPowerNote: "建議隊伍戰力約 12,800；低於此值仍可能靠治療、重裝與破防協同通關，但失誤容忍度會明顯降低。", environment: "第二條律終局", environmentEffect: "首領輪換護盾、封鎖與反擊三種姿態，必須完整運用隊伍協同", modifiers: { teamAttack: 1.08, teamDefense: 1.04, enemyAttack: 1.14, enemyDefense: 1.12 }, enemyTrait: "三律輪換", enemyTraitEffect: "首領每三回合更換姿態；護衛與王座會交替施壓，不再只靠高生命拖長戰鬥。", trialRule: "finale", finalStage: true, enemies: [{ name: "末冬護衛", mythicClass: "rainbow-warden", maxHp: 12500, attack: 620, defense: 500, speed: 164, count: 2 }, { name: "新律王座", mythicClass: "fire-giant", maxHp: 18000, attack: 690, defense: 585, speed: 100, count: 1 }], reward: trialReward },
  ];

  // 星海迷航是休閒探索玩法，不應直接借用第 18／30 關的高難度試煉終幕。
  // 這三個專用戰鬥只保留敵人特性與閱讀回饋，推薦戰力和傷害控制在一般玩家能
  // 用 1.0–2.5 已取得角色穩定嘗試的範圍；高難度挑戰仍留在 trialStages。
  var voyageBattleStages = [
    { id: "voyage-combat-1", name: "碎光狹道", region: "星海迷航", recommendedPower: 1200, environment: "碎光航道", environmentEffect: "速度較快的角色容易先手，適合熟悉自走棋戰鬥", modifiers: { teamSpeed: 1.04, enemyAttack: 0.9, enemyDefense: 0.94 }, enemyTrait: "碎光擾動", enemyTraitEffect: "敵人數量較多但單體傷害較低，先處理高速單位即可", trialRule: "echo", enemies: [{ name: "碎光漂獸", maxHp: 1050, attack: 112, defense: 72, speed: 84, count: 2 }, { name: "碎光航標核", maxHp: 1500, attack: 118, defense: 90, speed: 58, count: 1 }], reward: {} },
    { id: "voyage-combat-2", name: "折光風暴", region: "星海迷航", recommendedPower: 3500, environment: "折光風暴帶", environmentEffect: "敵方增益會短暫反射，安排技能順序即可拆解", modifiers: { teamAttack: 1.03, enemyAttack: 0.9, enemyDefense: 0.94 }, enemyTrait: "折光回聲", enemyTraitEffect: "首領第一次施放技能後獲得短暫護盾，破盾後會回到一般狀態", trialRule: "copy", enemies: [{ name: "折光拾荒獸", maxHp: 2850, attack: 188, defense: 132, speed: 105, count: 2 }, { name: "折光風暴核", maxHp: 4600, attack: 222, defense: 168, speed: 74, count: 1 }], reward: {} },
    { id: "voyage-final", name: "星海終端守門者", region: "未命名終端", recommendedPower: 5400, recommendedPowerNote: "星海迷航終幕建議隊伍戰力約 5,400；低於此值仍可透過治療、護盾與協同通關。", environment: "星海終端", environmentEffect: "守門者會輪換護盾與壓制，但不使用星界試煉終局的高傷害規則", modifiers: { teamAttack: 1.05, teamDefense: 1.03, enemyAttack: 0.86, enemyDefense: 0.92 }, enemyTrait: "終端守門", enemyTraitEffect: "護衛倒下後首領會短暫暴露弱點，先擊破護衛能降低終幕壓力", trialRule: "shield", finalStage: true, enemies: [{ name: "星海護航體", maxHp: 4200, attack: 250, defense: 178, speed: 118, count: 2 }, { name: "星海終端守門者", maxHp: 7200, attack: 302, defense: 228, speed: 82, count: 1 }], reward: {} }
  ];

  // 80 等突破專用 Boss。不同角色會對應不同素材來源；每個 Boss 每版本最多領取 10 次，
  // 六種素材來源分成 Lv.1–3 三個獎勵檔位，讓玩家可以透過戰鬥穩定準備突破材料，
  // 同時保留隊伍搭配與重複挑戰的空間。每個檔位安排兩個 Boss，避免刪除既有角色的素材來源。
  var bossVersion = "2.0-2.5";
  var bossMaxRewards = 10;
  var bossStages = [
    { id: "boss-star-warden", name: "星序守望者", region: "星序觀測環", description: "守望者以錯位星序建立護盾，指揮與減防角色能更快找到破口。", recommendedPower: 1500, environment: "錯位星序", environmentEffect: "敵方護盾重新排列，支援與破防效果更有價值", enemyTrait: "星序護盾", enemyTraitEffect: "首領首次施放技能會重建一次護盾", trialRule: "shield", modifiers: { enemyDefense: 1.06, teamAttack: 1.03 }, enemies: [{ name: "星序守衛", maxHp: 2700, attack: 190, defense: 145, speed: 82, count: 2 }, { name: "星序守望者", maxHp: 5200, attack: 260, defense: 215, speed: 96, count: 1 }], reward: { materialId: "star-crest", materialName: "星序碎晶", amount: 1, characterExp: 360 } },
    { id: "boss-tide-archive", name: "潮眼書庫獸", region: "潮汐書庫深層", description: "潮眼把索引頁藏進寄生體的外殼，治療、修復與淨化能降低長線壓力。", recommendedPower: 1700, environment: "深潮索引", environmentEffect: "受到潮蝕的角色治療量降低，修復技能可清除部分效果", enemyTrait: "潮蝕寄生", enemyTraitEffect: "敵人命中後會降低受治療量", trialRule: "corrosion", modifiers: { healing: 0.84, enemyAttack: 1.05 }, enemies: [{ name: "潮眼寄生體", maxHp: 3300, attack: 220, defense: 160, speed: 112, count: 2 }, { name: "書庫潮核", maxHp: 6100, attack: 285, defense: 235, speed: 70, count: 1 }], reward: { materialId: "tide-crystal", materialName: "潮眼晶核", amount: 1, characterExp: 360 } },
    { id: "boss-clock-sentinel", name: "逆時守鐘人", region: "彼岸鐘庭內庭", description: "守鐘人把行動順序切成不同時段，速度與防守輪轉比單純輸出更可靠。", recommendedPower: 1900, environment: "逆時鐘面", environmentEffect: "敵方每三回合重新取得先手，速度增益會延長一輪", enemyTrait: "逆時敲鐘", enemyTraitEffect: "首領技能週期縮短，不能只依賴一名輸出", trialRule: "time", modifiers: { enemySpeed: 1.1, teamSpeed: 1.05 }, enemies: [{ name: "逆時鐘影", maxHp: 3600, attack: 245, defense: 175, speed: 128, count: 2 }, { name: "守鐘人", maxHp: 6800, attack: 300, defense: 250, speed: 78, count: 1 }], reward: { materialId: "clock-core", materialName: "逆時鐘核", amount: 1, characterExp: 360 } },
    { id: "boss-forge-colossus", name: "鍛路熔殼王", region: "鍛路鎮熱管區", description: "熔殼王會把傷害轉成高溫護甲，重裝與持續破防角色能穩定拆解它。", recommendedPower: 2150, environment: "熱管過載", environmentEffect: "爆發傷害提高，但首領每三回合強化下一次攻擊", enemyTrait: "熔殼過載", enemyTraitEffect: "首領攻擊會逐輪升溫，必須在護盾窗口完成輸出", trialRule: "overload", modifiers: { teamAttack: 1.06, enemyAttack: 1.1, enemyDefense: 1.08 }, enemies: [{ name: "熱管鎧獸", maxHp: 4300, attack: 290, defense: 230, speed: 76, count: 2 }, { name: "鍛路熔殼王", maxHp: 7600, attack: 360, defense: 295, speed: 68, count: 1 }], reward: { materialId: "forge-core", materialName: "熱管熔核", amount: 1, characterExp: 360 } },
    { id: "boss-wind-hunt", name: "風廊獵王", region: "北門風廊", description: "獵王會鎖定最脆弱的隊員，高速斥候與射手可以先處理獵影，替隊伍爭取回合。", recommendedPower: 2350, environment: "高空風廊", environmentEffect: "敵我速度波動變大，標記與先手控制更重要", enemyTrait: "獵王標記", enemyTraitEffect: "敵方集中攻擊生命比例最低的角色", trialRule: "mark", modifiers: { enemySpeed: 1.14, teamSpeed: 1.08, enemyAttack: 1.06 }, enemies: [{ name: "風廊獵影", maxHp: 4500, attack: 315, defense: 210, speed: 150, count: 2 }, { name: "風廊獵王", maxHp: 8200, attack: 340, defense: 270, speed: 104, count: 1 }], reward: { materialId: "wind-core", materialName: "風標獵核", amount: 1, characterExp: 360 } },
    { id: "boss-mirror-arbiter", name: "霧鏡裁定核", region: "霧鏡議庭", description: "裁定核會複寫隊伍的增益，仲裁、校準與清除效果可以把鏡像變回弱點。", recommendedPower: 2600, environment: "霧鏡審理場", environmentEffect: "敵方第一次取得增益時會轉成護盾，清除後才會露出核心", enemyTrait: "鏡像裁定", enemyTraitEffect: "敵方技能會短暫複寫一個正面效果", trialRule: "copy", modifiers: { enemyAttack: 1.08, enemyDefense: 1.12, teamAttack: 1.04 }, enemies: [{ name: "霧鏡執行獸", maxHp: 5100, attack: 330, defense: 255, speed: 118, count: 2 }, { name: "霧鏡裁定核", maxHp: 9200, attack: 375, defense: 330, speed: 86, count: 1 }], reward: { materialId: "mirror-core", materialName: "霧鏡映核", amount: 1, characterExp: 360 } }
  ];

  // Boss 等級現在只代表 Lv.1–3 獎勵檔位，而不是角色能不能突破的硬門檻。
  // 每個 Boss 都會給對應專屬材料，並額外給通用突破印記，讓玩家即使先挑戰較容易的 Boss，
  // 也不會因為角色被分配到高等 Boss 而卡住 80 等突破。
  bossStages.forEach(function (stage, index) {
    var level = Math.min(3, Math.floor(index / 2) + 1);
    stage.bossLevel = level;
    stage.difficultyLabel = "Boss Lv." + level;
    stage.recommendedPower = 1450 + (level - 1) * 140;
    stage.reward = Object.assign({}, stage.reward, {
      amount: 1 + Math.floor((level - 1) / 2),
      characterExp: 420 + (level - 1) * 120,
      universalAmount: 1 + Math.floor((level - 1) / 3)
    });
  });
  var universalBreakthroughMaterial = Object.freeze({ materialId: "universal-core", materialName: "星界通用突破印記" });

  var breakthroughMaterialTemplates = {
    "boss-star-warden": { materialId: "star-crest", materialName: "星序碎晶" },
    "boss-tide-archive": { materialId: "tide-crystal", materialName: "潮眼晶核" },
    "boss-clock-sentinel": { materialId: "clock-core", materialName: "逆時鐘核" },
    "boss-forge-colossus": { materialId: "forge-core", materialName: "熱管熔核" },
    "boss-wind-hunt": { materialId: "wind-core", materialName: "風標獵核" },
    "boss-mirror-arbiter": { materialId: "mirror-core", materialName: "霧鏡映核" }
  };
  var characterBreakthroughGroups = {
    "boss-star-warden": ["celesia", "eda", "noreia", "aurelia", "elyra"],
    "boss-tide-archive": ["lia", "rena", "elorna", "risan", "mirea", "maro", "orivelle", "sumine", "cenya", "talia"],
    "boss-clock-sentinel": ["reyn", "chodan", "siyeon"],
    "boss-forge-colossus": ["isar", "harlow", "magenta", "yaoze", "lorne", "kairen", "aster", "kael"],
    "boss-wind-hunt": ["hina", "ferye", "norell", "sorae"],
    "boss-mirror-arbiter": ["veyra", "mave", "evelyn", "jiera", "rotea", "neve"]
  };
  var characterBreakthroughs = {};
  Object.keys(characterBreakthroughGroups).forEach(function (bossId) {
    var template = breakthroughMaterialTemplates[bossId];
    characterBreakthroughGroups[bossId].forEach(function (cardId) {
      var cardData = cards[cardId];
      if (!cardData) return;
      characterBreakthroughs[cardId] = Object.freeze({ bossId: bossId, materialId: template.materialId, materialName: template.materialName, cost: cardData.rarity === 4 ? 4 : 3 });
    });
  });

  var dispatchVersion = "2.0-2.5";
  var dispatchMissions = [
    { id: "dispatch-library", name: "潮汐書庫抄錄", region: "潮汐書庫", description: "把失散的索引頁送回書庫外環，適合均衡隊伍。", recommendedPower: 1350, environment: "書頁風", environmentEffect: "速度較快的角色更容易連續行動", modifiers: { teamSpeed: 1.08 }, enemyTrait: "索引散落", enemyTraitEffect: "敵人生命偏低但數量較多", trialRule: "echo", enemies: [{ name: "索引書獸", maxHp: 1600, attack: 160, defense: 105, speed: 96, count: 2 }, { name: "散頁核", maxHp: 2100, attack: 145, defense: 130, speed: 62, count: 1 }], reward: { starSand: 180, characterExp: 1200, echoPowder: 4 } },
    { id: "dispatch-lighthouse", name: "白帆岬補燈", region: "白帆岬", description: "替燈塔補上夜間回覆信標，重裝或支援角色能穩定完成。", recommendedPower: 1900, environment: "白帆夜潮", environmentEffect: "隊伍防禦提高，但治療效率略降", modifiers: { teamDefense: 1.08, healing: 0.9 }, enemyTrait: "潮夜巡獵", enemyTraitEffect: "敵方會優先攻擊速度最高的角色", trialRule: "mark", enemies: [{ name: "夜潮獵影", maxHp: 2300, attack: 205, defense: 142, speed: 125, count: 2 }, { name: "白帆燈核", maxHp: 2900, attack: 185, defense: 168, speed: 70, count: 1 }], reward: { starSand: 380, characterExp: 1500 } },
    { id: "dispatch-mirror", name: "鏡潮回收", region: "鏡潮島", description: "回收被折光分裂的回覆片段，清除與控場會帶來額外優勢。", recommendedPower: 2550, environment: "鏡潮折光", environmentEffect: "敵方增益會短暫反射，爆發時機很重要", modifiers: { enemyAttack: 1.08, enemyDefense: 1.06, teamAttack: 1.04 }, enemyTrait: "折光護盾", enemyTraitEffect: "敵方首次施放技能後獲得一次性護盾", trialRule: "shield", enemies: [{ name: "折光拾荒獸", maxHp: 3000, attack: 245, defense: 180, speed: 105, count: 2 }, { name: "鏡潮主核", maxHp: 3900, attack: 220, defense: 208, speed: 74, count: 1 }], reward: { starSand: 260, characterExp: 1800, starMarks: 1 } }
  ];

  // 星海迷航：獨立於主線的短局隨機航程。每期抽取一條航線，
  // 玩家在事件、商店、休整和戰鬥之間做選擇，最後依探索條件進入不同結局。
  var voyageVersion = "2.0-2.5";
  var maveLuminousSkin = { id: "skin-mave-luminous-archive", characterId: "mave", characterName: "梅芙", rarity: 4, name: "梅芙｜流光檔案裝", themeLabel: "ARCHIVE OUTFIT", previewTitle: "流光檔案", description: "本期特殊結局獎勵；只改變角色外觀，不改變戰鬥數值。", source: "完成星海迷航協鳴特殊結局後領取", previewImage: "./assets/cards/skins/mave-luminous-archive.png", accent: "#d06cff" };
  var maveSummerSkin = { id: "skin-mave-summer-beach-party", characterId: "mave", characterName: "梅芙", rarity: 4, name: "梅芙｜夏日海灘派對", themeLabel: "SUMMER BEACH PARTY", previewTitle: "夏日海灘派對", description: "第一個夏日造型測試；保留梅芙的臉部特徵，改變服裝、姿勢與完整展示立繪，不改變戰鬥數值。", source: "測試服預覽；正式取得方式待公告", previewImage: "./assets/cards/skins/mave-summer-beach-party.png", accent: "#f2a8d6" };
  var harlowSummerSkin = { id: "skin-harlow-summer-beach-party", characterId: "harlow", characterName: "赫洛", rarity: 4, name: "赫洛｜夏日海灘派對", themeLabel: "SUMMER BEACH PARTY", previewTitle: "夏日海灘派對", description: "第二個夏日造型測試；保留赫洛的臉部特徵與金色眼睛，改變服裝、動作、姿勢與完整展示立繪，不改變戰鬥數值。", source: "測試服預覽；正式取得方式待公告", previewImage: "./assets/cards/skins/harlow-summer-beach-party.png", accent: "#f5c36d" };
  var voyageConfig = {
    version: voyageVersion,
    title: "星海迷航",
    description: "在不改寫主線的漂流航線上，收集星海碎片、處理事件並找出隱藏終點。",
    maxRewards: 3,
    routes: [
      { id: "route-echo", name: "回聲航線", description: "追著多次回響的方向前進，最容易觸發協鳴終局。", nodeIds: ["voyage-start", "voyage-combat-1", "voyage-harmonics", "voyage-rest", "voyage-combat-2", "voyage-final"] },
      { id: "route-market", name: "漂流商路", description: "在碎片商站交換臨時增益，適合先累積資源再挑戰終局。", nodeIds: ["voyage-start", "voyage-combat-1", "voyage-market", "voyage-signal", "voyage-combat-2", "voyage-final"] },
      { id: "route-hidden", name: "無名檔案線", description: "表面獎勵較少，但藏著通往特殊終點的檔案門。", nodeIds: ["voyage-start", "voyage-archive", "voyage-combat-1", "voyage-market", "voyage-secret-gate", "voyage-final"] }
    ],
    nodes: [
      { id: "voyage-start", type: "start", name: "漂流起點", region: "星海外環", description: "航船脫離回覆台的固定座標，接下來的路線會由星海自行排列。" },
      { id: "voyage-combat-1", type: "combat", name: "碎光狹道", region: "碎光帶", description: "小型敵群封住狹道，先確認隊伍的前後排與技能循環。", stageId: "voyage-combat-1", fragmentReward: 1 },
      { id: "voyage-harmonics", type: "event", name: "三重回音室", region: "回音室", description: "三道不同頻率的回聲同時抵達，選擇要聆聽、調和或暫時靜音。", choices: [
        { id: "listen", label: "聽取殘響", description: "收集一道額外線索。", incrementFlag: "echoes", fragmentDelta: 1 },
        { id: "tune", label: "調和兩種頻率", description: "三星與四星共同工作時，可以開啟協鳴條件。", requiresMixedTeam: true, flag: "harmonized", buff: "harmony" },
        { id: "mute", label: "暫時靜音", description: "避開干擾，取得穩定的防護增益。", buff: "quiet" }
      ] },
      { id: "voyage-rest", type: "rest", name: "無重力泊位", region: "泊位環", description: "在沒有方向的泊位短暫停靠，選擇補給或觀察遠方航標。", choices: [
        { id: "anchor", label: "固定航標", description: "多拿一枚碎片並獲得穩定增益。", fragmentDelta: 1, buff: "anchor" },
        { id: "observe", label: "觀察潮汐", description: "記錄回聲，為隱藏路線留下線索。", incrementFlag: "echoes" }
      ] },
      { id: "voyage-market", type: "shop", name: "漂流商站", region: "碎片集市", description: "商站只接受星海碎片，臨時增益會在本次航程結束後失效。", choices: [
        { id: "buy-lens", label: "購買棱鏡鏡片（2 碎片）", description: "提高隊伍對首領的爆發窗口。", costFragments: 2, buff: "lens" },
        { id: "buy-rations", label: "換取航行補給（1 碎片）", description: "保存一次失敗後的重整機會。", costFragments: 1, buff: "rations" },
        { id: "pass-market", label: "不交易，保留碎片", description: "不消耗碎片，繼續前進。" }
      ] },
      { id: "voyage-signal", type: "event", name: "失焦航標", region: "暗面航道", description: "一座沒有名字的航標正在反覆切換方向，任何選擇都會留下不同的回覆。", choices: [
        { id: "follow", label: "跟隨最亮的訊號", description: "收集回聲並取得一枚碎片。", incrementFlag: "echoes", fragmentDelta: 1 },
        { id: "reroute", label: "替它改寫路線", description: "留下檔案標記，之後可能找到特殊門。", flag: "archive", buff: "reroute" },
        { id: "record", label: "只做觀測記錄", description: "不冒險，獲得小幅攻擊增益。", buff: "record" }
      ] },
      { id: "voyage-archive", type: "event", name: "無名檔案室", region: "無名檔案線", description: "這裡沒有角色的故事，只有被刪除又重新留下的航行紀錄。", choices: [
        { id: "read", label: "讀完空白頁", description: "得到兩道回聲與檔案門的線索。", incrementFlag: "echoes", fragmentDelta: 1, flag: "archive" },
        { id: "leave", label: "尊重空白，繼續前進", description: "取得一個安靜增益。", buff: "quiet" }
      ] },
      { id: "voyage-secret-gate", type: "event", name: "回覆檔案門", region: "隱藏座標", description: "只有帶著檔案線索，門才會回覆真正的問題。", choices: [
        { id: "open", label: "開啟檔案門", description: "需要先取得檔案標記，成功後可觸發隱藏結局。", requiresFlag: "archive", flag: "secretGate", buff: "archive-key" },
        { id: "wait", label: "在門前等待", description: "不打開門，但留下回聲線索。", incrementFlag: "echoes" }
      ] },
      { id: "voyage-combat-2", type: "combat", name: "折光風暴", region: "折光風暴帶", description: "敵人會複製隊伍剛使用的增益，必須安排技能順序。", stageId: "voyage-combat-2", fragmentReward: 2, buff: "storm-proof" },
      { id: "voyage-final", type: "boss", final: true, name: "星海終端守門者", region: "未命名終端", description: "守門者不屬於任何版本的主線，只有完整的隊伍協同能讓它暫停回擊。", stageId: "voyage-final", fragmentReward: 3 }
    ],
    endingRewards: {
      normal: { starSand: 160, characterExp: 500 },
      hidden: { starSand: 280, characterExp: 700, petTokens: 1 },
      special: { starSand: 520, characterExp: 1000, starMarks: 1, skinId: "skin-mave-luminous-archive" }
    },
    // seasonSkin 保留給舊版航程與相容性；seasonSkins 讓角色培養頁可同時預覽多個造型。
    seasonSkin: maveLuminousSkin,
    seasonSkins: [maveLuminousSkin, maveSummerSkin, harlowSummerSkin]
  };

  // 星伴培育完全使用獨立資源，不會消耗角色經驗、星砂或命座素材。
  var petVersion = "2.1-companion-workshop";
  var petDefinitions = [
    { id: "star-fox", name: "星絨狐", temperament: "好奇", icon: "✦", accent: "#c49bff", image: "./assets/pets/star-fox.png", maxLevel: 30, description: "會把沒有寄出的回覆藏在尾巴裡，喜歡追逐微小星屑。" },
    { id: "tide-otter", name: "潮泡獸", temperament: "親人", icon: "◌", accent: "#71d8dc", image: "./assets/pets/tide-otter-v2.png", maxLevel: 30, description: "在潮汐邊收集泡沫，靠近玩家時會發出細小的水聲。" },
    { id: "wind-bird", name: "風鈴雀", temperament: "敏捷", icon: "◇", accent: "#86b8ff", image: "./assets/pets/wind-bird.png", maxLevel: 30, description: "會把風向變成旋律，喜歡停在航路標記的最高處。" },
    { id: "mirror-sprout", name: "霧鏡芽", temperament: "安靜", icon: "◈", accent: "#b897e8", image: "./assets/pets/mirror-sprout.png", maxLevel: 30, description: "在霧鏡裡映出不同表情，偶爾會替玩家找到遺失的小物。" },
    { id: "aurora-fawn", name: "極光幼鹿", temperament: "溫柔", icon: "♢", accent: "#8ee6c7", image: "./assets/pets/aurora-fawn.png", maxLevel: 30, description: "鹿角會收集夜空的微光，靠近時會讓工坊的星塵變得柔和。" },
    { id: "rune-drake", name: "符文幼龍", temperament: "頑皮", icon: "✧", accent: "#ff9a94", image: "./assets/pets/rune-drake.png", maxLevel: 30, description: "喜歡把古老符文當作玩具，偶爾會用一聲噴嚏點亮整面牆。" },
    { id: "cloud-whale", name: "雲潮鯨", temperament: "悠閒", icon: "≈", accent: "#79c9ff", image: "./assets/pets/cloud-whale.png", maxLevel: 30, description: "在雲海裡慢慢游動，會把玩家的好心情變成一圈圈潮光。" }
  ];
  var petOutfits = [
    { id: "default", name: "原野本色", icon: "✦", description: "保留寵物的自然外觀，只保留柔和底部光暈。", accent: "#9e92ff" },
    { id: "moon-scarf", name: "月紗圍巾", icon: "☾", description: "在身體下方顯示月光絲帶與流蘇，不會遮住臉部。", accent: "#91b9e8" },
    { id: "tide-cape", name: "潮泡披肩", icon: "◌", description: "以半透明水幕環繞腳邊，與潮泡獸的水流呼應。", accent: "#71d8dc" },
    { id: "archive-crown", name: "檔案小冠", icon: "♔", description: "在頭頂浮出小型檔案冠飾，適合公開展示與特殊結局紀念。", accent: "#d06cff" },
    { id: "aurora-hood", name: "極光兜帽", icon: "⌁", description: "在立繪上方形成柔和極光弧線，保留寵物原本的表情。", accent: "#7de4cf" },
    { id: "star-goggles", name: "星鏡護目", icon: "⊙", description: "在展示框側邊加入可旋轉的星鏡徽記，不壓住眼睛與臉部細節。", accent: "#a58dff" },
    { id: "sail-pack", name: "浮帆背包", icon: "⛵", description: "在身側展開一面小浮帆，呈現輕旅行的出場姿態。", accent: "#f3c56d" },
    { id: "rune-horns", name: "符文角飾", icon: "ᛉ", description: "在上方加入兩道柔光符文角印，適合頑皮型星伴。", accent: "#ff9a94" }
  ];
  var petEffects = [
    { id: "starlit", name: "星屑環", description: "展示框周圍會緩慢旋轉金色星屑，寵物移動時亮度提高。", icon: "✦", color: "#f4c66b" },
    { id: "aurora", name: "極光帶", description: "在寵物背後流動青綠與紫色極光，不會蓋住立繪。", icon: "〰", color: "#71d8dc" },
    { id: "bubbles", name: "泡泡訊號", description: "從寵物周圍浮起不同大小的透明泡泡，展示時持續上升。", icon: "○", color: "#86b8ff" },
    { id: "paper-stars", name: "紙星回覆", description: "飄出帶有檔案折線的紙星，讓公開展示更有回覆感。", icon: "✧", color: "#d06cff" },
    { id: "fireflies", name: "螢光微星", description: "六點微光會連成一個小星座，並以不規則節奏閃爍。", icon: "✺", color: "#f0d47a" },
    { id: "runes", name: "符文浮印", description: "展示框外圍短暫浮出北境符文圈，完成訓練時會脈衝一次。", icon: "◇", color: "#d19cff" },
    { id: "snowfall", name: "霜晶細雪", description: "細小霜晶從上方落下，在寵物腳邊化成淡藍光點。", icon: "❄", color: "#a7dcff" },
    { id: "tide-prism", name: "潮光棱彩", description: "把周圍光點折射成青、紫、金三色棱彩，適合水系星伴。", icon: "◌", color: "#6fe6e0" }
  ];
  var petChallenges = [
    { id: "starlight-run", name: "星光追逐", description: "在工坊軌道追上三顆逃跑的星屑。", cost: "petToys", costAmount: 1, reward: { petExp: 90, bond: 2, mood: 4, petFood: 2 } },
    { id: "tide-treasure", name: "潮汐尋寶", description: "沿著潮泡聲找回被藏起來的小型檔案。", cost: "petFood", costAmount: 1, reward: { petExp: 80, bond: 3, mood: 2, petTokens: 1 } },
    { id: "northern-riddle", name: "北境符文謎題", description: "解開一段陌生的北境符文，換取短暫的共鳴。", cost: "petTokens", costAmount: 1, reward: { petExp: 110, bond: 1, mood: 1, petToys: 2 } }
  ];

  // 天賦先作為後續版本的低幅度資料預留，不在 2.0–2.5 玩家頁開放。
  // 每個角色固定三條分支、每條 5 級，總增益受 10% 上限約束，避免日後數值失控。
  var talentVersion = "3.0+";
  var talentRules = Object.freeze({
    unlockLevel: 40,
    maxLevel: 5,
    totalBonusCap: 0.10,
    materialId: "talent-manual",
    materialName: "專屬天賦手冊",
    branches: Object.freeze([
      Object.freeze({ id: "technique", name: "攻擊手段", effect: "skillPower", perLevel: 0.012, cap: 0.06 }),
      Object.freeze({ id: "role", name: "定位專精", effect: "roleUtility", perLevel: 0.01, cap: 0.05 }),
      Object.freeze({ id: "resonance", name: "界痕共鳴", effect: "teamUtility", perLevel: 0.008, cap: 0.04 })
    ]),
    costByLevel: Object.freeze([0, 1, 2, 3, 4, 5])
  });
  var talentDefinitions = {};
  Object.keys(characterBattleStats).forEach(function (id) {
    var stats = characterBattleStats[id];
    talentDefinitions[id] = talentRules.branches.map(function (branch) {
      return {
        id: branch.id,
        name: branch.name,
        maxLevel: talentRules.maxLevel,
        effect: branch.effect,
        perLevel: branch.perLevel,
        cap: branch.cap,
        preview: branch.id === "technique"
          ? "提升「" + stats.skillName + "」效果，最高 +6%"
          : branch.id === "role"
            ? "強化「" + stats.role + "」定位的協同效果，最高 +5%"
            : "提升隊伍協同的低幅度穩定性，最高 +4%"
      };
    });
  });

  // 劇情入口開放文件 1.0–2.5；每幕由前端與後端共用 id，完成獎勵才能安全地只領一次。
  var tutorialReward = Object.freeze({ starSand: 920, characterExp: 600 });
  var tutorialSteps = Object.freeze([
    Object.freeze({ id: "account", icon: "✦", title: "先看懂你的星界帳號", copy: "進度會綁定遊戲名稱與密碼；登入後抽卡、資源、保底、角色與劇情完成狀態都會自動保存。" }),
    Object.freeze({ id: "lobby", icon: "◇", title: "從星界之律大廳出發", copy: "大廳的劇情、抽卡、角色培養、星界試煉、星港委託、公告與本教學都必須登入後才能使用。" }),
    Object.freeze({ id: "story", icon: "◈", title: "閱讀劇情並取得養成資源", copy: "主線與支線 1.0–2.5 已開放。每幕首次完成可獲得 100 星砂與 650 角色經驗，長篇正文可在劇情頁直接閱讀。" }),
    Object.freeze({ id: "gacha", icon: "✧", title: "了解回覆召集", copy: "限定 4★ 可先選目標；前 20 抽不出 4★，第 21 抽起機率逐步提高，第 50 抽必定出 4★。歪到其他 4★ 會有星砂補償。" }),
    Object.freeze({ id: "growth", icon: "⬡", title: "培養與戰力", copy: "角色培養會提升生命、攻擊、防禦、速度與戰力；重複角色會增加命座並留下該角色專用晶核。三星滿命滿等約接近一般四星 55 等，四星滿命也會提升技能倍率與面板。" }),
    Object.freeze({ id: "trial", icon: "✹", title: "星界試煉與隊伍協同", copy: "最多派出 4 名角色。每關會顯示推薦戰力、敵人數值與特性；總戰力只是參考，治療、護盾、減防、速度和技能搭配都會影響勝負。" }),
    Object.freeze({ id: "dispatch", icon: "⌁", title: "用額外玩法取得養成資源", copy: "星港委託是每版本一次的短篇戰鬥任務，能取得星砂、角色經驗、回響粉或星痕；版本更新後任務進度會重置，角色不會消失。" }),
    Object.freeze({ id: "boss", icon: "♢", title: "80 等突破與 Boss", copy: "角色升到 80 等後不能直接繼續升級；請在 Boss 選單挑戰 Lv.1–3 三檔首領，收集專屬材料或星界通用突破印記，再完成突破並升到現行上限 90 等。100 等仍是後續版本預留內容。" }),
    Object.freeze({ id: "voyage", icon: "✹", title: "星海迷航與特殊結局", copy: "這是獨立於主線的短局航程。選擇事件、商店與休整方式，找出一般、隱藏和協鳴特殊結局；本期特殊四星裝扮藏在特殊結局獎勵裡。" }),
    Object.freeze({ id: "pet", icon: "◌", title: "星伴培育與玩家展示", copy: "寵物有獨立的飼料、玩具和星伴代幣，可餵食、玩耍、訓練、探索、換裝與特效。你可以選擇私人收藏或公開給其他玩家評分，評分只給小額寵物獎勵。" })
  ]);
  var announcements = Object.freeze([
    Object.freeze({ id: "update-2.0-2.5", badge: "大更新", date: "2.0–2.5", title: "第二大版本｜潮眼回覆正式開放", copy: "主線與支線 1.0–2.5 已接入長篇閱讀器；2.0–2.5 角色、星界試煉與星港委託一起加入星界之律大廳。", reward: "+3,200 星砂更新獎勵；每個帳號可領取一次。", highlights: ["劇情正文不再只顯示標題", "星界試煉擴充為 30 關", "版本進度更新不會刪除角色與培養資料"] }),
    Object.freeze({ id: "tutorial-launch", badge: "新手支援", date: "本次更新", title: "新手教學上線", copy: "第一次進入大廳後，可以從新手教學快速了解劇情、抽卡、培養、戰力、星界試煉與星港委託。", reward: "+920 星砂、+600 角色經驗。", highlights: ["完成一次即可領取", "獎勵會寫入目前登入的玩家帳號", "舊玩家也可以補看並領取一次"] }),
    Object.freeze({ id: "trial-improvement", badge: "玩法更新", date: "星界試煉", title: "試煉戰報與敵方情報優化", copy: "每隻可派出角色會直接顯示個別戰力，關卡會展示敵人圖片、攻防速度與敵方特性，方便玩家思考隊伍配合。", reward: "每次成功可取得 50 星砂與 1,500 角色經驗。", highlights: ["最多 4 名角色出戰", "每關每版本最多領獎 10 次", "低於推薦戰力也可能靠協同獲勝"] }),
    Object.freeze({ id: "system-stability", badge: "系統優化", date: "資料保存", title: "玩家進度保存與介面穩定性改善", copy: "登入後的角色持有、命座、專用晶核、等級、資源、保底與劇情紀錄會持續保存；更新時只重置公告明確標示的版本玩法進度。", reward: "角色與養成資料不會因遊戲更新被重置。", highlights: ["修正劇情長文顯示與章節邊界", "角色列表與詳情加入戰力", "圖標、行動版排版與大廳入口調整"] }),
    Object.freeze({ id: "constellation-balance", badge: "戰鬥平衡", date: "命之座／試煉", title: "命座回饋與後期敵方壓力重新校準", copy: "三星滿命滿等不再只增加很小的面板；四星每命也提高技能與面板。試煉 21–30 調整敵方攻擊曲線，讓後期不會只堆生命拖時間，也不會因傷害過高失去組隊空間。", reward: "所有角色與既有培養進度保留，測試補給可直接檢查完整開放名冊。", highlights: ["三星滿命滿等約接近一般四星 55 等", "四星滿命仍保留稀有度與高等級優勢", "終局敵人有清楚推薦戰力與可承受的攻擊壓力"] }),
    Object.freeze({ id: "breakthrough-boss", badge: "養成更新", date: "角色培養", title: "80 等突破與 Boss 挑戰開放", copy: "六種 Boss 分成 Lv.1–3 三檔獎勵；每場勝利會給專屬材料與通用突破印記，避免任何角色因指定 Boss 太難而卡住。", reward: "Boss 勝利可取得突破材料、通用印記與角色經驗；玩家角色與培養進度不會被重置。", highlights: ["Lv.3 的獎勵更豐富", "通用印記可替代任何指定材料", "100 等保留為後續版本玩法，不在本次開放"] }),
    Object.freeze({ id: "star-sea-pet", badge: "玩法更新", date: "星海迷航／星伴培育", title: "主線之外的兩個獨立遊玩區域", copy: "星海迷航提供隨機航線、事件選擇與特殊結局；星伴培育讓玩家照顧寵物、設計外觀與特效，並決定是否公開展示。", reward: "特殊結局可取得本期四星裝扮；寵物探索與社群評分可取得獨立小獎勵。", highlights: ["三條航線與三種結局", "每期隨機一名四星角色裝扮", "公開／私人展示由玩家自行設定"] })
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
      version: "4.0", region: "新曙港", mainTitle: "新曙港的第一束光", mainSummary: "奧蕾雅在新曙港建立天文台，發現港下像樹根一樣分流的界痕脈絡；眾人必須決定第一束光要照亮誰，而不是照亮哪一條最短的路。",
      mainCharacters: ["celesia", "aurelia", "orivelle", "jiera"], mainScenes: [
        { id: "new-dawn", title: "第一束光從哪裡來", body: "新曙港每天都有一束提早抵達的光，天文台把它當成新的中央時間。港下的界痕脈絡像一棵看不見的古樹，將微光分向不同地區；奧蕾雅卻先請港民標出不希望被照亮的區域，讓觀測不會自動變成監視。" },
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
      version: "4.1", region: "碎星工坊", mainTitle: "碎星工坊的熱源", mainSummary: "凱嵐在碎星工坊修復過載熱源，發現霜冷與鍛火其實是同一條界痕脈絡的兩端；隊伍重新面對「效率」與「能不能停下」之間的選擇。",
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
      version: "4.2", region: "遠望塔", mainTitle: "遠望塔的長距離回覆", mainSummary: "索萊與見習修復員塔莉亞讓遠望塔重新連上外海，追查一條像彩虹般跨越界域的回覆橋，但不讓長距離訊號取代當地人的選擇。",
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
      version: "4.3", region: "白夜航路", mainTitle: "白夜航路的記憶", mainSummary: "涅芙整理白夜航路上失效的訊息，發現每個人的選擇都像織在一起的命線；讓被刪除的記憶可以回來，但不被強迫重新公開。",
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
      version: "4.4", region: "回覆海溝", mainTitle: "海溝守門人", mainSummary: "凱爾守住回覆海溝的深層入口，門下傳來像沉睡巨蛇翻身的潮聲；隊伍在沉重壓力下學會讓資源與決定分散保管。",
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
      version: "4.5", region: "第二條律終端", mainTitle: "第二條律", mainSummary: "伊萊拉整理 4.0–4.4 的協議，面對一場不以毀滅為終點、而以重建為選擇的長冬，提出第二條律：任何連線都必須保留拒絕、撤回與重新協商的入口。",
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

  var version5StoryChapters = buildVersionChapters([
    {
      version: "5.0", region: "北境根冠", mainTitle: "根冠上的第十盞燈", mainSummary: "第二條律向北傳遞後，瑟蕾雅一行抵達北境根冠，發現九重界域之外還有一個未被點亮的回覆位置。",
      mainCharacters: ["celesia", "aurelia", "jiera", "elyra"], mainScenes: [
        { id: "tenth-lamp", title: "第十盞燈不急著點亮", body: "北境根冠懸在新曙港以北的雲層上方，九條根脈分別通往已知界域，最外側卻留著一個沒有名字的燈座。奧蕾雅想先測量它，霽羅提醒眾人：空位也可能是有人選擇不被看見。" },
        { id: "root-keepers", title: "守根者不持有根系", body: "根冠的守根者每隔一季交換位置，從不把根系圖帶離觀測室。瑟蕾雅看到他們用風向、霜痕與居民回覆共同判讀界域，理解這裡的神話不是一位神祇的命令，而是人們對共同記憶的稱呼。" },
        { id: "return-the-roots", title: "把根系交回各界", body: "伊萊拉提議把完整根系圖送進中央終端，守根者卻要求分成九份、由各地自行保管。隊伍最後留下可撤回的交會點，沒有替第十個空位填上答案，北境篇因此從一個被尊重的空白開始。" }
      ],
      sideId: "root-register", sideTitle: "北境的根名冊", sideSummary: "補充守根者如何記錄季節、回覆與每一個未被命名的空位。", sideCharacters: ["aurelia", "jiera", "norell"], sideScenes: [
        { id: "season-list", title: "季節不是固定標籤", body: "諾嵐發現根名冊每一季都會改變顏色，守根者說那不是刪除舊資料，而是提醒下一班重新確認風路是否仍然安全。" },
        { id: "unnamed-seat", title: "為空位保留名字", body: "霽羅替空位寫下「尚未命名」而不是「未知」，讓後來的人知道這裡有人做過保留的決定。奧蕾雅把這個欄位加入觀測規則，任何人都能提出更名或撤回。" },
        { id: "register-handover", title: "名冊交給下一班", body: "交班時，守根者不交出一套答案，只交出最近一次被修改的頁面與一盞可以熄滅的燈。北境根冠的第一份支線檔案因此沒有主人，只有下一次確認的時間。" }
      ]
    },
    {
      version: "5.1", region: "霜火鍛環", mainTitle: "霜火雙核", mainSummary: "根冠下方的霜火鍛環同時失去冷卻與加熱的節奏，凱嵐必須讓兩股力量輪值，而不是選出其中一股成為唯一核心。",
      mainCharacters: ["celesia", "kairen", "lorne", "sumine"], mainScenes: [
        { id: "cold-furnace", title: "先熄掉最亮的爐", body: "霜火鍛環的兩座主爐彼此爭奪界痕燃料，最亮的火反而讓整座鍛環無法降溫。凱嵐先熄掉那座最容易被稱為奇蹟的爐，讓每個班次看見停下來會影響誰。" },
        { id: "two-cores", title: "兩個核心不必互相征服", body: "洛恩把霜核與火核拆成兩條可交班的熱管，澄音則在中間加入手動退回段。兩股力量仍然互相拉扯，卻不再需要把其中一股封成敵人，鍛環第一次能同時容納冷卻與前進。" },
        { id: "shared-forge", title: "輪值比王座更可靠", body: "鍛環居民投票決定每月的霜火輪值，並把過載時的停爐權分給四個班次。瑟蕾雅看見火光照亮的不是一個王座，而是一張可以被下一個人改寫的工作表。" }
      ],
      sideId: "forge-long-night", sideTitle: "長夜裡的工具架", sideSummary: "補充霜火鍛環如何把工具、冷卻記錄與停爐權交給不同班次。", sideCharacters: ["kairen", "lorne", "aster"], sideScenes: [
        { id: "cold-tools", title: "工具要先冷下來", body: "艾斯特把會殘留熱量的工具分成兩架，並在交班表上留下冷卻完成的時間。沒有人能因為趕路就跳過等待，工具因此不再把上一班的急迫帶給下一班。" },
        { id: "forge-scratch", title: "刻痕不是恥辱", body: "洛恩把每一次過載刻在公共工具架旁，凱嵐沒有要求把刻痕磨平。看得見的失敗讓新手更早找到安全的停爐點，也讓工坊不必靠傳說維持秩序。" },
        { id: "night-shift", title: "長夜班的最後一盞燈", body: "長夜班結束時，艾斯特把最後一盞火調到能照見退出路線的亮度。霜火鍛環沒有宣布勝利，只讓下一班知道哪裡仍然需要小心。" }
      ]
    },
    {
      version: "5.2", region: "虹徑外環", mainTitle: "虹橋以外的回覆", mainSummary: "遠望塔找到一條通往北境外環的彩色界橋，索萊與塔莉亞必須確認橋的兩端都能拒絕通行，才能讓它真正安全。",
      mainCharacters: ["celesia", "sorae", "talia", "yaoze"], mainScenes: [
        { id: "rainbow-signal", title: "七色訊號不是邀請函", body: "虹徑在雲層上展開七道不同色澤的光，遠望塔的舊規則把它判定成來自北境的邀請。索萊將訊號拆成提示與請求兩層，塔莉亞則逐一尋找每個顏色背後是否真的有人同意連線。" },
        { id: "bridge-ends", title: "橋的兩端都能關閉", body: "曜澤在橋南設下手動燈標，北境居民則在橋北保留另一組開關。當一艘船未經確認就要通過時，兩端同時熄燈，讓跨界通道第一次用拒絕證明自己可靠。" },
        { id: "walk-back", title: "走過去，也要走得回來", body: "瑟蕾雅帶隊通過虹徑外環，沿途把每個分岔點標成可以回頭的位置。通路沒有把兩地變成同一個地方，反而讓兩地都更清楚自己願意交換什麼、保留什麼。" }
      ],
      sideId: "bridge-watch", sideTitle: "橋上不設王座", sideSummary: "補充信標師與橋北居民如何輪流確認跨界通路。", sideCharacters: ["sorae", "talia", "ferye"], sideScenes: [
        { id: "bridge-shift", title: "輪班看橋，不是擁有橋", body: "菲芮把橋面風向、兩端回覆與退回燈分成三欄，提醒見習者：守望只代表當班負責，不代表可以替下一班保證一切安全。" },
        { id: "color-choice", title: "每種顏色都能暫停", body: "塔莉亞發現其中一道虹光會把等待誤認成同意，於是替它加上獨立的暫停訊號。橋面變慢了，但沒有任何顏色再被迫代表肯定。" },
        { id: "return-lantern", title: "把燈帶回原位", body: "完成測試後，索萊把臨時信標交回橋北，而不是帶回遠望塔。下一次通行要由下一班重新確認，虹徑因此沒有固定的主人。" }
      ]
    },
    {
      version: "5.3", region: "命線織庭", mainTitle: "命線織庭的空白梭", mainSummary: "白夜航路的命線在織庭交會，涅芙與梅芙發現最危險的不是看見未來，而是有人替所有人挑出唯一一條未來。",
      mainCharacters: ["celesia", "neve", "mave", "noreia"], mainScenes: [
        { id: "three-threads", title: "三條線都是真的", body: "命線織庭同時保存已發生、正在發生與尚未決定的三種線。梅芙原本想替檔案排序，涅芙卻要求每條線都保留原主人的語氣，因為可能性不能只剩下最容易讀懂的那一條。" },
        { id: "cut-thread", title: "剪線不等於改命", body: "一條命線纏住公共回覆台，議庭要求直接剪斷。諾芮亞先找到受影響的人，發現那條線其實是求助訊號；隊伍改用低負載分流，沒有把麻煩的未來假裝成不存在。" },
        { id: "shuttle-return", title: "把梭交回說話的人", body: "織庭最後只留下空白梭，讓每位線的持有人決定是否繼續編織。瑟蕾雅把第二條律的修改權放回公共架，命運因此不再是一張完成的圖，而是一項可以拒絕的工作。" }
      ],
      sideId: "weaver-school", sideTitle: "織線學徒的三次練習", sideSummary: "補充織庭學徒如何學會分辨記錄、推測與替人做決定。", sideCharacters: ["neve", "noreia", "mave"], sideScenes: [
        { id: "first-knot", title: "第一個結先問誰留下", body: "涅芙教學徒打第一個結時，沒有教她固定形狀，而是先問這段線由誰保留。學徒發現只要缺少這個答案，再漂亮的圖也可能變成擅自公開。" },
        { id: "second-line", title: "第二條線是推測", body: "諾芮亞在織庭標出一條由觀測者推測出的線，並讓它永遠使用不同顏色。梅芙說明，推測可以幫助準備，但不能冒充本人已經做出的選擇。" },
        { id: "empty-shuttle", title: "空白梭留給下一班", body: "學徒完成練習後想把空白梭帶回宿舍，三人請她把它放回公共架。下一個人也許會織出完全不同的路，空白才有真正的用途。" }
      ]
    },
    {
      version: "5.4", region: "深海根門", mainTitle: "深海的回聲守門人", mainSummary: "回覆海溝下方出現新的根門，凱爾聽見像巨蛇翻身的低鳴，卻選擇把開門與封門拆成四組可以彼此否決的權限。",
      mainCharacters: ["celesia", "kael", "mirea", "orivelle"], mainScenes: [
        { id: "root-gate", title: "根門不是王座", body: "深海根門吸收海溝所有訊號，門上的紋路像一條沉睡的長蛇環繞入口。凱爾拒絕把自己稱為唯一守門人，先把物資、醫療、航路與退回分成四把不同的鑰匙。" },
        { id: "undersea-voice", title: "低鳴不一定是命令", body: "澪歌在深處聽見低鳴，海面的人卻把它解讀成必須立刻下潛的命令。奧薇拉修復潮核，瑟蕾雅則把低鳴標成需要確認的訊號，讓未知可以等待而不被強迫翻譯。" },
        { id: "four-keys-return", title: "四把鑰匙一起叫停", body: "根門短暫開啟時，四個班次同時發現海底路線正在改變，於是共同叫停。門沒有被征服，也沒有被永久封死；它保留一條等下一次確認的回來路。" }
      ],
      sideId: "deep-key", sideTitle: "第四把鑰匙的交班", sideSummary: "補充凱爾、澪歌與奧薇拉如何讓退回權不被最勇敢的人帶走。", sideCharacters: ["kael", "mirea", "orivelle"], sideScenes: [
        { id: "key-four", title: "最後一把不是最重要", body: "凱爾原本把退回鑰匙放在自己身上，澪歌提醒他這會讓所有人把停止責任交給同一個人。第四把鑰匙最後由每班輪流保管，沒有誰能永久擁有它。" },
        { id: "pressure-record", title: "把壓力寫進交班表", body: "奧薇拉把海底壓力與每次開門時間並排記錄，發現最危險的時刻不一定最深，而是大家急著證明自己能繼續的時候。" },
        { id: "safe-surface", title: "安全回到水面", body: "深海隊伍最後沿著退回燈線上浮，沒有帶走根門的答案，只帶回四把鑰匙都能叫停的規則。這條規則成為下一版重建前最重要的遺物。" }
      ]
    },
    {
      version: "5.5", region: "新曙終端", mainTitle: "長冬後的九界新曙", mainSummary: "北境長冬讓舊根系暫時沉寂，伊萊拉與瑟蕾雅必須在所有人等待答案時，決定是否讓新的中心再次誕生。",
      mainCharacters: ["celesia", "elyra", "aster", "aurelia", "jiera"], mainScenes: [
        { id: "long-winter", title: "長冬不是末日的另一個名字", body: "九重界域的界痕同時降至最低，所有回覆台都等待新曙終端宣布下一步。艾斯特把舊檔案的失敗與成功一起點亮，提醒眾人：長冬只是系統停止替大家加速的時段，不是誰有權替世界宣告終結。" },
        { id: "no-new-center", title: "不讓新中心先說話", body: "奧蕾雅提出建立一座新的中央觀測塔，伊萊拉卻要求先讓九地各自寫出能接受、不能接受與仍需等待的條件。瑟蕾雅把這些條件接成可撤回的協議，沒有讓任何一地成為唯一發言者。" },
        { id: "new-dawn-law", title: "把新曙交給下一個人", body: "長冬結束時，新曙終端沒有選出新的主人，只把根系、命線、霜火、虹徑與深海鑰匙的修改方式公開。伊萊拉把筆交給下一個願意承擔影響的人，5.5 的終幕因此不是神話完結，而是所有人都能重新開始的清晨。" }
      ],
      sideId: "dawn-archive", sideTitle: "把神話寫回人手", sideSummary: "補充北境居民如何把代代流傳的神話改寫成普通人能使用的規則。", sideCharacters: ["elyra", "neve", "aster"], sideScenes: [
        { id: "old-names", title: "舊名字可以留下", body: "涅芙整理北境居民使用的舊名字，沒有把它們刪成統一格式。每個名字旁邊都附上它在何時保護過人、又在何時可能造成誤解的記錄。" },
        { id: "public-pen", title: "公共架上的筆", body: "艾斯特把所有版本的修改筆放在同一座公共架上，任何人都能取用，也能把不同意的理由寫在旁邊。神話不再只由守根者解釋，而是回到每個受影響的人手中。" },
        { id: "after-dawn", title: "5.5 之後", body: "新曙的第一頁沒有寫下下一個敵人或唯一的英雄，只寫著每條規則的拒絕方式、撤回方式與重新協商時間。北境神話篇暫告一段落，星界之律仍為下一個選擇保持開放。" }
      ]
    }
  ], false);

  // 4.0 起接入原創的「北境神話篇」：借用世界樹、命線、霜火、彩虹橋與終末重建等意象，
  // 不直接套用北歐神名或重述既有神話，讓它成為《星界之律》世界中的新傳承。
  var northernMythArc = {
    id: "northern-myth-arc",
    title: "北境神話篇｜根系、命線與霜火",
    startingVersion: "4.0",
    description: "4.0 從新曙港開始，界痕網絡被北境居民以古老神話重新命名；神話是理解世界的語言，不是替角色決定命運的規則。",
    principles: [
      "世界樹意象 → 連接各界、但不擁有任何一界的界痕根系",
      "命運織線意象 → 可被看見、改寫、撤回的多條可能",
      "霜與火意象 → 需要輪轉的冷卻與前進力量",
      "彩虹橋意象 → 有條件、可中止、雙方都能關閉的跨界通路",
      "終末意象 → 舊規則崩解後的重建，不是世界被抹除"
    ],
    versions: {
      "4.0": { label: "根系與曙光", motif: "世界樹根系／第一束光", note: "天文台在新曙港下方讀到一張向多界分流的界痕根系圖。" },
      "4.1": { label: "霜火鍛造", motif: "霜與火的平衡／鍛路工坊", note: "工坊必須讓冷卻與熱源共同決定何時前進、何時停下。" },
      "4.2": { label: "虹徑回覆", motif: "彩虹界橋／遠距離訊號", note: "遠望塔找到跨界回覆橋，但橋的兩端都保留關閉權。" },
      "4.3": { label: "白夜命線", motif: "白夜／可撤回的命線", note: "每條被看見的可能都必須保留本人收回與改寫的入口。" },
      "4.4": { label: "深淵守門", motif: "深海巨蛇意象／四把鑰匙", note: "海溝深處的壓力提醒眾人，守門權不能集中在一個人身上。" },
      "4.5": { label: "長冬後的新律", motif: "終末與重建／第二條律", note: "長冬不是結局，真正的終幕是讓下一個人能重新協商規則。" },
      "5.0": { label: "根冠與第十盞燈", motif: "九重根域／未命名的空位", note: "根系之外仍有一個沒有被替人命名的回覆位置。" },
      "5.1": { label: "霜火雙核", motif: "霜火輪值／不設王座的鍛環", note: "冷卻與前進都能存在，停爐權也必須被共同保管。" },
      "5.2": { label: "虹徑之外", motif: "彩虹界橋／雙端拒絕", note: "真正安全的跨界通路，兩端都必須能關閉。" },
      "5.3": { label: "命線織庭", motif: "三條可能／空白梭", note: "看見可能不等於替任何人選定未來。" },
      "5.4": { label: "深海根門", motif: "長蛇低鳴／四把鑰匙", note: "未知的低鳴需要確認，不能自動變成命令。" },
      "5.5": { label: "長冬後的新曙", motif: "終末重建／九界共議", note: "神話沒有替世界封口，新曙把修改權交還每一個受影響的人。" }
    }
  };
  Object.keys(northernMythArc.versions).forEach(function (version) {
    var theme = northernMythArc.versions[version];
    version4StoryChapters.concat(version5StoryChapters).filter(function (chapter) { return String(chapter.version) === version; }).forEach(function (chapter) {
      chapter.mythicArc = northernMythArc.id;
      chapter.mythicTheme = theme.label;
      chapter.mythicMotif = theme.motif;
      chapter.mythicNote = theme.note;
    });
  });

  var northernMythTrialThemes = {
    21: "霜頁倒流", 22: "虹徑回覆", 23: "命線折光", 24: "霜海深潮", 25: "虹風獵路",
    26: "符文裁定", 27: "世界根脈", 28: "霜火試讀", 29: "長冬崩解", 30: "末冬新律"
  };
  trialStages.forEach(function (stage) {
    if (!northernMythTrialThemes[stage.id]) return;
    stage.mythicArc = northernMythArc.id;
    stage.mythicTheme = northernMythTrialThemes[stage.id];
    stage.mythicNote = "北境神話篇敵群：以原創的霜、根、命線與虹徑意象重新設計，不直接對應任何神話角色。";
  });

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
      featured4Stars: legacyFour,
      standard4Stars: legacyFour,
      standard3Stars: activeThree
    },
    {
      id: "limited-2-0-to-2-5",
      name: "限定｜2.0–2.5 潮眼回覆召集",
      type: "limited",
      poolKey: "limited",
      defaultFeaturedId: "risan",
      description: "2.0–2.5 新限定池；可從璃珊、曜澤、伊芙琳、澪歌、菲芮、諾芮亞、奧薇拉中選一隻，選中者 55%。",
      featured4Stars: version2Four,
      standard4Stars: version2Four,
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

  /*
   * The long-form document contains scene headings inside several of the
   * original fourth acts.  The importer keeps the complete body (so no prose
   * is lost), but the first pass used to expose all of those paragraphs as one
   * enormous scene.  Split only the explicit "title｜timeline｜place" lines;
   * normal dialogue and prose stay together.  Keeping the first generated id
   * unchanged also preserves old players' completed-scene records.
   */
  function isEmbeddedSceneHeading(line) {
    var text = String(line || "").trim();
    if (!text || text.indexOf("｜") < 0 || text.indexOf("【時間線") === 0) return false;
    if (text.length > 90 || /[。！？!?」』]$/.test(text)) return false;
    return true;
  }

  function embeddedHeadingTitle(line, fallback) {
    var text = String(line || "").trim();
    var title = text.split("｜")[0].replace(/^【|】$/g, "").trim();
    return title || fallback;
  }

  function splitImportedScene(scene) {
    if (!scene || String(scene.body || "").length < 2600) return [scene];
    var paragraphs = String(scene.body).split(/\n+/);
    var groups = [];
    var current = [];
    var currentTitle = scene.title;
    var groupIndex = 0;
    function pushCurrent() {
      var body = current.join("\n").trim();
      if (!body) return;
      groups.push({
        id: groupIndex === 0 ? scene.id : scene.id + "-part-" + String(groupIndex + 1).padStart(2, "0"),
        title: currentTitle || (groupIndex === 0 ? scene.title : "續行"),
        body: body
      });
      groupIndex += 1;
      current = [];
    }
    paragraphs.forEach(function (paragraph) {
      var line = String(paragraph || "").trim();
      if (current.length && isEmbeddedSceneHeading(line)) {
        pushCurrent();
        currentTitle = embeddedHeadingTitle(line, "續行");
      }
      current.push(paragraph);
    });
    pushCurrent();
    return groups.length > 1 ? groups : [scene];
  }

  function normalizeImportedSource(sourceChapter) {
    if (!sourceChapter || !Array.isArray(sourceChapter.scenes)) return sourceChapter;
    var scenes = [];
    sourceChapter.scenes.forEach(function (scene) {
      splitImportedScene(scene).forEach(function (part) { scenes.push(part); });
    });
    return Object.assign({}, sourceChapter, { scenes: scenes });
  }

  function documentChapterTitle(sourceLabel, fallback) {
    var label = String(sourceLabel || "").trim();
    var parts = label.split("｜");
    if (parts.length >= 3) {
      var title = parts.slice(2).join("｜").trim();
      if (title) return title;
    }
    return fallback;
  }

  var storyContinuityGuides = {
    "main-1-0": { focus: "瑟蕾雅第一次穿過界痕，從求生與查案開始，發現黑晶巨獸其實是在尋找回家的路。", hook: "她在第十三扇窗聽見母親留下的四小節旋律，卻只取得一片漆與一個未完成地址。", payoff: "瑟蕾雅學會把隊友放進地圖，不再把自己畫成唯一的退路。" },
    "main-1-1": { focus: "瑟蕾雅沿著回音追查母親的線索，也第一次看見不同的人可以對同一條路給出不同答案。", hook: "移動舞台的聲音把她帶往北境，但回音的收件人始終沒有承諾會回來。", payoff: "她把『想去』和『現在就要出發』分開，為後續尋找彼岸留下空間。" },
    "main-1-2": { focus: "瑟蕾雅與測量師、橋樑匠整理被遺構切斷的路，確認界痕不只會移動，也會改寫誰能被看見。", hook: "一枚舊測量釘指向黑晶來源，卻同時標出一個尚未同意公開的名字。", payoff: "她第一次選擇保留未知，讓查案不再等同於帶走答案。" },
    "main-1-3": { focus: "瑟蕾雅在洛汀港學會，完整的名冊不代表擁有替所有人命名的權利。", hook: "潮線的錯誤讀值牽出一份被刪掉的舊名單，也讓她的母親線索與公共檔案重疊。", payoff: "她把港口的回覆分成公共規則與私人地址，避免用拯救之名重演越界。" },
    "main-1-4": { focus: "瑟蕾雅終於靠近彼岸，卻發現重逢不能用一扇門強行完成。", hook: "艾妲的信只要求她先說清楚能在哪裡停下，而不是保證一定會開門。", payoff: "瑟蕾雅承認思念與等待可以同時存在，並為母女的下一次對話留下選擇。" },
    "main-1-5": { focus: "瑟蕾雅與梅芙整理前五個版本的回覆，發現真正串起世界的不是地址，而是每次有人選擇交班。", hook: "公共檔案的空白頁出現與她相同的星形記號，像有人正在從頁面另一側讀她。", payoff: "她把故事交給明天，卻在空白頁背面看見通往潮汐書庫的第一個索引。" },
    "main-2.0": { focus: "瑟蕾雅帶隊進入潮汐書庫，追查沒有地址的回覆，並確認海圖正在回應她的星痕。", hook: "書庫要求她說明會帶走什麼、留下什麼；最深處卻藏著一頁用母親筆跡寫成的借閱單。", payoff: "她得到通往鏡潮島的地址，但也知道那個地址可能是有人故意留給她的陷阱。" },
    "main-2.1": { focus: "瑟蕾雅在鏡潮島面對兩份互相矛盾的回覆，必須先讓原作者取回自己的句子。", hook: "島上的折光會模仿她母親的聲音，甚至說出只有瑟蕾雅知道的稱呼。", payoff: "她拒絕把熟悉的聲音當成證據，帶著一份仍未判定真假的回覆離島。" },
    "main-2.2": { focus: "瑟蕾雅沿著深潮測線下潛，發現黑晶並非單純污染，而是被遺棄的求救訊號。", hook: "深處的聲音把她叫作『第一個回來的人』，暗示她與界痕的關係早在 1.0 之前就存在。", payoff: "她讓隊伍把控制權交還深處的四個開關，帶回一段不能立刻公開的低鳴。" },
    "main-2.3": { focus: "瑟蕾雅穿越會自行改道的風廊，學會把路線寫成共同協議而非自己的地圖。", hook: "風廊會避開她，卻對她的星痕留下的空白格回應；有人似乎希望她永遠找不到終點。", payoff: "她在離開前留下可撤回的路標，並把真正的追蹤方向指向霧鏡議庭。" },
    "main-2.4": { focus: "瑟蕾雅進入霧鏡議庭，面對一套會替所有證詞排序的審理機制。", hook: "議庭把她十四年前的空白記錄排在最前，彷彿她才是所有界痕事件的起點。", payoff: "她不接受被定罪也不急著自證，把等待與重新申訴寫進下一條規則。" },
    "main-2.5": { focus: "瑟蕾雅回到潮眼，整理 2.0–2.4 的回覆，準備面對世界把她推成中心的誘惑。", hook: "潮眼回覆承認她是目前唯一能讀懂全部界痕的人，卻警告『唯一讀者』也可能成為唯一的囚犯。", payoff: "她沒有關閉潮眼，而是把下一個讀取權拆給隊伍與各地回覆台，迎來 3.0 的第九個回覆。" }
  };

  var main21StoryPolish = {
    title: "鏡潮島的折光",
    summary: "瑟蕾雅帶隊穿過鏡潮島，查明一批被折光成兩份的回覆；島上的聲音模仿她母親，逼她分辨想念與證據。",
    scenes: [
      { id: "island-arrival", title: "島把每個人分成兩個影子", body: "鏡潮島在退潮後露出一條只容一人通過的白石路。瑟蕾雅走在最前，第二個轉角卻有一道影子先一步回頭。伊芙琳想追上去，璃珊伸手攔住她：『先問影子願不願意被追。』影子沒有回答，只在沙上寫下艾妲慣用的四小節歌譜。瑟蕾雅的手指發冷，仍把歌譜畫進記錄，沒有立刻把它寫成重逢。她要求全隊停在潮線外，先確認島上是否有人願意接待他們。影子這才往前走，留下一枚只寫著『第二個名字』的貝殼。雷恩在白石路旁插下退回標記，提醒她即使聲音真的來自母親，也不能讓思念替整隊決定方向。", },
      { id: "mirror-rule", title: "折光先替人回答", body: "島心的鏡潮把每一封回覆折成兩份：一份留下原句，一份補上收件人最想聽的答案。諾芮亞找出分界規則，發現被補上的句子總會多一個『我願意』。伊芙琳想立刻封鎖水面，璃珊卻指出島民有些人真的想保留第二份版本。瑟蕾雅把自己的地圖放進鏡潮，地圖也被複製成兩張：一張標著她想去的地方，一張標著她曾經答應過別人的方向。她沒有選其中一張，而是把兩張都退回原作者手中，要求所有人先說出自己願意承擔的後果。她也公開說明自己的星痕可能是折光的模版，讓島民有機會拒絕她繼續讀取。這個選擇讓隊伍暫時失去最快的路，卻換來一個沒有人被她的沉默代答的夜晚。", },
      { id: "split-replies", title: "兩份回覆都說自己是真的", body: "回聲台前，三名島民為同一封信爭執：白天的回覆說可以開放水路，夜裡的回覆卻說還沒準備好。鏡潮把兩句都判定為本人同意，還用瑟蕾雅的聲音播報『請放心』。她第一次在眾人面前承認，自己的星痕可能正是這套錯誤規則的鑰匙。她可以讓系統更快，也可以把自己的讀取權拆掉。雷恩問她是不是要放棄唯一的優勢，瑟蕾雅回答：『如果只有我能修好，這裡就永遠還是我的問題。』她讓真正的作者逐字取回句子，折光因此沒有消失，卻不再替等待的人投票。當第一名島民把兩份回覆都收回時，鏡潮反而露出一個空白欄位；諾芮亞說那不是故障，而是第一次有人保留了尚未決定的權利。", },
      { id: "mirror-choice", title: "熟悉的聲音也可能是陷阱", body: "鏡潮最後一次升起時，母親的聲音從水面傳來：『回來，瑟蕾雅。』島上的路立刻縮成一條直線，像只要她往前一步，所有問題就會有答案。雷恩抓住她的披風，提醒她這不像艾妲的說法；艾妲總會先告訴她哪裡可以停。瑟蕾雅把星痕貼在潮面，讓整座島聽見自己的回覆：『我想見妳，但我不接受沒有收件人的命令。』聲音短暫改成哭聲，又改成機械的讀取聲。她沒有追上去，只把可疑的聲音標成未判定。鏡面碎開，露出一枚通往深潮測線的黑色郵戳；背面刻著一句新警告：第一個回來的人，不一定是第一個離開的人。島民替她把郵戳封進公共檔案，約定只有本人與下一班見證人能取回。瑟蕾雅離岸時仍不知道那聲音是不是母親，卻終於知道下一步該向誰交代。" }
    ]
  };

  var liveStoryPolish = {
    "main-2.1": main21StoryPolish,
    "side-1-1-qwer": {
      summary: "QWER 在移動舞台上補回一段被漏聽的回音，也讓瑟蕾雅留下的北行標記第一次變成所有人都能使用的訊號。",
      narrativeGuide: { focus: "支線從 QWER 的日常演出切入，補上瑟蕾雅離開後仍持續影響舞台與回覆台的線。", hook: "拾音器裡多出第四個節拍，沒有人確定那是觀眾、失聯者，還是界痕正在模仿掌聲。", payoff: "QWER 放棄把演出完成，先用音樂帶回被困的人，並把新的聲音交給瑟蕾雅確認。" },
      scenes: [
        { id: "guitar", title: "吉他與路標", body: "移動舞台在霧橋鎮外停靠不到半日，Hina 卻發現瑟蕾雅留在路牌上的星形標記被雨沖掉一半。她沒有重新畫成自己的記號，而是把固定和弦彈進每一個停靠點，讓聽得見的人知道下一站可以在哪裡停下。Magenta想把和弦改得更華麗，Chodan提醒她，路標的第一個用途是讓迷路的人不必猜。Siyeon把節拍、風向和距離一起記進拾音器，第一段回音因此指向北方的舊橋。", },
        { id: "voice", title: "歌聲與拾音", body: "Siyeon在整理現場聲音時，發現掌聲總有第四個節拍，比其他三拍慢半步。台下沒有人承認拍過那一下，卻有人在第四拍之後敲了三次金屬。QWER沿著聲音找到被倒塌看台困住的搬運工，才知道他用工具敲擊，是因為不敢大聲喊會讓上方碎石掉下來。瑟蕾雅留下的備註寫著『先記錄低聲音』，Siyeon把這句放在檔案最上方；她們第一次不是用歌把人吸引過來，而是用歌提醒自己安靜地靠近。", },
        { id: "encore", title: "最後一個安可", body: "救援完成後，鎮民要求 QWER 演完最後一首安可。Chodan看著仍未修好的看台，沒有立刻答應；Magenta說可以把舞台移到廣場，Hina卻注意到拾音器裡仍有一個沒有回覆的第四拍。她們最後只演半首，把剩下的時間分給居民報告誰還沒回家。Siyeon將錄音交給遠方的瑟蕾雅，並在封面寫上：這不是完成的曲子，是請妳確認的方向。舞台重新啟程時，第四拍沒有消失，只是不再被誤認成掌聲。" }
      ]
    },
    "side-1-3-harbor": {
      summary: "洛汀港的回收單裡藏著一件不屬於港口的物品；蕾娜與艾洛娜在送回物件之前，先確認它是否真的想被送走。",
      narrativeGuide: { focus: "支線把 1.3 的潮線問題落到港口居民的工作與選擇，讓瑟蕾雅的調查方法在地方被重新理解。", hook: "打撈物上的星形刻痕和瑟蕾雅的記錄相同，卻沒有人能證明它是她的訊號。", payoff: "港口把物件暫存為待本人確認，並將這個結果回報給瑟蕾雅，而不是替她宣布答案。" },
      scenes: [
        { id: "salvage", title: "打撈清單", body: "蕾娜在退潮後清點打撈物，木箱、斷錨和一枚沒有重量的銀片都能找到來源，只有最後一件小盒子沒有。盒面刻著歪斜星形，與瑟蕾雅送來的潮線圖相似；港工立刻說那一定是界痕證物，蕾娜卻把『可能』寫在清單最前面。她知道港口最容易犯的錯，就是把被海帶來的東西當成海同意交出的東西。", },
        { id: "survey", title: "外勤回報", body: "艾洛娜沿著防波堤回測潮線，發現小盒子每靠近回覆台一次，裡面的聲音就多一層。第一層像浪，第二層像孩子哼歌，第三層才是可以辨認的金屬敲擊。她沒有把三層合成一句訊息，而是在回收單背面畫出各自的時間。有人催她直接問瑟蕾雅，艾洛娜回答：『她是最會讀的人，不是替我們同意的人。』", },
        { id: "return", title: "把資料送回去", body: "港口議事桌前，眾人爭論小盒子要不要拆開。蕾娜提出暫存、公開外觀、封存內部三步，讓可能的持有人仍能來取回；艾洛娜則把潮線讀值與三層聲音寄給瑟蕾雅。回覆台短暫亮起，瑟蕾雅只回傳一句：『先保留它的沉默。』港口沒有得到漂亮的答案，卻因此學會把未知送回正確的人手中；小盒子最後被放在有白日投遞時間的石槽裡。" }
      ]
    },
    "side-1-5-files": {
      summary: "梅芙整理公共檔案時發現，一個看似乾淨的索引會把瑟蕾雅旅程裡最重要的『尚未確認』全部刪掉。",
      narrativeGuide: { focus: "支線從檔案室看見瑟蕾雅如何被寫入世界，也提醒玩家主線真相不能只剩一種官方版本。", hook: "同一枚星形符號在三份檔案裡被標成求救、授權與污染，沒有一份能單獨證明自己。", payoff: "梅芙新增來源與撤回欄，讓瑟蕾雅的記錄成為可被查證的線索，而不是不可反駁的命令。" },
      scenes: [
        { id: "labels", title: "先替檔案貼標籤", body: "梅芙把 1.0–1.4 的檔案攤滿公共檔案庫，按照版本、地點、回覆台與原作者重新貼標籤。她很快發現同一枚星形符號在獸靈之村是方向，在洛汀港是待回收，在彼岸鐘庭卻被寫成校準權限。助手問她哪一個才是真的，梅芙回答：『先寫誰看見、誰解讀、誰可能反對；真相不會因為我們把欄位刪乾淨就變簡單。』", },
        { id: "crossref", title: "交叉比對", body: "交叉比對時，瑟蕾雅的名字出現在每一條北行線旁，像她是所有回覆的共同起點。梅芙卻不願把她升格成唯一中心：一份地圖由瑟蕾雅畫出，另一份安全規則由雷恩留下，還有一封拒絕信只屬於寫信的人。她用三種顏色分開親見、轉述與推測，並在索引旁加上『本人可要求更正』。檔案因此變慢，卻不再把同行者的手抹去。", },
        { id: "seal", title: "封存之前", body: "封存前，梅芙在最後一頁發現一個空白索引格。若填上瑟蕾雅的名字，下一位讀者會直接循她的路走；若留白，讀者可能不知道該從哪裡開始。她最後把格子分成兩欄：起點可以參考，決定不能代替。她把尚待確認的問題寄往北行隊伍，也把檔案的更正方式公開。空白頁沒有給出下一個地址，卻讓故事保留了下一個人自己說話的空間。" }
      ]
    },
    "side-2.1-mirror": {
      summary: "鏡潮島居民記錄折光發生前後的生活，補回主線沒有寫下的另一個問題：被複製的句子，如何回到原作者手中。",
      narrativeGuide: { focus: "支線從島民視角補足 2.1 的代價，讓瑟蕾雅的選擇不只是一場解謎，而是有人必須重新相信自己的話。", hook: "折光替每個人留下更好聽的回答，最先被刪掉的卻是那些不確定與不想被看見的部分。", payoff: "島民把原句和補句分開保存，並將瑟蕾雅留下的黑色郵戳改成可撤回的公共標記。" },
      scenes: [
        { id: "mirror-list", title: "鏡面上的第二句話", body: "璃珊每天在鏡潮退去前記錄島民說過的話。她發現有些人明明只說『再想想』，水面卻替他們補上一句『我願意』。居民起初喜歡這種方便，直到一名修船匠因為被補上的回答接下不想接的工作。瑟蕾雅到來時沒有要求看全部名單，只問誰能決定哪些句子可以被她讀。璃珊把這個問題寫在黑板上，第一次沒有讓鏡潮替她回答。", },
        { id: "original-voice", title: "把原句找回來", body: "伊芙琳與諾芮亞在島心找到兩層回聲：外層保存收件人想聽的版本，內層保存說話者吞回去的半句。她們把兩層分開，卻發現很多人已經忘記自己原本說了什麼。璃珊請每個人重新說一次，不要求和舊記錄相同；有人改口，有人維持沉默，還有人承認自己其實想要第三個選項。遠方的瑟蕾雅只留下讀取時間，沒有把自己的判斷寫進名單。", },
        { id: "public-stamp", title: "郵戳不是所有權", body: "瑟蕾雅離島後，居民發現黑色郵戳仍會在夜裡亮起。有人提議把它鎖進議事廳，璃珊卻把規則拆成三句：誰能使用、何時停用、本人如何撤回。郵戳因此不再代表瑟蕾雅的命令，而成為提醒大家先核對原句的公共符號。鏡潮仍會折光，卻不能再偷偷把等待改成同意；島民把這份修訂寄往深潮測線，讓下一段主線知道她們不是被動留下的線索。" }
      ]
    },
    "side-2.3-wind": {
      summary: "風廊維護者接手瑟蕾雅留下的可撤回路標，學會路線不是畫得越完整越安全，而是每個人都知道何時能退回。",
      narrativeGuide: { focus: "支線將瑟蕾雅在 2.3 學會的共同協議交給風廊居民，讓主線成長變成能被別人使用的制度。", hook: "風廊只會避開一種標記：瑟蕾雅畫下的空白格，彷彿有人要她永遠找不到終點。", payoff: "維護者將空白格改成輪值標記，讓路線不再依賴瑟蕾雅一個人的星痕。" },
      scenes: [
        { id: "wind-map", title: "風向維護表", body: "霧橋的維護者把風廊每天的偏移寫在木板上，卻發現瑟蕾雅留下的路線只在她靠近時有效。有人要求她回來重新畫完整地圖，瑟蕾雅回覆可以提供讀值，不能替所有人永久保管路。維護者因此把地圖拆成方向、時間、風險與退回四欄，先讓下一班知道哪裡不能照抄。", },
        { id: "blank-wind", title: "空白格會回風", body: "一陣逆風把所有方向牌吹反，只有瑟蕾雅刻意留下的空白格仍朝原位。學徒想把空白填成安全，老守風人卻說那只是風暫時沒有選擇。隊伍依照輪值表逐段試路，每走一步就回頭報告，結果在第三個路口找到一條被折回來的舊繩。繩結上有雷恩的記號，證明有人在他們之前也曾選擇不往前。", },
        { id: "return-route", title: "把終點還給下一班", body: "維護者沒有追著風廊找一個終點，而是在每個路口設置可撤回的藍燈。瑟蕾雅遠端確認燈的頻率後，要求他們把她的名字從固定值班表移除；她可以是第一位示範者，不能成為永遠的鑰匙。風廊最後吹出一條通往霧鏡議庭的短路，維護者先把通行時間寄給她，再把決定權留給下一班。" }
      ]
    },
    "side-2.4-court": {
      summary: "霧鏡議庭的書記員整理瑟蕾雅案件的證詞，發現最重要的不是判她是否有罪，而是保留每個人還能改口的權利。",
      narrativeGuide: { focus: "支線把 2.4 的審理制度寫得更貼近人，讓瑟蕾雅不被塑造成只靠勇氣推翻規則的英雄。", hook: "議庭把她十四年前的空白排成最有力證據，卻沒有人能說明那段空白由誰留下。", payoff: "書記員新增未決欄與重申訴時間，讓瑟蕾雅的案件可以前進，但不再被粗暴定稿。" },
      scenes: [
        { id: "blank-testimony", title: "證詞的空白欄", body: "霧鏡議庭的書記員整理瑟蕾雅十四年前的檔案，表格上只有『已知』與『不實』兩欄。她把無法證明的記錄全放進不實，直到看見一名證人因為害怕被誤解而收回整段話。瑟蕾雅要求新增空白欄，讓不知道、尚未確認和不願公開不要被迫選成同一個答案。議庭第一次為表格多花了一整天。", },
        { id: "rehearing", title: "重新申訴不是拖延", body: "有人說新增欄位會讓審理永遠結束不了，諾芮亞則把原始讀值、轉述與推測排成三疊，問誰願意替錯誤的判決負責。瑟蕾雅沒有要求立刻洗清自己的名字，只要求把十四年前那一頁標成『待本人與見證人共同重讀』。她知道等待會讓自己不舒服，卻比用一個漂亮結論蓋住別人的記憶更誠實。", },
        { id: "open-record", title: "讓下一個人看得見", body: "議庭最後沒有宣布瑟蕾雅無罪或有罪，而是公開一份可讀的流程：誰能提出異議、何時能補證、哪部分可以拒絕公開。書記員把她的星痕列為重要線索，卻加上『不得單獨作為結論』。離庭前，瑟蕾雅在空白欄寫下自己的名字，再把筆交給下一名證人；審理沒有把她變成答案，而是讓她和所有人一起保留改口的時間。" }
      ]
    },
    "side-2.5-repair": {
      summary: "潮眼修復班把 2.0–2.4 的損壞回覆台逐一接回，並替瑟蕾雅拆出不必由她獨自承擔的讀取權。",
      narrativeGuide: { focus: "支線讓 2.5 的收束落在修理與交班，說明瑟蕾雅成為中心後，世界如何避免再次把所有責任推給她。", hook: "潮核只有在瑟蕾雅靠近時才穩定，修復班必須在保住她與不依賴她之間做選擇。", payoff: "四個回覆台各自保留一把停機鑰匙，瑟蕾雅只留下可被撤回的讀取權，正式銜接 3.0。" },
      scenes: [
        { id: "repair-log", title: "潮核修復日誌", body: "潮眼外圍的修復班先把 2.0–2.4 的故障列成四類：不回覆、重複回覆、過早替人完成，以及把瑟蕾雅的星痕當成總開關。工程師說只要讓她站在中央就能一次修好，瑟蕾雅卻把腳移開，請每個班先找出自己能保管的部分。她不想讓效率再次變成另一種集中。", },
        { id: "four-switches", title: "四把停機鑰匙", body: "修復需要四個手動開關：潮位、聲音、檔案與退回。任何一個開關都能讓系統暫停，卻不能單獨重啟。雷恩負責退回線，伊芙琳讀潮位，璃珊核對原句，瑟蕾雅只在四個讀值一致時提供短暫星光。第一次測試失敗，潮眼把她的影子誤認成授權；她沒有硬撐，而是請全隊退到安全線外重新開始。", },
        { id: "handover-tide", title: "把潮眼交給下一班", body: "修復完成時，潮眼沒有發出勝利鐘聲，只亮起四個可以被任何班次按停的藍燈。瑟蕾雅把最後一段讀取權寫成期限與撤回方式，並將 2.1 鏡潮島送來的黑色郵戳放進公共檔案。潮眼深處傳來一句『第一個回來的人』，她沒有追問，只把聲音交給下一個版本的觀測隊。3.0 的門因此打開，但世界沒有再要求她一個人站在門中央。" }
      ]
    }
  };

  // Filled below with the longer 3.0–5.5 narrative pass.  Keeping this as a
  // separate catalogue makes the locked roadmap easy to review without
  // touching the imported document payload.
  var futureStoryPolish = {};

  Object.assign(futureStoryPolish, {
    "main-3-0": {
      title: "第九個回覆",
      summary: "瑟蕾雅收到一封用母親舊筆跡寫成的內陸回覆，字面卻是「請不要把我們寫回去」。她沿著霽光廊追查，發現第九個節點不是地址，而是一個等待本人開口的空位。",
      narrativeGuide: { focus: "瑟蕾雅第一次面對『熟悉的筆跡也可能不是邀請』，把尋找母親的願望與尊重他人的選擇放在同一條路上。", hook: "那封信的落款使用了只有她和艾妲知道的縮寫，卻拒絕告訴她收件人的位置。", payoff: "她把第九個節點留成可撤回的空白，並在空白背面找到下一個版本的入口。" },
      scenes: [
        { id: "inland-letter", title: "被退回的信", body: "白帆岬八個回覆台同時收到一張被雨水泡皺的薄紙：請不要把我們寫回去。瑟蕾雅一眼認出紙角的星形縮寫，那是艾妲在她童年地圖上留下的記號。雷恩問她是不是終於找到母親，瑟蕾雅把信折好：『我找到的是一個拒絕，還不是一個人。』她仍決定出發，卻先把公開路線改成只到藍旗，不把村子的地址帶走。霽羅在倒扣的路標旁等她，第一句話不是歡迎，而是提醒：『妳可以查，但我們也可以請妳停。』" },
        { id: "wind-village", title: "把村子藏在風裡", body: "霽羅帶隊伍穿過白石驛站與岑光聚落。居民用口述地圖交換物資，有些路只讓醫療隊知道，有些木匣必須由本人親手打開。當八個節點把『沒有回覆』自動標成『同意接入』，瑟蕾雅的星痕突然替整座村子亮起，暴露了隱藏的風路。她差點衝去關閉訊號，霽羅卻把手按在她的地圖上：『先承認是妳的光把它照出來。』瑟蕾雅咬牙切斷自己的讀取權，讓雷恩和居民共同接回低負載的藍燈；第一次，隊伍救人的方法是讓主角退到旁邊。" },
        { id: "ninth-seat", title: "第九個收件人", body: "風暴停下時，村口只剩一張沒有姓名的回覆卡。卡片背面再次出現艾妲的縮寫，前半句寫著『如果是妳，請不要把我帶走』，後半句卻被撕掉。瑟蕾雅想追著撕痕找人，雷恩提醒她村民仍在等自己的水路，霽羅則把空卡放回第九個木匣。她最後在藍旗旁畫下退回點，寫明期限、改口方式與誰能擦掉這條線。那晚她沒有得到母親的地址，只得到一個更難的答案：真正的回覆，必須允許收件人不跟她走。" }
      ]
    },
    "side-3-0-wind": {
      title: "藍旗與空白格",
      summary: "瑟蕾雅離開後，霽羅與雷恩要把她留下的藍旗改成村民自己看得懂、也能自己撤掉的路標。",
      scenes: [
        { id: "flag-order", title: "三面旗的順序", body: "霽羅把三面藍旗交給雷恩：可以繼續、有人正在確認、立刻退回。雷恩想把箭頭畫得更直，第一陣風卻把方向吹反。瑟蕾雅留下的備註寫著『錯了就留下日期』，雷恩原本想撕掉，最後把錯誤和修正一起刻在木板上。他承認自己以前把改正當成丟臉，霽羅回答：『讓下一個人看見你怎麼改，才是路標開始有用的時候。』" },
        { id: "blank-table", title: "空白桌前的回覆", body: "公共院裡擺著物資、海岸供應與空白紙三張桌。有人寫願意收水，有人寫現在不想被記錄，也有人先問海岸究竟知道多少。雷恩想替大家把紙分成同意與拒絕，霽羅把第三疊空白推回他面前：『還沒決定不是半個同意。』最後他把瑟蕾雅的星形標記改成小小的問號，讓村民知道這裡等的是自己的答案。" },
        { id: "return-mark", title: "把退回點畫粗", body: "第一條臨時路線只走到藍旗，沒有繞進村子的門。霽羅請瑟蕾雅遠端確認退回規則，瑟蕾雅沒有替她下結論，只回了一句：『如果你們想擦掉，我會把自己的線一起擦掉。』雷恩把退回點畫得比前進點更粗，卻在旁邊留了空格。這個支線的最後一筆不是新的道路，而是村民第一次知道可以把英雄留下的路重新改成自己的形狀。" }
      ]
    },
    "main-3-1": {
      title: "回覆台的第三種顏色",
      summary: "蘿堤亞修復內陸回覆台時，發現系統會把瑟蕾雅的星痕判定成『所有人都同意』。為了保住等待的權利，瑟蕾雅必須親手拆掉自己最方便的權限。",
      narrativeGuide: { focus: "瑟蕾雅開始懷疑自己不是單純的讀取者，而是界痕系統認定的預設收件人。", hook: "回覆台只要聽見她的聲音，就會把未完成的句子補成肯定。", payoff: "她刪除自己的聲紋鑰匙，讓第三種顏色——等待——第一次能不依賴她存在。" },
      scenes: [
        { id: "third-color", title: "綠與紅之間", body: "內陸回覆台只有綠色的可以和紅色的退回，所有沒有讀完的訊息都被補成綠色。蘿堤亞把第三種顏色改成琥珀色，第一個測試卻在瑟蕾雅開口後立刻變綠。『系統認得妳。』霽羅說。瑟蕾雅望著自己的星痕：『它認得的可能不是我，而是某個很久以前替我寫好的答案。』" },
        { id: "voice-key", title: "把自己的聲音刪掉", body: "為了找出問題，瑟蕾雅用自己的聲音讀完三十七封未完成回覆。每一封都被補成願意，直到一名小鎮居民在燈下大喊『我還沒說完』。她要求蘿堤亞停機，卻發現停止鍵也要她的聲紋。雷恩想砍斷主線，她先把劍按住：『如果我只用力氣解決，下一個人還是只能聽我的。』她把星痕貼上讀取器，將自己的聲音從預設鑰匙中移除，系統因此第一次安靜下來。" },
        { id: "amber-wait", title: "等待不是故障", body: "第三種顏色亮起後，整座回覆台慢得像在打瞌睡。有人抱怨瑟蕾雅讓事情變麻煩，她也差點回答『我可以再替你們快一點』，卻看見琥珀燈下浮出一行母親的舊記錄：先替人保留沒有決定的地方。這不是艾妲的即時回覆，卻是她留下的工作習慣。瑟蕾雅把記錄交給蘿堤亞公開，自己只保留聲音被刪除的日期。新的顏色沒有帶來答案，卻把下一個答案的主人交還給原作者。" }
      ]
    },
    "side-3-1-format": {
      title: "黑木匣的三個欄位",
      summary: "蘿堤亞、霽羅與瑟蕾雅整理黑木匣，讓『尚未決定』不再被藏在介面最不起眼的角落。",
      scenes: [
        { id: "box-without-address", title: "沒有地址的黑木匣", body: "黑木匣裡收著所有未同意公開的地址，只留下回覆時間與撤回方式。蘿堤亞想替它加鎖，瑟蕾雅卻問：『鎖住的是資料，還是本人改口的權利？』她們改成雙人開啟，任何人都能查規則，但原地址只能由本人或指定的人取回。" },
        { id: "wait-column", title: "等待欄不能省略", body: "有人建議刪掉等待欄，好讓表格看起來更乾淨。霽羅拿出最近一次高風誤接線的紀錄，雷恩則指出那條錯路正是由『空白＝同意』造成。瑟蕾雅把自己的聲紋刪除日期寫在欄底，提醒所有人：等待不是系統沒有做事，而是它正在把決定留給還沒準備好的人。" },
        { id: "recompile", title: "重新編譯一遍", body: "蘿堤亞逐筆重跑舊檔案，曾被補成同意的訊息全都加上待確認標記。她問瑟蕾雅是否要把錯誤藏到附錄，瑟蕾雅回答：『如果錯誤曾經傷到人，就不能只讓最會讀的人看見。』黑木匣最後多出一欄「誰可以要求重查」，支線結束時，匣子仍然沒有主人，卻有了回到本人手中的路。" }
      ]
    },
    "main-3-2": {
      title: "河床上沒有中心",
      summary: "白榆河的回覆訊號複製了瑟蕾雅的星痕，讓中央蓄水塔看似能替所有人快速決定。她必須把自己的光拆開，否則整條河都會變成她的回音。",
      narrativeGuide: { focus: "瑟蕾雅第一次真正面對『世界把她當中心』帶來的便利與危險。", hook: "只要她留在中央，水路就能更快恢復；但每一個被省略的拒絕也會從她身上發出去。", payoff: "她切斷自己的主訊號，讓四段水路彼此交班，並在河底看見黑晶正在模仿她。" },
      scenes: [
        { id: "copied-star", title: "河心的複製訊號", body: "白榆河一夜之間亮起相同的星形波紋，中央蓄水塔宣稱已收到瑟蕾雅的授權。她明明沒有簽字，水塔卻用她的語氣播報：『請大家放心，照原計畫供水。』澄音把錄音重播三次，問她是不是自己忘了說。瑟蕾雅回答沒有，語氣卻比平常更快。她終於承認，這不是有人冒充她，而是系統把她過去每一次為了趕路而做的決定拼成了一個假人。" },
        { id: "four-routes", title: "四段水路", body: "河岸居民要求瑟蕾雅直接接管蓄水塔，這樣最快；澄音卻把水路拆成四段，讓每段都能獨立停水、交班與報告。兩種方案在雨季前爭得不可開交，瑟蕾雅也被隊伍分成兩派：雷恩要她保留總開關，璃珊提醒總開關會讓所有人再次依賴她。她最後把星痕接上四個手動開關，然後親手熄掉中央那一盞。『如果世界只有在我亮著時才安全，那就還沒有安全。』" },
        { id: "riverbed-no-centre", title: "河床下的第二個聲音", body: "四段水路順利交班，河床卻傳來一聲低鳴。岑芽在濾芯裡找到黑晶碎屑，碎屑排列成瑟蕾雅童年地圖上的歪圓環。她本想帶走樣本，瑟蕾雅卻先問河岸居民是否同意。低鳴再次響起，水面浮出一句不完整的字：『第一個回來的人，妳終於把手放開了。』瑟蕾雅沒有追問聲音是誰，只把它和日期留下，朝深潮測線的方向看去。她知道下一個敵人可能不是一頭巨獸，而是一個比她更早學會利用她的系統。" }
      ]
    },
    "side-3-2-river": {
      title: "白榆河的輪班表",
      summary: "澄音與岑芽在瑟蕾雅切斷中央主訊號後，第一次學著讓水路靠交班而不是靠英雄維持。",
      scenes: [
        { id: "empty-shift", title: "誰先碰到水輪", body: "澄音把輪班表寫在可以被雨洗掉的板子上，岑芽拿到的不是固定職位，而是一個可以換人的空格。她問瑟蕾雅是不是應該把空格填上，瑟蕾雅回答：『先寫誰願意，再寫誰能替班。』這句話讓岑芽第一次知道，負責不是被指定後才開始。" },
        { id: "six-filters", title: "六枚濾芯", body: "六枚濾芯分別記著水質、時間、交班、拒絕、回收與備用。岑芽想先拆最髒的一枚，澄音卻要求她先讀完前一班留下的拒絕。河水因此晚了半刻鐘重新流動，卻沒有把一戶不願接收的水送進門。瑟蕾雅把這次延遲記成成功，而不是損失。" },
        { id: "sound-handover", title: "交班時把話說完", body: "夜班交給晨班時，澄音沒有只留下數字，而是把一段水聲也錄進檔案。岑芽聽見水輪每隔七下會停半拍，正是中央系統曾替她們掩掉的異常。她把錄音交給下一班，瑟蕾雅則在旁邊畫出退回箭頭。河床沒有中心，卻有一條條能把責任交出去的路。" }
      ]
    },
    "main-3-3": {
      title: "空白座的火",
      summary: "鍛路鎮出現一份看似由瑟蕾雅簽發的集中供能命令，逼她在救急與保留空白之間做出選擇。真正的敵人，是把她的名字變成命令的人。",
      narrativeGuide: { focus: "瑟蕾雅第一次被自己的名義反過來傷害，必須證明她追求的不是把所有人都說服。", hook: "假命令使用她在 1.0 留下的筆跡，甚至知道她會先救誰。", payoff: "她沒有坐上空白座，而是把火源與停止權分給鎮民；火光裡短暫出現艾妲的身影。" },
      scenes: [
        { id: "forged-order", title: "假命令先救最亮的地方", body: "鍛路鎮收到一張『瑟蕾雅已同意集中供能』的命令，最亮的熱管立刻轉向中央空白座。洛恩認出筆跡是真的，雷恩卻指出落款日期在瑟蕾雅尚未抵達之前。她站在熱浪裡，第一次感到自己的名字比黑晶更像武器。若她立刻否認，鎮上的人會失去暖氣；若她先接受，假命令就會變成真的。她要求先把供能分成三路，自己承擔被所有人罵慢的結果。" },
        { id: "blank-seat", title: "空白座不能被佔用", body: "鎮民輪流提出要誰坐上空白座：最懂熱管的洛恩、最敢停爐的瑟蕾雅、最會安撫大家的澄音。瑟蕾雅差點坐下，因為只有坐上去才能直接關掉過載。這時她在座面下看見母親的舊刻痕：『真正的守門人，要能讓座位空著。』她把方格握柄插進控制槽，將所有人的權限拆成短時段，任何一班都能停止，卻沒有人能永久接管。" },
        { id: "fire-path", title: "火只照亮路", body: "熱管分流後，最大的裂口反而露出來：地下有一段古老的星痕導管，正在把瑟蕾雅的名字送往北門。她想追下去，鍛路鎮的孩子卻先問誰來看火。瑟蕾雅把最後一枚空白方格交回工具架，與洛恩約好每兩小時換班。夜裡她在火光中看見一瞬間的女人側影，對方沒有說話，只把手指放在嘴唇前。瑟蕾雅沒有追問，因為那個手勢和 1.0 的四小節旋律一樣：先聽，再決定要不要靠近。" }
      ]
    },
    "side-3-3-forge": {
      title: "鍛路師的空白握柄",
      summary: "洛恩修理一把曾被瑟蕾雅使用過的工具，發現工具的主人不必永遠是最會使用它的人。",
      scenes: [
        { id: "square-handle", title: "方格握柄", body: "洛恩把新握柄做成四方形，不讓任何人習慣把它當成王座。澄音問這樣是否不好用，他說工具可以不舒服，但規則不能偷偷變成命令。瑟蕾雅試握時，手心的星痕短暫發亮；她立刻把工具放回架上，要求洛恩再加一道由下一班確認的卡榫。" },
        { id: "three-fires", title: "三次試火", body: "第一次試火太亮，第二次讓熱管溫度無法交班，第三次才把亮度、停爐時間與退出點一起留下。每次失敗都被刻在公共板上，唯獨一段刻痕像母親的筆劃。瑟蕾雅問洛恩是否知道來源，他回答不知道，卻沒有把它磨掉：『不知道也可以是要繼續查的證據。』" },
        { id: "return-tool", title: "把工具交回去", body: "修好的握柄不留在洛恩手上，而是放回空白座旁的工具架。下一個需要修路的人可以拿走，也可以把它放回；瑟蕾雅在架下加了一行規則：若使用者聽見四小節旋律，先停止，不要追著聲音走。鍛路鎮的人笑她把工具寫得像故事，她回答：『故事也會告訴人哪裡不要踩。』" }
      ]
    },
    "main-3-4": {
      title: "北門沒有終點",
      summary: "北門風路把瑟蕾雅的名字從地圖上刮掉，迫使她面對一個可怕的可能：有人不是要她找到母親，而是要她永遠沿著被留下的線走。",
      narrativeGuide: { focus: "瑟蕾雅開始追查誰在改寫她的路線，並發現『保護她』與『控制她』只差一個沒有被說出的同意。", hook: "地圖刪掉的不是一個地名，而是瑟蕾雅自己的名字。", payoff: "她不把名字硬刻回去，改以可回頭的測線保住選擇，卻收到北境神話篇的第一個根系訊號。" },
      scenes: [
        { id: "wind-sign", title: "風標只指向一邊", body: "北門高地的風把所有旗幟吹向同一側，旅人因此以為前方只有一個方向。瑟蕾雅把第一盞測距燈放在退回點，卻發現燈光照出的地圖上，她的名字正一筆一筆變淡。諾嵐想用墨水補回，她按住他的手：『先看是誰讓它消失。』風裡傳來熟悉的四小節，遠得像母親在另一座山谷試音。" },
        { id: "edge-letter", title: "地圖邊緣的來信", body: "蘿堤亞在地圖邊緣找到被自動刪掉的名字，霽羅卻發現每個名字後面都有一個不願被追蹤的期限。瑟蕾雅把自己的名字放進同一欄，隊伍立刻失去追蹤她的權限。雷恩第一次真正生氣：『妳連我們也不讓找？』她回答：『我想知道，沒有人能找到我時，我還會不會選擇回來。』那晚她獨自走進風線，卻在退回燈旁留下自己的手寫日期。" },
        { id: "no-endpoint", title: "沒有終點的測線", body: "風暴突然把前方旗子吹回高地，所有人按守望表撤退。瑟蕾雅在地圖背面找到一個新印記：根系向北，第一束光尚未點亮。那不是母親的直接訊息，卻像有人知道她一路如何選擇。她沒有把它標成終點，只寫下三個問題：誰在看見我？誰能讓我停？如果我不再是唯一的讀者，這條路還會不會存在？北門沒有答案，但它把 3.5 的終端推到了她面前。" }
      ]
    },
    "side-3-4-north": {
      title: "風路守望表",
      summary: "諾嵐、蘿堤亞與瑟蕾雅把北門測線改成任何人都能接班、也能拒絕的一份守望表。",
      scenes: [
        { id: "watch-table", title: "守望表不是命令", body: "諾嵐把守望表分成看見、等待、退回三欄，最下方留白。蘿堤亞說空白會讓新手害怕，瑟蕾雅卻把自己的名字也放進空白：『如果我不知道，就不要用我的名字替你們填答案。』表格因此多了一個可以提問的欄位。" },
        { id: "dark-practice", title: "熄燈練習", body: "北門居民練習在沒有燈的夜裡辨認退回點，每次由不同的人宣布停止。雷恩問瑟蕾雅為何不保留最後決定權，她回答：『因為最後決定權會讓所有人等我，而我也會開始等自己。』風路沒有因此更快，卻不再只有一個人知道怎麼回來。" },
        { id: "flag-return", title: "風把旗帶回來", body: "突風把前方的旗吹回高地，眾人按照表格退回。第二天旗子仍在，測線也仍在，只有那個被當成終點的想像消失了。瑟蕾雅把北門訊息交給公共檔案，保留一欄不公開的來源，因為那個來源可能仍在觀察她；她不會用好奇心替對方開門。" }
      ]
    },
    "main-3-5": {
      title: "最後一個不回覆",
      summary: "星界終端把瑟蕾雅標成唯一能啟動完整網絡的人。她若簽下名字，世界會立刻恢復同步；她若拒絕，所有回覆台都要在黑暗中重新學會交班。",
      narrativeGuide: { focus: "第三大版本的終幕讓瑟蕾雅選擇『成為中心』或『讓世界沒有中心』，並揭開艾妲當年離開的真正原因。", hook: "終端承認那道裂隙最初是為了把瑟蕾雅送回母親身邊，卻在她穿越後把所有人都鎖在等待裡。", payoff: "瑟蕾雅不簽下唯一主人的名字，只寫下第一條可撤回的星界之律，並決定主動追上母親留下的下一個選擇。" },
      scenes: [
        { id: "terminal-fire", title: "終端最後一盞火", body: "星界終端重新點亮所有舊回覆，只留下最後一個沒有回覆的座位。艾斯特說只要瑟蕾雅把手放上去，1.0 以來的每個節點就會恢復同步。螢幕卻先顯示她十四年前的出生記錄，再顯示一行錯誤：『收件人已被送回，但寄件人未獲准離開。』瑟蕾雅終於明白，母親不是突然消失，而是在關閉一扇原本為她開的門時，被門留在另一側。" },
        { id: "last-no", title: "最後一個不回覆", body: "終端要她用自己的聲音確認『所有人同意』。雷恩、莉亞、霽羅、蘿堤亞與各地回覆台同時傳來不同的聲音：有人想前進，有人想等待，有人只想把自己的地址收回。瑟蕾雅站在空白座前，沒有替任何人投票。她把自己的選項寫成『我不替你回答』，讓最後一個不回覆保留下來。終端因此短暫熄滅，卻沒有崩潰；它開始把沉默當成資料，而不是故障。" },
        { id: "first-law", title: "第一條星界之律", body: "黑暗中，瑟蕾雅聽見母親留下的四小節旋律，這一次後面接著完整一句：『如果妳找到我，請先確認我願意被找到。』她把旋律與終端錯誤一起公開，沒有把私人記憶變成世界的命令。新的第一條律寫成三個入口：可以拒絕、可以撤回、可以重新協商。星界終端沒有選出主人，只把筆交到她手裡；瑟蕾雅卻把筆放回空白座旁，說自己會繼續走，但不再一個人決定世界要往哪裡走。" }
      ]
    },
    "side-3-5-finale": {
      title: "把第一頁留白",
      summary: "第三大版本結束後，瑟蕾雅與夥伴把終端檔案整理成下一段旅程能讀懂、能質疑、也能改寫的第一頁。",
      scenes: [
        { id: "archive-door", title: "檔案門不鎖", body: "艾斯特把終端檔案門保持半開，任何人都能看見規則怎麼寫下，也能提出修改。有人問這樣是否太危險，瑟蕾雅回答：『門不鎖不是因為所有人可信，而是因為所有人都需要知道誰替自己做了決定。』她把母親的錯誤記錄放在最前面，卻把私人地址留在自己的信封裡。" },
        { id: "first-page", title: "第一頁留白", body: "霽羅、諾嵐與艾斯特在新版本紙張的四個角落畫下退回點。瑟蕾雅沒有先寫標題，反而問每個人下一次最想保留什麼。有人說水，有人說名字，有人只想保留不被催促的夜晚。這些回答沒有合成一句漂亮口號，卻讓第一頁比過去更像活著的人。" },
        { id: "after-3-5", title: "通往北方的未寄信", body: "星燈熄滅又亮起，第三大版本的回覆被整理成可查、可撤、可重寫的檔案。瑟蕾雅在私人信封上寫下：『艾妲，我知道妳可能不想被我找到；但我會先寫信，再走到門外。』她沒有把信寄出，因為下一個窗口尚未得到同意。信封背面卻浮出根系般的金線，指向新曙港。故事暫停在門外，不是因為沒有答案，而是因為下一個答案終於不必由她獨自承擔。" }
      ]
    }
  });

  Object.assign(futureStoryPolish, {
    "main-4.0": {
      title: "新曙港的第一束光",
      summary: "瑟蕾雅在新曙港地下讀到一張像樹根般分流的界痕圖，發現每一條根都連著曾經被她回覆過的人。第一束光若由她點亮，所有節點都會看見她；若不點亮，北境將在長夜裡失去方向。",
      narrativeGuide: { focus: "北境神話篇不是把瑟蕾雅變成神，而是讓她看見世界如何把她神話化。", hook: "根系圖的中心不是天文台，而是她在 1.0 留下的第一筆。", payoff: "她選擇讓第一束光照亮撤退點，並在根冠上看到母親留下的缺口。" },
      scenes: [
        { id: "root-map", title: "第一束光從哪裡來", body: "奧蕾雅在新曙港天文台下方挖出一張會呼吸的界痕圖。瑟蕾雅靠近時，九條根脈同時亮起，沿線浮出她曾經寫過的地址：獸靈之村、洛汀港、潮眼，甚至還有一個她從未去過的北境空位。天文台的人要她站到中央，說這樣最容易校準；瑟蕾雅回頭看著隊友：『如果我站在中央，誰來看中央看不到的地方？』" },
        { id: "star-observer", title: "星潮觀測者", body: "星潮像浪一樣壓過港口，觀測者把所有讀值交給瑟蕾雅判斷，因為她的星痕比儀器更早亮起。她先做出正確預測，眾人立刻把她當成答案；第二次，她故意說『我不知道』，系統竟自動替她補成『同意繼續』。奧薇拉追查後發現，根系把瑟蕾雅的每次救援都記成同一個意志。她必須在救港與拆掉自己的權威之間選一個，最後用四面手動旗把預測改成由四班輪讀。" },
        { id: "dawn-protocol", title: "曙光協議", body: "第一束光終於升起，卻沒有照亮最短的航路，而是照亮所有能回頭的坡道。港民起初失望，直到光線掃過天文台底部，露出一塊刻著四小節旋律的根片。瑟蕾雅把根片握在手裡，聽見像母親又不像母親的聲音：『不要把光當成門。』根片背後留著一個缺口，指向碎星工坊。她把缺口標成下一段主線，而不是把它解讀成母親的邀請。" }
      ]
    },
    "side-4.0-dawn": {
      title: "天文台輪班表",
      summary: "奧蕾雅、奧薇拉與瑟蕾雅把新曙港的觀測交班寫成普通人看得懂的規則。",
      scenes: [
        { id: "sky-shift", title: "值班不是擁有天空", body: "奧蕾雅把觀測表分成公開、延遲與只供本人查閱三欄。瑟蕾雅問誰決定哪一欄，奧薇拉把筆遞給當班居民：『先由會被影響的人寫。』第一晚有人把瑟蕾雅的名字填在所有欄位，她立刻劃掉自己的名字，只留下值班時段。" },
        { id: "cloud-night", title: "雲層遮住的夜晚", body: "雲層遮住根系，觀測台看不見任何星潮。有人想用瑟蕾雅的星痕補光，她拒絕後帶大家改用風向、潮聲與港口鐘聲交叉判斷。結果比平常慢，卻避開了一場會把觀測塔推向海裡的側風。她把這次失敗寫成『看不見時，不要假裝看見』。" },
        { id: "handover-dawn", title: "第一班交給下一班", body: "曙光亮起時，瑟蕾雅把根片交給公共檔案，只保留缺口的位置。奧蕾雅問她不怕別人先找到母親的線索嗎，她說怕，但更怕所有人為了她加快速度。輪班表最後多出一行：『想追根的人先確認誰願意一起看。』" }
      ]
    },
    "main-4.1": {
      title: "碎星工坊的熱源",
      summary: "瑟蕾雅在碎星工坊發現霜冷與鍛火其實是同一條根脈的兩端，而她的星痕正把兩端拉向自己。要讓工坊活下來，她必須讓前進與停下同時有位置。",
      narrativeGuide: { focus: "瑟蕾雅第一次看見自己的星痕也能造成過載，並把『救人』與『停止』放在同一個選項裡。", hook: "工坊的冷核記錄著一段與她出生時間重疊的讀值。", payoff: "她讓霜火輪值成為公共制度，卻帶走一枚指向母親的冷核碎片。" },
      scenes: [
        { id: "cold-star", title: "碎星不是燃料", body: "凱嵐把一顆碎星放進鍛爐，火焰立刻變成瑟蕾雅星痕的顏色。工坊居民歡呼能量終於穩定，她卻看見火底有一條黑線正在吞噬冷卻槽。洛恩想把碎星取出，凱嵐說取出會讓全鎮停電。瑟蕾雅沒有下令誰對誰錯，只請每個班次報出最不能承受的損失，讓『效率』第一次被寫成具體的人。" },
        { id: "second-pipe", title: "熱管的第二條路", body: "隊伍找到一條被封死的冷卻管，管壁上刻著和根片相同的歪圓環。瑟蕾雅一碰，管道立刻打開，熱量卻全部向她湧來，像工坊把她認成失散已久的閥門。她差點被燒昏，雷恩用撤退繩把她拉回；瑟蕾雅醒來後沒有再伸手，而是讓凱嵐、洛恩與學徒輪流開關。冷火因此分成兩條可交班的路，黑線卻在她掌心留下了母親的聲紋。" },
        { id: "cooldown-law", title: "冷卻也要寫進律", body: "工坊恢復運作後，居民想把所有過載紀錄刪掉，免得外界以為他們不可靠。瑟蕾雅拿出掌心的黑線：『如果我只公開修好的部分，下一次還會有人把最亮的火當成安全。』她與凱嵐寫下霜火規則，包含停爐權、冷卻時間和誰能拒絕重啟。夜深時，冷核裡傳出艾妲的四小節旋律，後面接著一個陌生日期：4.2 之前，不要走虹徑。" }
      ]
    },
    "side-4.1-forge": {
      title: "空爐旁的工具架",
      summary: "凱嵐、洛恩與瑟蕾雅整理工坊工具，讓維修知識不再跟著某一個天才離開。",
      scenes: [
        { id: "tools-no-owner", title: "工具不跟著主人走", body: "洛恩把工具分成熱、冷、退回三架，瑟蕾雅發現每一把都刻著使用者姓名。她要求把姓名改成使用時段與交班方式，洛恩一開始嫌麻煩，後來在一把失控扳手上找到自己的名字。工具沒有背叛他，是他把上一班的急迫一起帶進了下一班。" },
        { id: "overload-scratch", title: "把過載刻出來", body: "凱嵐想磨平爐壁上的過載刻痕，瑟蕾雅阻止他，請他把每道刻痕旁補上『誰在場、誰喊停、哪裡來不及』。學徒看見紀錄後，第一次敢在最亮的火前按下停止。工坊少了幾分鐘產量，多了幾十年能被傳下去的安全。" },
        { id: "cool-handover", title: "冷卻後再交班", body: "最後一盞火調暗時，瑟蕾雅把冷核碎片放進不公開的證物袋，沒有讓任何人用好奇心取走。她在工具架旁留下根片缺口的拓印，讓想追查的人知道應該先申請、再靠近。這份支線沒有揭開母親的答案，卻保住了下一個人不被答案燙傷的機會。" }
      ]
    },
    "main-4.2": {
      title: "遠望塔的長距離回覆",
      summary: "瑟蕾雅與遠望塔追查彩虹般跨界的長距離回覆，發現橋的另一端有人用母親的聲音呼喚她，卻不一定願意讓她通過。",
      narrativeGuide: { focus: "瑟蕾雅在北境學會，跨得更遠不等於更接近母親；真正重要的是橋的兩端都能說不。", hook: "虹光對她的星痕開門，對其他人卻只留下拒絕訊號。", payoff: "她把跨界橋的關閉權交給兩端，並把母親的呼喚改成可核對的問句。" },
      scenes: [
        { id: "far-signal", title: "看得遠，不代表知道得多", body: "遠望塔接到七色訊號，最短的解讀把它判成北境邀請。索萊讓塔莉亞再測一次，結果瑟蕾雅的星痕才亮，虹光就拼出『回來』兩字。她差點走上橋，卻在橋面看見另一行被風刮掉的字：『誰同意？』瑟蕾雅把訊號拆成提示與請求，請塔上每個人先回答自己是否願意看見後果。" },
        { id: "apprentice-stop", title: "見習生的第一個退回點", body: "塔莉亞第一次值班時誤把等待燈當成通行燈，橋面立刻伸向北境。瑟蕾雅沒有責備她，而是讓她自己按下退回。塔莉亞的手在發抖，卻成功把光收回。索萊承認自己過去總替見習生按鍵，才讓錯誤看起來像沒有發生；瑟蕾雅把這句話記進規則，因為她也曾替別人把故事寫得太快。" },
        { id: "rainbow-stop", title: "長距離也要能停", body: "虹橋第三次開啟時，橋的北端傳來艾妲的聲音：『瑟蕾雅，先不要過來。』這句話讓她鬆了一口氣，也讓她更確定聲音不能單獨當證據。她要求兩端各留一組開關，任何一端都能關閉；自己則站在中點不前進。光橋最後縮成一封可核對的短訊，內容只有時間、天氣與一個問題：『妳能在哪裡停下？』" }
      ]
    },
    "side-4.2-tower": {
      title: "信標見習筆記",
      summary: "索萊、塔莉亞與瑟蕾雅把遠望塔的操作交給下一班，補回長距離訊號容易忽略的人。",
      scenes: [
        { id: "dry-lens", title: "鏡片先擦乾淨", body: "塔莉亞想立刻讀虹光，瑟蕾雅先讓她擦乾鏡片、確認風向、問值班者是否同意開燈。三個步驟讓訊號慢了半分鐘，卻抓到一束其實來自海面反射的假彩光。塔莉亞笑說英雄故事不會寫這些，瑟蕾雅回答：『所以我們要把真正救人的部分寫進去。』" },
        { id: "three-checks", title: "三次確認再發光", body: "索萊把三次確認拆給三個人，任何一人說不，虹光都只能停在提示狀態。瑟蕾雅把自己的名字從最後一欄移開，換成『當事人』。見習生問這樣誰知道該找她，她指向撤回規則：『需要找我的時候再找，不要因為我比較熟就先替我同意。』" },
        { id: "tower-handover", title: "把塔交給見習生", body: "交班時，塔莉亞把七色訊號交給下一班，沒有把瑟蕾雅的私人短訊放進公共燈號。她說那是因為有人值得被保護，瑟蕾雅補充：『也因為被保護的人仍然有權決定何時公開。』遠望塔第一次在沒有主角站中央的情況下完成一次穩定回覆。" }
      ]
    },
    "main-4.3": {
      title: "白夜航路的記憶",
      summary: "瑟蕾雅進入白夜航路的記憶織層，發現被刪除的不是資料，而是人們曾經拒絕被記住的選擇。她必須分辨救回記錄與強迫復原。",
      narrativeGuide: { focus: "瑟蕾雅面對自己的記憶也可能被別人保存，並第一次承認她不必把所有失去都找回來。", hook: "一條命線顯示艾妲曾經在她出生前看見『瑟蕾雅會成為中心』。", payoff: "她把命線剪成可由本人取回的片段，保留母親線索但不把母親的選擇還原成她的責任。" },
      scenes: [
        { id: "white-night", title: "一直亮著的白夜", body: "白夜航路沒有黑夜，所有記憶都像被掛在天上。涅芙告訴瑟蕾雅，這裡最危險的不是遺忘，而是每個人都以為亮著就代表可以閱讀。瑟蕾雅在一條銀線上看見幼年的自己，旁邊站著尚未離開的艾妲；她伸手想把那一幕取下，線卻先問：『誰同意妳看？』" },
        { id: "memory-recovery", title: "回收不是復原", body: "隊伍找到大量失效訊息，梅芙想按時間拼回完整記錄，諾芮亞卻發現其中幾段是當事人主動要求刪除。瑟蕾雅在自己的記憶線上也看見一個被她忘掉的夜晚：她曾答應母親不要追著根系走。她沒有把那段記憶強行拉回，只請涅芙把它標成『本人可取回』。被救回的不是內容，而是選擇內容的權利。" },
        { id: "white-night-rest", title: "讓白夜也有休息時間", body: "白夜航路開始過載，所有記憶同時播放，瑟蕾雅的童年聲音與現在的母親旋律重疊。她想再撐一會兒，雷恩卻關掉她面前的讀取燈：『妳不是證明自己能看完的人。』她第一次主動按下休息，讓織層只保留三條被本人同意的命線。離開前，一條未讀線在她背後亮起，寫著『4.4 深海根門』，像有人知道她會選擇放下。" }
      ]
    },
    "side-4.3-memory": {
      title: "失效訊息清單",
      summary: "涅芙與瑟蕾雅整理不再需要公開的回覆，讓刪除不再等於消失，也不等於被旁人永久保管。",
      scenes: [
        { id: "list-not-tomb", title: "清單不是墓碑", body: "涅芙把刪除申請列成清單，瑟蕾雅問這會不會又把人固定在過去。她們改把每一項寫成『由誰、何時、用什麼方式可以取回』，並把沒有取回期限的項目交回本人。清單因此不是墓碑，而是一排能被關上的門。" },
        { id: "private-page", title: "只給本人看的頁面", body: "一名航路居民要求保留自己的聲音，卻不想讓隊伍聽見。瑟蕾雅把頁面權限交回對方，自己只看見『已完成交接』。她發現不知道內容並不會讓她失去責任，反而提醒她責任有邊界。" },
        { id: "close-archive", title: "把檔案闔上", body: "梅芙最後一次確認公開欄位時，瑟蕾雅把母親的命線放進私人夾層。她沒有否認那條線重要，只說重要不等於所有人都能閱讀。檔案闔上後，白夜仍在，但它終於不再要求每個人永遠睜眼。" }
      ]
    },
    "main-4.4": {
      title: "海溝守門人",
      summary: "瑟蕾雅在回覆海溝下找到一座會呼喚她的根門，低鳴像沉睡巨蛇翻身。真正的危險不是門後有什麼，而是門只認她一個人。",
      narrativeGuide: { focus: "瑟蕾雅面對最直接的權力誘惑：根門只要她一個人的聲音就能開啟。", hook: "低鳴用她幼年時的乳名呼喚，暗示母親曾把她的聲音藏進根門。", payoff: "她拆成四把彼此能否決的鑰匙，讓根門能開也能被所有班次共同叫停。" },
      scenes: [
        { id: "trench-gate", title: "海溝的門不是王座", body: "海溝底部的根門像一條沉睡的長蛇環繞入口，門紋在瑟蕾雅靠近時亮成星色。凱爾說只要她念出名字，所有深海資源都能重新分配；瑟蕾雅聽見門內傳來母親曾用的乳名，卻先問『如果只有我能開，誰能阻止我？』門沒有回答，反而把她的影子拉長。" },
        { id: "pressure", title: "壓力會讓人想快一點", body: "深海壓力讓隊伍的呼吸變短，四個班次開始互相催促。奧薇拉主張立即關門，澪歌卻聽見裡面有人的呼救；瑟蕾雅把兩個聲音都寫進戰報，拒絕替任何一邊先翻譯。她將物資、醫療、航路與退回拆成四把鑰匙，規定任何一把都能暫停，卻沒有一把能單獨開門。" },
        { id: "four-keys", title: "四把鑰匙一起叫停", body: "根門短暫開啟，海底浮出一座像白鐘工坊的舊房間。瑟蕾雅看見十四年前的自己站在門另一側，艾妲正把一枚冷核塞進她手裡。她差點游過去，卻聽見凱爾喊停，四把鑰匙同時熄滅。門沒有被征服，也沒有被封死；瑟蕾雅只帶回一段低鳴與一個結論：母親曾經把她送出去，不是因為不想要她，而是因為門只會聽她一個人。" }
      ]
    },
    "side-4.4-trench": {
      title: "四把鑰匙的交班",
      summary: "凱爾、澪歌、奧薇拉與瑟蕾雅建立海溝入口的分散權限，讓最勇敢的人不能單獨把所有人帶進深處。",
      scenes: [
        { id: "separate-keys", title: "鑰匙先分開", body: "凱爾原本把四把鑰匙掛在同一條腰帶上，瑟蕾雅請他先把退回鑰匙交給下一班。凱爾不服，問誰比他更熟海溝，她回答：『熟悉不是永遠保管的理由。』四把鑰匙分到四個房間，任何人想靠近都要先經過別人的門。" },
        { id: "stop-button", title: "誰都可以按住流程", body: "澪歌測試深海低鳴，奧薇拉測試壓力，凱爾測試潮汐，瑟蕾雅只負責把四份資料放在同一張表。當她的星痕自行亮起時，四人同時按下停止。沒有人把這次當成失敗；因為根門第一次沒有把她的光當成唯一命令。" },
        { id: "return-route", title: "海溝也要有回來的路", body: "交班表最後新增一條回來路：誰若進入深處，至少要留下兩個能拒絕他繼續的人。瑟蕾雅把母親的低鳴放進未公開欄，沒有用它換取特權。支線結束時，海面看不見根門，卻看得見四盞會在任何一班叫停的藍燈。" }
      ]
    },
    "main-4.5": {
      title: "第二條律",
      summary: "長冬讓各地回覆台停擺，瑟蕾雅必須把 1.0 以來的錯誤攤開，決定要不要讓世界再次建立一個只聽她的中央。答案會揭開艾妲當年離開的真正代價。",
      narrativeGuide: { focus: "4.5 是瑟蕾雅從追尋母親轉向主動定義世界規則的轉折點。", hook: "長冬不是自然災害，而是中央系統在等待她簽下唯一主人的名字。", payoff: "她寫下第二條律並拒絕成為中心，讓北境神話篇從控制命運轉向共同承擔。" },
      scenes: [
        { id: "law-first-line", title: "第二條律的第一行", body: "長冬降下時，所有回覆台只剩微弱藍燈。伊萊拉把各地協議攤在桌上，最上方卻不是災情，而是一份等待瑟蕾雅簽名的任命書：中央讀者。她翻到背面，看見艾妲十四年前的簽名和一句話：『若她回來，不要讓她成為唯一答案。』瑟蕾雅撕掉任命書，說第二條律第一行不能寫權限，必須先寫拒絕。" },
        { id: "return-points", title: "把所有退回點接起來", body: "隊伍把獸靈之村的藍旗、洛汀港的收件人、潮眼的四把開關、北境的根門全部接成一張圖。每接上一個節點，就會有一段舊錯誤亮起：她曾經替誰做過決定、誰曾因她的速度受傷。瑟蕾雅沒有把錯誤改成漂亮的成功曲線，而是讓每個名字都能要求重查。中央系統因此開始崩解，卻也第一次吐出母親被留在彼岸的完整原因。" },
        { id: "second-law", title: "讓下一個人可以改寫", body: "艾妲當年發現根門只認瑟蕾雅，若把女兒留在彼岸，世界就會一直等她回來；若送她離開，自己便必須成為門的看守人。瑟蕾雅哭著讀完，卻沒有把母親的選擇改寫成犧牲。她在公共終端寫下第二條律：任何連線都必須保留拒絕、撤回與重新協商。律文完成後，長冬沒有立刻結束；第一束新的光從她身後亮起，照出一條不要求她回頭的北路。" }
      ]
    },
    "side-4.5-law": {
      title: "可撤回協議手冊",
      summary: "伊萊拉與瑟蕾雅把各地的拒絕、撤回與重談規則整理成普通人能使用的手冊，讓第二條律不是只給專家看的口號。",
      scenes: [
        { id: "refuse-first", title: "手冊先寫怎麼拒絕", body: "伊萊拉把手冊第一頁改成拒絕方式，瑟蕾雅補上『可以不用解釋原因』。奧蕾雅擔心新使用者會因此不敢開始，她們便在旁邊加上重新詢問的時間與對象。拒絕不是把人推走，而是把門的控制權放回對方手裡。" },
        { id: "revision-trace", title: "每一次修改都留痕", body: "涅芙把過去版本的修改保留在邊欄，瑟蕾雅要求連自己的錯誤也不能省略。有人問玩家真的看得完嗎，她回答：『不必每個人都看完，但需要的人不能找不到。』手冊從規則變成一張地圖，標出哪裡曾經讓人受傷。" },
        { id: "after-law", title: "4.5 之後", body: "最後一頁只寫著：下一次協商從這裡開始。瑟蕾雅在頁角畫了根系與四小節旋律，沒有寫母親的地址。她知道 5.0 的路會往北延伸，卻先把能拒絕她的欄位交給下一班。這是她第一次把未知留著，不是因為害怕，而是因為信任需要對方能說不。" }
      ]
    }
  });

  Object.assign(futureStoryPolish, {
    "main-5.0": {
      title: "根冠上的第十盞燈",
      summary: "第二條律向北傳遞後，瑟蕾雅抵達北境根冠。九條根脈各有名字，最外側卻留著一盞沒有被點亮的燈；燈座上刻著她真正不敢讀完的那封信。",
      narrativeGuide: { focus: "5.0 把瑟蕾雅推到北境神話的核心，讓她面對自己是否要替未知命名。", hook: "第十盞燈的燈座刻著『不要點亮』，落款卻是艾妲。", payoff: "她不點燈，改把空位分成九份交回各界，並取得母親留在根冠的下一段訊息。" },
      scenes: [
        { id: "tenth-lamp", title: "第十盞燈不急著點亮", body: "北境根冠懸在新曙港上方，九條根脈通往已知界域，最外側留著一個沒有名字的燈座。奧蕾雅說只要瑟蕾雅點亮它，所有界域就能在同一刻看見彼此；瑟蕾雅卻在燈座底部找到母親的刻字：『如果妳走到這裡，不要先點亮。』她的手停在開關上，雷恩問她怕的是什麼，她回答：『怕我終於有能力把所有人叫醒，卻忘了問他們想不想醒。』" },
        { id: "root-keepers", title: "守根者不持有根系", body: "守根者每一季交換位置，從不把完整根系圖帶離觀測室。瑟蕾雅原本以為這是保守，直到她看見每個人都只保管一段，卻能在交班時拼出完整的風、霜、潮與命線。根冠的神話不是一位神祇的命令，而是許多人願意互相限制的記憶。夜裡，根系忽然模仿瑟蕾雅的聲音，說出她兒時的乳名；守根者沒有開門，只問她是否願意聽。她選擇只聽到第一句。" },
        { id: "return-roots", title: "把根系交回各界", body: "伊萊拉提議把完整根系圖送進中央終端，讓所有人不必再猜。瑟蕾雅拒絕把九界重新綁成一張唯一的圖，改把根系分成九份，讓各地自行保管、交叉核對、隨時撤回。第十個空位仍沒有名字，她卻在燈座下找到一片冷核：裡面封著艾妲的一句話，『妳若要來，請先以自己的名字，不要以世界的中心來。』5.0 的終幕不是點燈，而是瑟蕾雅決定用自己的腳走向根冠之外。" }
      ]
    },
    "side-5.0-root-register": {
      title: "北境的根名冊",
      summary: "守根者、瑟蕾雅與下一班觀測者整理季節與空位，讓神話不再只有一種官方讀法。",
      scenes: [
        { id: "season-list", title: "季節不是固定標籤", body: "諾嵐發現根名冊每一季都會變色，守根者說那不是刪掉舊資料，而是提醒下一班重新確認風路是否安全。瑟蕾雅在名冊中看見自己的名字被寫成『旅人』，旁邊留了一格空白。她沒有補上英雄或讀者，只寫下本次值班時間。" },
        { id: "unnamed-seat", title: "為空位保留名字", body: "霽羅替第十盞燈寫下『尚未命名』而不是『未知』。瑟蕾雅問兩者有什麼不同，她回答：未知像等待別人解答，尚未命名則承認有人選擇暫時不說。守根者把這個欄位加入觀測規則，任何人都能提出更名，也能要求把自己的名字擦掉。" },
        { id: "register-handover", title: "名冊交給下一班", body: "交班時，守根者不交出答案，只交出最近一次被修改的頁面與一盞可以熄滅的燈。瑟蕾雅把冷核放進私人信封，讓根名冊只記『有一封未公開回覆』。她離開前回頭看第十盞燈，燈沒有亮，卻比任何亮起的燈更像一個真正的選擇。" }
      ]
    },
    "main-5.1": {
      title: "霜火雙核",
      summary: "根冠下方的霜火鍛環同時失去冷卻與加熱節奏，瑟蕾雅發現其中一枚冷核保存著她被送離彼岸前的記憶。她必須決定修復世界，還是先打開自己。",
      narrativeGuide: { focus: "5.1 把瑟蕾雅的身世線與北境霜火結合，讓她不再只追查母親的選擇，也直面自己的記憶。", hook: "冷核裡保存的不是母親，而是瑟蕾雅自己忘記的告別。", payoff: "她不燒掉痛苦也不把它公開，讓霜火輪值成為能承載記憶與當下的共同火。" },
      scenes: [
        { id: "cold-furnace", title: "先熄掉最亮的爐", body: "霜火鍛環兩座主爐互相爭奪界痕燃料，最亮的火反而讓整座鍛環無法降溫。凱嵐要瑟蕾雅替他決定先救哪一邊，她把手放到冷核上，聽見兒時的自己哭著問艾妲『我會不會忘記妳』。她沒有被記憶拖走，只說先熄掉最亮的爐，讓所有人看見停下會影響誰。" },
        { id: "memory-heat", title: "兩個核心不必互相征服", body: "洛恩把霜核與火核拆成兩條可交班的熱管，瑟蕾雅卻在冷核裡看見那天的完整畫面：是她主動抓住界痕，要求母親把她送回南驛，因為她不想讓門再吞掉村子。這個真相沒有讓分離變得不痛，卻讓她知道自己不是被丟下的包裹。她把記憶封回冷核，只留下能由本人取回的時間標記。" },
        { id: "forge-rotation", title: "輪值比王座更可靠", body: "鍛環居民投票決定每月的霜火輪值，並把過載時的停爐權分給四個班次。有人希望瑟蕾雅保管兩枚核心，說她最懂界痕；她把冷核交回公共架，回答：『我懂得其中一段，不代表我應該擁有全部。』火光照亮她離開的背影，母親的聲音從冷核裡追出一句：『謝謝妳記得自己也做過選擇。』" }
      ]
    },
    "side-5.1-forge-long-night": {
      title: "長夜裡的工具架",
      summary: "霜火鍛環把工具、冷卻記錄與停爐權交給不同班次；瑟蕾雅的冷核也第一次以『可由本人取回』的方式被保留。",
      scenes: [
        { id: "cold-tools", title: "工具要先冷下來", body: "艾斯特把會殘留熱量的工具分成兩架，交班表上必須寫冷卻完成時間。瑟蕾雅問能不能用星痕加快，艾斯特說可以，但那會把責任又集中回她身上。她笑了一下，改用沙漏等完那段時間。" },
        { id: "forge-scratch", title: "刻痕不是恥辱", body: "洛恩把每一次過載刻在公共工具架旁，凱嵐沒有要求磨平。有人看見刻痕後嘲笑上一班太慢，瑟蕾雅便請他先說明自己願意承擔哪一段風險。笑聲停下，工具架保留了所有班次的名字，沒有誰能把錯誤推回一個人。" },
        { id: "night-shift", title: "長夜班的最後一盞燈", body: "長夜班結束時，艾斯特把最後一盞火調到能照見退出路線的亮度。瑟蕾雅把冷核的私人封條交給下一班見證，卻不公開內容。霜火鍛環沒有宣布勝利，只讓每個人知道下一次想靠近時，誰能替自己按停。" }
      ]
    },
    "main-5.2": {
      title: "虹橋以外的回覆",
      summary: "遠望塔找到通往北境外環的彩色界橋，橋的另一端叫出瑟蕾雅未曾公開的原名。她必須確認那是母親的回覆，還是根系在用她最想聽的方式召喚她。",
      narrativeGuide: { focus: "5.2 讓瑟蕾雅在接近母親前先面對自己的名字與身份，不讓重逢只靠情感衝刺。", hook: "虹橋不用她的現在名字，而是用出生記錄裡的原名開門。", payoff: "她要求兩端都能拒絕通行，並把原名交還給自己，不讓根系用它控制她。" },
      scenes: [
        { id: "seven-signal", title: "七色訊號不是邀請函", body: "虹徑展開七道光，遠望塔舊規則立刻標成北境邀請。索萊將訊號拆成提示與請求，塔莉亞則逐一確認每個顏色背後是否真的有人同意。第七色忽然喊出瑟蕾雅出生記錄裡的原名，只有艾妲曾在那張紙上寫過。她沒有回答，只讓塔莉亞把這個名字標成『待確認的私人資料』。" },
        { id: "bridge-ends", title: "橋的兩端都能關閉", body: "曜澤在橋南設下手動燈標，北境居民在橋北保留另一組開關。當一艘船未經確認就要通過，兩端同時熄燈，虹光像被剪斷的布落回雲層。船上的人罵他們浪費機會，瑟蕾雅卻看著黑掉的橋：『能拒絕的路，才有一天能被放心地走。』" },
        { id: "walk-back", title: "走過去，也要走得回來", body: "第二次通行時，橋的中點浮出一間與白鐘工坊相同的舊房間，艾妲站在裡面，卻沒有開門。她只說：『如果妳還用世界的中心來找我，就不要過來。』瑟蕾雅把手放下，讓橋兩端保持開關；她沒有失望，反而把自己的原名寫回掌心，說那是她的名字，不是門的鑰匙。虹橋最後把她送回南端，留下 5.3 命線織庭的座標。" }
      ]
    },
    "side-5.2-bridge-watch": {
      title: "橋上不設王座",
      summary: "信標師與橋北居民輪流確認跨界通路，讓瑟蕾雅的私人回覆不會被誤認成公共邀請。",
      scenes: [
        { id: "bridge-shift", title: "輪班看橋，不是擁有橋", body: "菲芮把橋面風向、兩端回覆與退回燈分成三欄，提醒見習者守望只代表當班負責。瑟蕾雅要求再加第四欄：『私人訊息，不得代替邀請。』有人問她是不是在說自己，她回答是，並把名字從值班欄移到備註。" },
        { id: "color-pause", title: "每種顏色都能暫停", body: "塔莉亞發現其中一道虹光會把等待誤認成同意，替它加上獨立的暫停訊號。橋面變慢，卻沒有任何顏色再被迫代表肯定。瑟蕾雅把這個暫停訊號寄給母親所在的北端，沒有要求回覆，只留下雙方都能關燈的時間。" },
        { id: "return-lantern", title: "把燈帶回原位", body: "完成測試後，索萊把臨時信標交回橋北，而不是帶回遠望塔。下一次通行要重新確認，瑟蕾雅也將原名的紀錄封進私人信封。橋上沒有王座，只有兩端都能說不的燈，這讓她的故事第一次不必依靠被誰看見才能繼續。" }
      ]
    },
    "main-5.3": {
      title: "命線織庭的空白梭",
      summary: "白夜航路的命線在織庭交會，瑟蕾雅看見三種可能的自己：追上母親的女兒、成為世界中心的守門人，以及放下所有線的旅人。最危險的不是未來，而是有人替她選好一條。",
      narrativeGuide: { focus: "5.3 把瑟蕾雅的內在選擇具象化，讓她不再被母親、世界或英雄角色推著走。", hook: "三條命線都能證明自己是『真正的瑟蕾雅』，只有空白梭沒有預言。", payoff: "她不剪掉任何可能，將空白梭交回每條線的主人，保留自己主動選擇的權利。" },
      scenes: [
        { id: "three-threads", title: "三條線都是真的", body: "命線織庭同時保存已發生、正在發生與尚未決定的三種線。梅芙替瑟蕾雅拉出三條最亮的線：一條通往母親，一條通往中央終端，一條通往沒有任何回覆的遠方。每條線都用她的聲音說話，甚至知道她最害怕的事。涅芙提醒她，真的不等於必須選；瑟蕾雅卻問：『如果三條都是真的，我要怎麼知道哪一條是我現在想走的？』" },
        { id: "cut-thread", title: "剪線不等於改命", body: "一條命線纏住公共回覆台，議庭要求直接剪斷。瑟蕾雅看見線的另一端是 1.0 的獸靈之村，剪斷會讓村子忘記一條仍在使用的安全路。她沒有把麻煩的線當成敵人，而是與諾芮亞一起把求助訊號分流。分流完成後，線上浮出母親的字：『妳終於沒有把困難的部分刪掉。』瑟蕾雅沒有追問她是否在織庭，因為這次她先確認訊息會影響誰。" },
        { id: "empty-shuttle", title: "把梭交回說話的人", body: "織庭最後只留下空白梭，沒有人知道它能織出什麼。梅芙說空白很浪費，瑟蕾雅把梭交給每條線的主人，請他們決定是否繼續。她自己沒有拿走任何一條，只在空白梭旁寫下：『我可以選，但不替你選。』北境根系的最後一個座標隨即亮起，指向深海根門；那裡傳來艾妲的聲音，第一次直接叫她現在的名字。" }
      ]
    },
    "side-5.3-weaver-school": {
      title: "織線學徒的三次練習",
      summary: "織庭學徒在瑟蕾雅的陪同下學會分辨記錄、推測與替人決定，讓命線不再只由最會解釋的人掌握。",
      scenes: [
        { id: "first-knot", title: "第一個結先問誰留下", body: "涅芙教學徒打第一個結時，沒有教固定形狀，而是先問這段線由誰保留。學徒指向瑟蕾雅，說她看起來最知道答案；瑟蕾雅把手上的梭放下，回答：『我知道我看見了什麼，不代表我知道它屬於誰。』第一個結因此多了一個收件人欄。" },
        { id: "second-line", title: "第二條線是推測", body: "諾芮亞標出一條觀測者推測出的線，永遠使用不同顏色。梅芙問瑟蕾雅能否用星痕驗證，她說可以，但驗證前要先得到線主人的同意。學徒第一次看見強大的能力也可以選擇不使用，便把推測線旁的空白留了下來。" },
        { id: "empty-shuttle", title: "空白梭留給下一班", body: "學徒完成練習後想把空白梭帶回宿舍，三人請她放回公共架。瑟蕾雅在架旁寫下母親曾經留給她的規則：不要把被看見當成被擁有。下一個人可能織出完全不同的路，空白才真正有用途。" }
      ]
    },
    "main-5.4": {
      title: "深海的回聲守門人",
      summary: "根門在深海再次開啟，這次只有瑟蕾雅能聽懂低鳴。門後的聲音自稱是艾妲，卻要求她獨自進入；她必須判斷，重逢是否值得用夥伴的安全換取。",
      narrativeGuide: { focus: "5.4 把母女重逢推到最近的位置，再用『不能獨自進門』守住瑟蕾雅的主體性。", hook: "深海低鳴不是陷阱的聲音，而是艾妲在另一側拒絕被女兒單獨救出。", payoff: "瑟蕾雅讓四把鑰匙共同叫停，與母親交換一段可公開的回覆，為 5.5 新曙終端做準備。" },
      scenes: [
        { id: "root-gate", title: "根門不是王座", body: "深海根門吸收海溝所有訊號，門紋像長蛇環繞入口。凱爾說門只等瑟蕾雅，瑟蕾雅卻看見四把鑰匙同時亮起，像門正在測試她會不會把所有人留在外面。低鳴用她現在的名字說：『瑟蕾雅，別一個人進來。』她終於確定那不是命令，而是母親的拒絕。" },
        { id: "undersea-voice", title: "低鳴不一定是命令", body: "澪歌聽見海底低鳴，海面的人卻把它解讀成必須立刻下潛。瑟蕾雅要求把聲音分成原句、推測與行動請求，三欄都不能省略。奧薇拉修復潮核，凱爾負責壓力，隊伍只讓瑟蕾雅靠近到她能聽見的距離。門內的艾妲說她已經不能回到原來的彼岸，卻可以把一段真相交給女兒。" },
        { id: "four-keys-return", title: "四把鑰匙一起叫停", body: "根門開啟時，海底浮出瑟蕾雅出生前的記錄：艾妲把自己的名字從根系中央刪除，將女兒送往南驛，因為只有不在中心的人才可能長大。瑟蕾雅想游進去抱她，四班卻同時叫停，遵守她自己寫下的律。她隔著門說『我想見妳，但我不會用所有人的安全換一個擁抱』。艾妲回覆：『這一次，妳聽懂了。』門關上，留下 5.5 的新曙座標與一封不需要立刻回答的信。" }
      ]
    },
    "side-5.4-deep-key": {
      title: "第四把鑰匙的交班",
      summary: "凱爾、澪歌、奧薇拉與瑟蕾雅讓退回權不被最勇敢的人帶走，並把母親的深海回覆保留成可由本人決定的私人信件。",
      scenes: [
        { id: "key-four", title: "最後一把不是最重要", body: "凱爾原本把退回鑰匙放在自己身上，澪歌提醒這會讓所有人把停止責任交給同一個人。瑟蕾雅沒有接過鑰匙，只把輪值表放到兩人中間。第四把最後由每班輪流保管，門也因此不能因為她想見母親就自動開啟。" },
        { id: "pressure-record", title: "把壓力寫進交班表", body: "奧薇拉把海底壓力與每次開門時間並排記錄，發現最危險的時刻不一定最深，而是大家急著證明自己能繼續的時候。瑟蕾雅把母親的回覆寫成『已收到、尚未公開』，不讓任何人用她的情緒催促下一班。" },
        { id: "safe-surface", title: "安全回到水面", body: "深海隊伍沿著退回燈線上浮，沒有帶走根門的答案，只帶回四把鑰匙都能叫停的規則。瑟蕾雅把那封信放在胸前，卻沒有拆開再讀。她知道有些等待不是拖延，而是讓自己回到水面後仍能用完整的人去面對答案。" }
      ]
    },
    "main-5.5": {
      title: "長冬後的九界新曙",
      summary: "長冬結束，九界都等待瑟蕾雅宣布下一個中心。她必須在終端、根門與母親的信之間做最後選擇：成為所有人的答案，或把世界交還給能共同修改它的人。",
      narrativeGuide: { focus: "5.5 收束北境神話篇，也收束瑟蕾雅從『找回母親』到『選擇自己如何活著』的主線。", hook: "新曙終端能讓艾妲回來，但代價是把所有界痕重新綁在瑟蕾雅一個人的聲音上。", payoff: "她拒絕新王座，成為第一位可被交班的見證人，並在結尾真正收到母親的回信。" },
      scenes: [
        { id: "long-winter", title: "長冬不是末日的另一個名字", body: "九界界痕同時降至最低，所有回覆台等待新曙終端宣布下一步。伊萊拉把舊檔案的成功與失敗一起點亮，瑟蕾雅卻在最底層找到一個新選項：以她的聲音重新啟動所有根門，艾妲就能回來。條件寫得很小——世界必須再次承認唯一中心。她把那一行放大給所有人看，沒有私下替母親答應。" },
        { id: "no-new-center", title: "不讓新中心先說話", body: "各界代表要求瑟蕾雅先宣布方向，因為大家已經等得太久。她沒有站上中央台，而是讓九地各自寫出能接受、不能接受與仍需等待的條件。有人罵她把終幕拖成會議，雷恩在台下喊：『她不是拖延，她在確保你們可以反對。』當九份條件重疊成一張可撤回的協議，終端開始崩落；最後仍需要她選擇是否按下啟動。" },
        { id: "new-dawn", title: "把新曙交給下一個人", body: "瑟蕾雅按下的不是啟動鍵，而是交班鍵。根系、命線、霜火、虹徑與深海鑰匙的修改方式同時公開，所有人都能看見也能拒絕。終端問她是否願意成為第一位見證人，她回答願意，但任期只到下一位接班者同意為止。這時母親的信終於在私人信封裡亮起：『妳不用回到我身邊才算回家。若妳仍想來，請先寄信。』瑟蕾雅笑著把信收好，走向新曙港的郵站。世界沒有選出新主人，卻留下了一個真正屬於她自己的明天。" }
      ]
    },
    "side-5.5-dawn-archive": {
      title: "把神話寫回人手",
      summary: "北境居民把代代流傳的神話改寫成普通人能使用的規則；瑟蕾雅則把自己的故事從神話中心拿回一封可以寄出的信。",
      scenes: [
        { id: "old-names", title: "舊名字可以留下", body: "涅芙整理北境居民使用的舊名字，沒有把它們刪成統一格式。瑟蕾雅在自己的原名旁寫下『本人可選何時使用』，並把艾妲的名字留在私人信封，不讓神話替母親公開。每個名字旁都附上它何時保護過人、又何時可能造成誤解。" },
        { id: "public-pen", title: "公共架上的筆", body: "艾斯特把所有版本的修改筆放在公共架上，任何人都能取用，也能把不同意的理由寫在旁邊。有人要求瑟蕾雅替新規則簽名，她把筆轉交給下一位居民：『我可以見證，但不替你們擁有。』神話從守根者手裡回到每個受影響的人手中。" },
        { id: "after-dawn", title: "5.5 之後", body: "新曙的第一頁沒有寫下一個敵人或唯一英雄，只寫每條規則的拒絕、撤回與重新協商時間。瑟蕾雅把母親的回信收進旅人包，沒有立刻拆成公共檔案。她在郵站投出自己的回覆，內容只有：『我會先寄信，再走到門外。』北境神話篇暫告一段落，星界之律仍為下一個選擇保持開放。" }
      ]
    }
  });

  function applyContinuityGuides(chapters) {
    return chapters.map(function (chapter) {
      var guide = storyContinuityGuides[chapter.id] || chapter.narrativeGuide;
      if (!guide && chapter.type === "side") {
        guide = {
          focus: chapter.summary || "補足主線角色的選擇與後果。",
          hook: "支線會補回主線略過的角色視角，並保留瑟蕾雅旅程造成的影響。",
          payoff: "完成本支線後，玩家能看見一條不只由主線英雄推動的回覆。"
        };
      }
      var result = guide ? Object.assign({}, chapter, { narrativeGuide: guide }) : chapter;
      if (result.type === "main" && Number(result.version) >= 1 && Array.isArray(result.characters) && result.characters.indexOf("celesia") < 0) {
        result = Object.assign({}, result, { characters: result.characters.concat("celesia") });
      }
      if (result.type === "side" && Number(result.version) >= 3 && Array.isArray(result.characters) && result.characters.indexOf("celesia") < 0) {
        result = Object.assign({}, result, { characters: result.characters.concat("celesia") });
      }
      return result;
    });
  }

  function applyFutureStoryPolish(chapters) {
    return chapters.map(function (chapter) {
      var patch = futureStoryPolish[chapter.id];
      if (!patch) return chapter;
      return Object.assign({}, chapter, patch, { narrativeGuide: patch.narrativeGuide || chapter.narrativeGuide });
    });
  }

  version3StoryChapters = applyFutureStoryPolish(version3StoryChapters);
  version4StoryChapters = applyFutureStoryPolish(version4StoryChapters);
  version5StoryChapters = applyFutureStoryPolish(version5StoryChapters);

  function mergeImportedStory(chapters) {
    var imported = storySource && storySource.chapters ? storySource.chapters : {};
    var importedIds = Object.keys(imported);
    var merged = chapters.map(function (chapter) {
      var sourceChapter = imported[chapter.id] ? normalizeImportedSource(imported[chapter.id]) : null;
      var livePolish = liveStoryPolish[chapter.id] || null;
      return sourceChapter ? Object.assign({}, chapter, sourceChapter, livePolish || {}, {
        title: documentChapterTitle(sourceChapter.sourceLabel, (livePolish && livePolish.title) || chapter.title),
        sourceDocumentId: storySource.documentId,
        sourceStatus: sourceChapter.sourceStatus || "document"
      }) : Object.assign({}, chapter, livePolish || {});
    });

    // 若未來文件新增章節而程式尚未有摘要，仍讓它能出現在讀取器；
    // 目前 1.0–2.5 的既有 id 都會走上面的 metadata 合併路徑。
    importedIds.forEach(function (id) {
      if (merged.some(function (chapter) { return chapter.id === id; })) return;
      var sourceChapter = normalizeImportedSource(imported[id]);
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
        scenes: sourceChapter.scenes,
        narrativeGuide: storyContinuityGuides[id] || null
      });
    });
    return applyContinuityGuides(merged);
  }

  var sideStoryGroupSpecs = [
    { id: "side-1-0-village", range: "1.0–1.1", title: "第十三把椅子與今天不排練", region: "白鐘城・霧橋鎮", members: ["side-1-0-village", "side-1-1-qwer"] },
    { id: "side-1-2-water", range: "1.2–1.3", title: "獵人歸林與雨停以前", region: "獸靈之村・洛汀港", members: ["side-1-2-water", "side-1-3-harbor"] },
    { id: "side-1-4-bell", range: "1.4–1.5", title: "給昨天的妳與下一次敲門", region: "彼岸鐘庭・公共檔案庫", members: ["side-1-4-bell", "side-1-5-files"] },
    { id: "side-2.0-library", range: "2.0–2.1", title: "藍燈不滅與未寄出的回聲", region: "潮汐書庫・鏡潮島", members: ["side-2.0-library", "side-2.1-mirror"] },
    { id: "side-2.2-deep", range: "2.2–2.3", title: "空船的乘客與風箏不替人回信", region: "深潮測線・雲脊站", members: ["side-2.2-deep", "side-2.3-wind"] },
    { id: "side-2.4-witness", range: "2.4–2.5", title: "見證人的空白", region: "霧鏡議庭・潮眼外圍", members: ["side-2.4-court", "side-2.5-repair", "side-2.4-witness"] },
    { id: "side-3-0-wind", range: "3.0–3.2", title: "藍旗、黑木匣與白榆河", region: "白石驛站・內陸回覆台・白榆河", members: ["side-3-0-wind", "side-3-1-format", "side-3-2-river"] },
    { id: "side-3-3-forge", range: "3.3–3.5", title: "空白握柄與終端的第一頁", region: "鍛路鎮・北門高地・星界終端", members: ["side-3-3-forge", "side-3-4-north", "side-3-5-finale"] },
    { id: "side-4.0-dawn", range: "4.0–4.2", title: "曙港的輪班與遠望塔", region: "新曙港・碎星工坊・遠望塔", members: ["side-4.0-dawn", "side-4.1-forge", "side-4.2-tower"] },
    { id: "side-4.3-memory", range: "4.3–4.5", title: "失效訊息與可撤回的門", region: "白夜航路・海溝入口・協議庭", members: ["side-4.3-memory", "side-4.4-trench", "side-4.5-law"] },
    { id: "side-5.0-root-register", range: "5.0–5.2", title: "根名冊、霜火與虹橋", region: "北境根冠・霜火鍛環・虹橋", members: ["side-5.0-root-register", "side-5.1-forge-long-night", "side-5.2-bridge-watch"] },
    { id: "side-5.3-weaver-school", range: "5.3–5.5", title: "空白梭與長冬後的信", region: "命線織庭・深海根門・北境新曙", members: ["side-5.3-weaver-school", "side-5.4-deep-key", "side-5.5-dawn-archive"] }
  ];

  function combineSideScenes(spec, members, canonical) {
    var hasDocumentBody = canonical && canonical.sourceLabel && canonical.sourceLabel.indexOf(spec.range + "｜支線｜") === 0;
    if (hasDocumentBody) return canonical.scenes;
    var actNames = ["第一幕", "第二幕", "終幕"];
    return [0, 1, 2].map(function (index) {
      var available = members.map(function (member) { return member.scenes[index]; }).filter(Boolean);
      var firstTitle = available[0] && available[0].title ? String(available[0].title).replace(/^(?:序幕|終幕|終節|第[一二三四五六七八九十]+幕|第[一二三四五六七八九十]+節)｜/u, "") : "回聲與選擇";
      var body = available.map(function (scene, sceneIndex) {
        var member = members[sceneIndex];
        return "【" + member.version + "｜" + member.title + "】\n" + scene.body;
      }).join("\n\n");
      return { id: spec.id + "-act-" + (index + 1), title: actNames[index] + "｜" + firstTitle, body: body };
    });
  }

  function groupSideStoryChapters(chapters) {
    var byId = {};
    chapters.forEach(function (chapter) { byId[chapter.id] = chapter; });
    var consumed = {};
    var aliases = {};
    var grouped = [];
    sideStoryGroupSpecs.forEach(function (spec) {
      var members = spec.members.map(function (id) { return byId[id]; }).filter(Boolean);
      var canonical = byId[spec.id] || members[0];
      if (!canonical) return;
      var scenes = combineSideScenes(spec, members, canonical);
      var characters = [];
      members.forEach(function (member) {
        (member.characters || []).forEach(function (characterId) {
          if (characters.indexOf(characterId) < 0) characters.push(characterId);
        });
      });
      var title = documentChapterTitle(canonical.sourceLabel, spec.title);
      var group = Object.assign({}, canonical, {
        id: spec.id,
        type: "side",
        version: spec.range.split("–")[0],
        versionLabel: spec.range,
        title: title,
        region: spec.region,
        summary: canonical.summary || "補足主線之外的角色選擇與地方回聲，故事不改變主線結局。",
        characters: characters,
        scenes: scenes,
        fullBody: canonical.fullBody || scenes.map(function (scene) { return scene.title + "\n" + scene.body; }).join("\n\n"),
        releaseOpen: Number(spec.range.split("–")[0]) <= 2.5,
        legacyIds: spec.members.filter(function (id) { return id !== spec.id; })
      });
      grouped.push(group);
      spec.members.forEach(function (legacyId) {
        consumed[legacyId] = true;
        aliases[legacyId] = spec.id;
        var member = byId[legacyId];
        if (!member) return;
        var memberIndex = spec.members.indexOf(legacyId);
        var sceneOffset = (canonical && canonical.sourceLabel && canonical.sourceLabel.indexOf(spec.range + "｜支線｜") === 0 && memberIndex < 2) ? memberIndex * 3 : 0;
        (member.scenes || []).forEach(function (scene, sceneIndex) {
          var targetScene = group.scenes[sceneOffset + sceneIndex] || group.scenes[Math.min(sceneIndex, group.scenes.length - 1)];
          if (!targetScene) return;
          aliases[legacyId + ":" + scene.id] = spec.id + ":" + targetScene.id;
        });
      });
    });
    chapters.forEach(function (chapter) {
      if (chapter.type === "side") {
        if (consumed[chapter.id]) return;
        return;
      }
      grouped.push(chapter);
    });
    grouped.sort(function (a, b) {
      var av = Number(a.version); var bv = Number(b.version);
      if (av !== bv) return av - bv;
      if (a.type !== b.type) return a.type === "main" ? -1 : 1;
      return String(a.id).localeCompare(String(b.id));
    });
    return { chapters: applyContinuityGuides(grouped), aliases: aliases };
  }

  var rawLiveStoryChapters = mergeImportedStory(storyChapters.concat(version2StoryChapters));
  var rawAllStoryChapters = rawLiveStoryChapters.concat(version3StoryChapters, version4StoryChapters, version5StoryChapters);
  var groupedStory = groupSideStoryChapters(rawAllStoryChapters);
  var allStoryChapters = groupedStory.chapters.map(function (chapter) {
    if (String(chapter.fullBody || "").trim()) return chapter;
    return Object.assign({}, chapter, {
      fullBody: chapter.scenes.map(function (scene) { return scene.title + "\n" + scene.body; }).join("\n\n")
    });
  });
  var liveStoryChapters = allStoryChapters.filter(function (chapter) { return Number(chapter.version) <= 2.5; });
  var storyChapterAliases = groupedStory.aliases;
  var groupedVersion3StoryChapters = allStoryChapters.filter(function (chapter) { return Number(chapter.version) >= 3 && Number(chapter.version) < 4; });
  var groupedVersion4StoryChapters = allStoryChapters.filter(function (chapter) { return Number(chapter.version) >= 4 && Number(chapter.version) < 5; });
  var groupedVersion5StoryChapters = allStoryChapters.filter(function (chapter) { return Number(chapter.version) >= 5; });

  return {
    cards: cards,
    activeCards: activeCards,
    futureCards: futureCards,
    futureCharacterPlan: futureCharacterPlan,
    futureCharacterReleasePlan: futureCharacterReleasePlan,
    version3Cards: version3Cards,
    activeFour: activeFour,
    activeThree: activeThree,
    characterAnimations: characterAnimations,
    banners: banners,
    version2Cards: version2Cards,
    version4Cards: version4Cards,
    version5Cards: version5Cards,
    // 1.0–2.5 是 live 劇情；3.0–5.5 先完整建檔但保持鎖定，供後續版本開放。
    storyChapters: allStoryChapters,
    liveStoryChapters: liveStoryChapters,
    version2StoryChapters: version2StoryChapters,
    version3StoryChapters: groupedVersion3StoryChapters,
    version4StoryChapters: groupedVersion4StoryChapters,
    version5StoryChapters: groupedVersion5StoryChapters,
    storyChapterAliases: storyChapterAliases,
    northernMythArc: northernMythArc,
    storySource: storySource,
    characterBattleStats: characterBattleStats,
    trialStages: trialStages,
    trialVersion: trialVersion,
    trialMaxRewards: trialMaxRewards,
    trialReward: trialReward,
    dispatchVersion: dispatchVersion,
    dispatchMissions: dispatchMissions,
    voyageVersion: voyageVersion,
    voyageConfig: voyageConfig,
    voyageBattleStages: voyageBattleStages,
    petVersion: petVersion,
     petDefinitions: petDefinitions,
     petOutfits: petOutfits,
     petEffects: petEffects,
     petChallenges: petChallenges,
     talentVersion: talentVersion,
     talentRules: talentRules,
     talentDefinitions: talentDefinitions,
    bossVersion: bossVersion,
    bossMaxRewards: bossMaxRewards,
    bossStages: bossStages,
    characterBreakthroughs: characterBreakthroughs,
    tutorialReward: tutorialReward,
    tutorialSteps: tutorialSteps,
    announcements: announcements,
    updateVersion: "2.0-2.5",
    updateReward: Object.freeze({ starSand: 3200 })
  };
}));
