(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StarshipGachaData = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var firstMajorKits = typeof require === "function" ? require("./first-major-kits.js") : globalThis.StarshipFirstMajorKits;
  var coreKits = typeof require === "function" ? require("./core-kits.js") : globalThis.StarshipCoreKits;
  var replacementKits = typeof require === "function" ? require("./replacement-kits.js") : globalThis.StarshipReplacementKits;
  var release = typeof require === "function" ? require("./release-config.js") : globalThis.StarshipReleaseConfig;
  var characterAtlas = typeof require === "function" ? require("./character-atlas.js") : globalThis.StarshipCharacterAtlas;

  // Node 端必須完整載入已納入資料合併的劇情檔；缺檔或語法錯誤應直接讓啟動與測試失敗。
  // 瀏覽器目前只預載公開版所需來源，未預載的未開放擴充稿保持 null。

  // 後續角色可以先在劇情中登場，再於更適合的版本進入卡池。
  // 劇情關係全文保存在 docs/future-character-relationships.md；執行時只需要可抽版本。
  var futureCharacterPlan = {
    jiera: { plannedGachaVersion: "3.0" },
    rotea: { plannedGachaVersion: "3.2" },
    sumine: { plannedGachaVersion: null },
    cenya: { plannedGachaVersion: "3.2" },
    lorne: { plannedGachaVersion: "3.5" },
    norell: { plannedGachaVersion: null },
    aster: { plannedGachaVersion: null },
    aurelia: { plannedGachaVersion: "4.0" },
    kairen: { plannedGachaVersion: "4.2" },
    sorae: { plannedGachaVersion: null },
    talia: { plannedGachaVersion: "4.2" },
    neve: { plannedGachaVersion: null },
    kael: { plannedGachaVersion: null },
    elyra: { plannedGachaVersion: "4.5" },
    vestra: { plannedGachaVersion: "5.0" },
    brann: { plannedGachaVersion: null },
    eirin: { plannedGachaVersion: "5.2" },
    sava: { plannedGachaVersion: null },
    niela: { plannedGachaVersion: "5.3" },
    hervan: { plannedGachaVersion: null },
    daria: { plannedGachaVersion: "5.5" }
  };

  function card(id, name, romanizedName, rarity, element, accent, releaseVersion, note, image, backgroundImage) {
    var futurePlan = futureCharacterPlan[id] || {};
    var adoptedArt = characterAtlas.byId[id];
    if (adoptedArt) { image = adoptedArt.image; backgroundImage = image; }
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
      note: note || "",
      image: image || null,
      backgroundImage: backgroundImage || image || null,
      // portraitImage 是只包住原始立繪的乾淨 SVG；名稱、星級、元素由
      // 遊戲與文件在圖片上方排版，避免舊式名片卡遮住角色，也讓兩端共用同一來源。
      portraitImage: adoptedArt ? image : image ? (String(image).toLowerCase().endsWith(".svg") ? image : "./assets/cards/complete/" + id + ".svg") : null
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
    cenwu: card("cenwu", "岑霧", "Cenwu", 3, "燕", "#a4b9d6", "1.1", "1.1｜山腰驛站站長；路標複核與控場", "./assets/cards/cenwu.png"),
    ruida: card("ruida", "芮妲", "Ruida", 3, "烈", "#c29bc5", "1.1", "1.1｜迴音谷車夫；護送換位與承傷", "./assets/cards/ruida.png"),
    yuan: card("yuan", "榆安", "Yuan", 3, "淨", "#8fc7b6", "1.1", "1.1｜隨車藥師；分次配藥與救急", "./assets/cards/yuan.png"),
    rovienne: card("rovienne", "羅薇恩", "Rovienne", 4, "星", "#a3b19f", "1.6", "1.2 登場｜定界局首席工程師；1.6 首發規劃待作者審閱", "./assets/cards/rovienne.png"),
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
    cards.hina, cards.siyeon, cards.cenwu, cards.ruida, cards.yuan, cards.mave, cards.rovienne
  ];
  // 劇情人物依「角色圖鑑｜單人完整立繪」分頁的圖像順序建檔；不進入卡池。
  var storyCharacters = Object.freeze({
    lifan: { name: "黎帆", romanizedName: "Lifan", portrait: characterAtlas.byId.lifan.image },
    weina: { name: "葦娜", romanizedName: "Weina", portrait: characterAtlas.byId.weina.image },
    sevin: { name: "塞維恩", romanizedName: "Sevin", portrait: "./assets/story-characters/sevin.png" },
    seifra: { name: "賽芙拉", romanizedName: "Seifra", portrait: characterAtlas.byId.seifra.image },
    noyas: { name: "諾亞斯", romanizedName: "Noyas", portrait: characterAtlas.byId.noyas.image },
    kailin: { name: "凱琳", romanizedName: "Kailin", portrait: characterAtlas.byId.kailin.image },
    oun: { name: "奧恩", romanizedName: "Oun", portrait: characterAtlas.byId.oun.image },
    mila: { name: "米菈", romanizedName: "Mila", portrait: characterAtlas.byId.mila.image },
    vark: { name: "老瓦克", romanizedName: "Vark", portrait: characterAtlas.byId.vark.image },
    cenwu: { name: "岑霧", romanizedName: "Cenwu", portrait: characterAtlas.byId.cenwu.image, firstAppearance: "1.1", role: "山腰驛站站長" },
    ruida: { name: "芮妲", romanizedName: "Ruida", portrait: characterAtlas.byId.ruida.image, firstAppearance: "1.1", role: "迴音谷車夫" },
    yuan: { name: "榆安", romanizedName: "Yuan", portrait: characterAtlas.byId.yuan.image, firstAppearance: "1.1", role: "隨車藥師" },
    musa: { name: "穆莎", romanizedName: "Musa", portrait: characterAtlas.byId.musa.image, firstAppearance: "1.2", role: "橋北林聚落採集者", artStatus: "03M自然站姿採用圖20261103" },
    kerida: { name: "珂芮妲", romanizedName: "Kerida", portrait: characterAtlas.byId.kerida.image, firstAppearance: "1.2", role: "半退休資深外勤測量師", artStatus: "03M自然站姿採用圖20261103" },
    dori: { name: "朵梨", romanizedName: "Dori", portrait: characterAtlas.byId.dori.image, firstAppearance: "1.3", role: "洛汀港補給船工", artStatus: "03M自然站姿採用圖20261103" },
    wenlan: { name: "溫藍", romanizedName: "Wenlan", portrait: characterAtlas.byId.wenlan.image, firstAppearance: "1.4", role: "鐘庭物資管事", artStatus: "03M自然站姿採用圖20261103" }
  });
  var characterAssets = Object.freeze(Object.fromEntries(Object.values(cards).map(function (entry) {
    var currentRelease = Number(entry.releaseVersion) <= 2.5;
    var documentCardName = entry.id === "isar" ? "Isar_原稿_星律卡面.png" : entry.id === "rena" ? "Rena_原稿_星律卡面.png" : entry.romanizedName + "_星律卡面.png";
    return [entry.id, Object.freeze({ portrait: entry.image, documentCardName: currentRelease ? documentCardName : null,
      documentTab: currentRelease ? (Number(entry.releaseVersion) < 2 ? "第一大版本角色圖建" : "角色圖鑑｜第二大版本") : null })];
  })));
  var isarAscended = Object.freeze({ id: "isar-ascended", baseCharacterId: "isar", name: "伊薩爾｜四星升格", rarity: 4, element: "烈", portrait: "./assets/story-characters/isar-ascended.png", playable: false });
  var version2Cards = [cards.risan, cards.yaoze, cards.maro, cards.evelyn, cards.mirea, cards.ferye, cards.noreia, cards.orivelle];
  var authorPreviewCards = Object.values(cards).filter(function (entry) { return Number(entry.releaseVersion) <= 2.5; });
  var version4Cards = [cards.aurelia, cards.kairen, cards.sorae, cards.talia, cards.neve, cards.kael, cards.elyra];
  var version5Cards = [cards.vestra, cards.brann, cards.eirin, cards.sava, cards.niela, cards.hervan, cards.daria];

  // 正式版首期只開放 1.0；舊帳號已取得的角色仍由存檔保留。
  var releasedVersion = release.version;
  var storyVersionReward = Object.freeze({ version: "1.0", starSand: 1600, characterExp: 3600, starMarks: 1 });
  var activeCards = Object.values(cards).filter(function (entry) { return Number(entry.releaseVersion) <= Number(releasedVersion); });
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
      storyOnlyIds: ["sumine", "norell", "aster"]
    }),
    Object.freeze({
      majorVersion: "4.0–4.5",
      fourStarIds: ["aurelia", "kairen", "elyra"],
      threeStarIds: ["talia"],
      storyOnlyIds: ["sorae", "neve", "kael"]
    }),
    Object.freeze({
      majorVersion: "5.0–5.5",
      fourStarIds: ["vestra", "eirin", "daria"],
      threeStarIds: ["niela"],
      storyOnlyIds: ["brann", "sava", "hervan"]
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
    yaoze: { rarity: 4, role: "重裝", maxHp: 1280, attack: 150, defense: 145, speed: 76, range: 2, attackName: "燈塔訊號", skillName: "白帆守望", skillPower: 1.12, skillEffect: "〔2.0 暫定戰鬥草案〕為最多 4 名隊友各提供曜澤最大生命 10% 的護盾（單人護盾總量上限為自身最大生命 28%）；所有敵人速度降低 10%，持續 2 輪；自身下一次受擊減少 40%。", signature: { type: "guard", shield: .1, guard: .4, slow: .9, targets: 4, escort: false, duration: 2, cooldown: 3 }, constellations: ["C1 護盾量再乘 1.08，敵方減速期限由 2 輪延為 3 輪。", "C2 施放時對首名敵人造成曜澤攻擊力 55% 的傷害。", "C3 護盾量再乘 1.08，與 C1 合計為曜澤最大生命 11.664%；仍受單人護盾 28% 上限限制。", "C4 施放後全隊受傷減少 6%，持續 1 輪。", "C5 敵方速度倍率由 0.9 降至 0.855（減速 14.5%）；C2 傷害由攻擊力 55% 提至 80%。", "C6 施放時若受盾者生命低於 35%，額外獲得曜澤最大生命 6% 的護盾；仍受單人護盾 28% 上限限制。"] },
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

  Object.keys(firstMajorKits).forEach(function (id) {
    characterBattleStats[id] = Object.assign({}, firstMajorKits[id], { element: cards[id].element, growthModel: "first-major" });
  });
  Object.keys(coreKits).forEach(function (id) {
    characterBattleStats[id] = Object.assign({}, coreKits[id], { element: cards[id].element, growthModel: "first-major" });
  });
  Object.keys(replacementKits).forEach(function (id) {
    // The 2.x/3.x entries are design metadata until their own release gate.
    // Only the already released first-major roster changes on this patch.
    if (Number(cards[id].releaseVersion) >= 2) return;
    var kit = replacementKits[id];
    var stats = characterBattleStats[id];
    characterBattleStats[id] = Object.assign({}, stats, kit, {
      element: cards[id].element,
      role: id === "lorne" ? "治療" : id === "reyn" ? "輔助" : id === "chodan" ? "守衛" : id === "rovienne" ? "爆發" : id === "mave" ? "爆發" : stats.role,
      maxHp: id === "rovienne" ? 1220 : stats.maxHp,
      attack: id === "rovienne" ? 230 : id === "mave" ? 205 : stats.attack,
      defense: id === "rovienne" ? 145 : stats.defense,
      signature: { type: "replacement", cooldown: id === "hina" || id === "rena" ? 2 : 3 }
    });
  });

  // 四星滿等回到可感知的約 3000 戰力成長帶；三星維持較低上限，伊薩爾例外。
  // 所有版本沿用同一等級曲線，避免晚推出的角色只靠版本數值壓過舊角色。
  Object.keys(characterBattleStats).forEach(function (id) {
    var stats = characterBattleStats[id];
    if (stats.growthModel === "first-major") {
      stats.growthBand = "first-major";
      stats.growthRates = stats.rarity === 4
        ? { main: 0.04, defense: 0.04, speed: 0.004 }
        : id === "isar" ? { main: 0.035, defense: 0.035, speed: 0.004 }
          : { main: 0.026, defense: 0.026, speed: 0.003 };
      return;
    }
    var basePower = Math.round(stats.maxHp / 10 + stats.attack + stats.defense);
    var lower = stats.rarity === 4 ? 430 : 370;
    var upper = stats.rarity === 4 ? 490 : 430;
    var scale = Math.min(upper, Math.max(lower, basePower)) / basePower;
    stats.maxHp = Math.round(stats.maxHp * scale);
    stats.attack = Math.round(stats.attack * scale);
    stats.defense = Math.round(stats.defense * scale);
    stats.growthBand = "normalized";
    stats.growthRates = stats.rarity === 4
      ? { main: 0.04, defense: 0.04, speed: 0.004 }
      : { main: 0.026, defense: 0.026, speed: 0.003 };
  });

  var updateCycle = release.cycle;
  var trialVersion = release.trialCycle || release.challengeCycle || updateCycle;
  var trialMaxRewards = 2;
  // 試煉每次成功都提供角色經驗；本版本的 1–15 關每關最多挑戰三次。
  var trialReward = Object.freeze({ starSand: 75, characterExp: 1800 });
  // 星界試煉維持 1–15 關，使用遊戲內怪物圖鑑的既有物種立繪。
  var trialStages = null;
  if (typeof require === "function") {
    try { trialStages = require("./trial-1-0.js"); } catch (error) { trialStages = null; }
  }
  if (!trialStages && typeof globalThis !== "undefined") trialStages = globalThis.StarshipTrial10 || null;
  if (!trialStages) throw new Error("找不到 1.0 試煉圖鑑資料");
  var trial12Stages = typeof require === "function" ? require("./trial-1-2.js") : (typeof globalThis !== "undefined" ? globalThis.StarshipTrial12 : null);
  if (trial12Stages && trial12Stages.length >= 15) trialStages = trial12Stages.slice(0, 15);
  trialStages = trialStages.filter(function (stage) { return stage.id >= 1 && stage.id <= 15; });
  trialStages.forEach(function (stage) { stage.maxChallengeAttempts = 2; });

  // 星海迷航是休閒探索玩法，不應直接借用第 18／30 關的高難度試煉終幕。
  // 這三個專用戰鬥只保留敵人特性與閱讀回饋，推薦戰力和傷害控制在一般玩家能
  // 用 1.0–2.5 已取得角色穩定嘗試的範圍；高難度挑戰仍留在 trialStages。
  var voyageBattleStages = [
    { id: "voyage-combat-1", name: "碎光狹道", region: "星海迷航", recommendedPower: 1200, environment: "碎光航道", environmentEffect: "速度較快的角色容易先手，適合熟悉自走棋戰鬥", modifiers: { teamSpeed: 1.04, enemyAttack: 0.9, enemyDefense: 0.94 }, enemyTrait: "碎光擾動", enemyTraitEffect: "敵人數量較多但單體傷害較低，先處理高速單位即可", trialRule: "echo", enemies: [{ name: "碎光漂獸", maxHp: 1050, attack: 112, defense: 72, speed: 84, count: 2 }, { name: "碎光航標核", maxHp: 1500, attack: 118, defense: 90, speed: 58, count: 1 }], reward: {} },
    { id: "voyage-combat-2", name: "折光風暴", region: "星海迷航", recommendedPower: 2100, environment: "折光風暴帶", environmentEffect: "敵方會重整護盾；首次施放技能時可複寫我方增益", modifiers: { teamAttack: 1.03, enemyAttack: 0.9, enemyDefense: 0.94 }, enemyTrait: "折光回聲", enemyTraitEffect: "每名敵人開場持有最大生命 14% 的護盾，耗盡後最多重整兩次；若我方有攻擊、防禦或速度增益，敵方各複寫最強的一項，最多增加 20%，持續 2 輪", trialRule: "copy", enemies: [{ name: "折光拾荒獸", maxHp: 2850, attack: 188, defense: 132, speed: 105, count: 2 }, { name: "折光風暴核", maxHp: 4600, attack: 222, defense: 168, speed: 74, count: 1 }], reward: {} },
    { id: "voyage-final", name: "星海終端守門者", region: "未命名終端", recommendedPower: 2600, recommendedPowerNote: "星海迷航終幕建議以約 2,600 面板戰力的完整隊伍挑戰；低於此值仍可透過治療、護盾與協同通關。", environment: "星海終端", environmentEffect: "敵方會重整護盾，但不使用星界試煉終局的高傷害規則", modifiers: { teamAttack: 1.05, teamDefense: 1.03, enemyAttack: 0.86, enemyDefense: 0.92 }, enemyTrait: "終端守門", enemyTraitEffect: "每名敵人開場持有最大生命 14% 的護盾，耗盡後最多重整兩次；先擊破護航體可減少敵方行動次數", trialRule: "shield", finalStage: true, enemies: [{ name: "星海護航體", maxHp: 4200, attack: 250, defense: 178, speed: 118, count: 2 }, { name: "星海終端守門者", maxHp: 7200, attack: 302, defense: 228, speed: 82, count: 1 }], reward: {} }
  ];

  // 80 等突破專用 Boss。不同角色會對應不同素材來源；每個 Boss 每版本最多領取 10 次，
  // 六種素材來源分成 Lv.1–3 三個獎勵檔位，讓玩家可以透過戰鬥穩定準備突破材料，
  // 同時保留隊伍搭配與重複挑戰的空間。每個檔位安排兩個 Boss，避免刪除既有角色的素材來源。
  var bossVersion = release.challengeCycle || updateCycle;
  var bossMaxRewards = 10;
  var bossStages = [
    { id: "boss-star-warden", name: "星序守望者", region: "星序觀測環", description: "守望者以錯位星序建立護盾，指揮與減防角色能更快找到破口。", recommendedPower: 1500, environment: "錯位星序", environmentEffect: "敵方護盾耗盡後可重整，持續輸出與破防較有價值", enemyTrait: "星序護盾", enemyTraitEffect: "每名敵人開場持有最大生命 14% 的護盾，耗盡後最多重整兩次", trialRule: "shield", modifiers: { enemyDefense: 1.06, teamAttack: 1.03 }, enemies: [{ name: "星序守衛", maxHp: 2700, attack: 190, defense: 145, speed: 82, count: 2 }, { name: "星序守望者", maxHp: 5200, attack: 260, defense: 215, speed: 96, count: 1 }], reward: { materialId: "star-crest", materialName: "星序碎晶", amount: 1, characterExp: 360 } },
    { id: "boss-tide-archive", name: "潮眼書庫獸", region: "潮汐書庫深層", description: "潮眼把索引頁藏進寄生體的外殼，治療、修復與淨化能降低長線壓力。", recommendedPower: 1700, environment: "深潮索引", environmentEffect: "受到潮蝕的角色治療量降低，修復技能可清除部分效果", enemyTrait: "潮蝕寄生", enemyTraitEffect: "敵人命中後會降低受治療量", trialRule: "corrosion", modifiers: { healing: 0.84, enemyAttack: 1.05 }, enemies: [{ name: "潮眼寄生體", maxHp: 3300, attack: 220, defense: 160, speed: 112, count: 2 }, { name: "書庫潮核", maxHp: 6100, attack: 285, defense: 235, speed: 70, count: 1 }], reward: { materialId: "tide-crystal", materialName: "潮眼晶核", amount: 1, characterExp: 360 } },
    { id: "boss-clock-sentinel", name: "逆時守鐘人", region: "彼岸鐘庭內庭", description: "敵方技能間隔較短；安排速度與防守輪轉以承接攻勢。", recommendedPower: 1900, environment: "逆時鐘面", environmentEffect: "敵方速度提高 10%，我方速度提高 5%", enemyTrait: "逆時敲鐘", enemyTraitEffect: "所有敵人技能冷卻由 3 輪縮短為 2 輪", trialRule: "time", modifiers: { enemySpeed: 1.1, teamSpeed: 1.05 }, enemies: [{ name: "逆時鐘影", maxHp: 3600, attack: 245, defense: 175, speed: 128, count: 2 }, { name: "守鐘人", maxHp: 6800, attack: 300, defense: 250, speed: 78, count: 1 }], reward: { materialId: "clock-core", materialName: "逆時鐘核", amount: 1, characterExp: 360 } },
    { id: "boss-forge-colossus", name: "鍛路熔殼王", region: "鍛路鎮熱管區", description: "敵方技能造成較高傷害，防守與持續破防能穩定承接攻勢。", recommendedPower: 2150, environment: "熱管過載", environmentEffect: "我方攻擊提高 6%，敵方攻擊提高 10%、防禦提高 8%", enemyTrait: "熔殼過載", enemyTraitEffect: "所有敵人施放技能時，技能基礎倍率由 120% 提至 142%", trialRule: "overload", modifiers: { teamAttack: 1.06, enemyAttack: 1.1, enemyDefense: 1.08 }, enemies: [{ name: "熱管鎧獸", maxHp: 4300, attack: 290, defense: 230, speed: 76, count: 2 }, { name: "鍛路熔殼王", maxHp: 7600, attack: 360, defense: 295, speed: 68, count: 1 }], reward: { materialId: "forge-core", materialName: "熱管熔核", amount: 1, characterExp: 360 } },
    { id: "boss-wind-hunt", name: "風廊獵王", region: "北門風廊", description: "獵王會鎖定最脆弱的隊員，高速斥候與射手可以先處理獵影，替隊伍爭取回合。", recommendedPower: 2350, environment: "高空風廊", environmentEffect: "敵我速度波動變大，標記與先手控制更重要", enemyTrait: "獵王標記", enemyTraitEffect: "敵方集中攻擊生命比例最低的角色", trialRule: "mark", modifiers: { enemySpeed: 1.14, teamSpeed: 1.08, enemyAttack: 1.06 }, enemies: [{ name: "風廊獵影", maxHp: 4500, attack: 315, defense: 210, speed: 150, count: 2 }, { name: "風廊獵王", maxHp: 8200, attack: 340, defense: 270, speed: 104, count: 1 }], reward: { materialId: "wind-core", materialName: "風標獵核", amount: 1, characterExp: 360 } },
    { id: "boss-mirror-arbiter", name: "霧鏡裁定核", region: "霧鏡議庭", description: "裁定核與執行獸能複寫我方增益並重整護盾，安排增益與輸出時機。", recommendedPower: 2600, environment: "霧鏡審理場", environmentEffect: "敵方開場持有護盾，護盾耗盡後仍可重整", enemyTrait: "鏡像裁定", enemyTraitEffect: "每名敵人開場持有最大生命 14% 的護盾，耗盡後最多重整兩次；若我方有攻擊、防禦或速度增益，敵方各複寫最強的一項，最多增加 20%，持續 2 輪", trialRule: "copy", modifiers: { enemyAttack: 1.08, enemyDefense: 1.12, teamAttack: 1.04 }, enemies: [{ name: "霧鏡執行獸", maxHp: 5100, attack: 330, defense: 255, speed: 118, count: 2 }, { name: "霧鏡裁定核", maxHp: 9200, attack: 375, defense: 330, speed: 86, count: 1 }], reward: { materialId: "mirror-core", materialName: "霧鏡映核", amount: 1, characterExp: 360 } }
  ];

  // Boss 等級現在只代表 Lv.1–3 獎勵檔位，而不是角色能不能突破的硬門檻。
  // 每個 Boss 都會給對應專屬材料，並額外給通用突破印記，讓玩家即使先挑戰較容易的 Boss，
  // 也不會因為角色被分配到高等 Boss 而卡住 80 等突破。
  bossStages.forEach(function (stage, index) {
    var level = Math.min(3, Math.floor(index / 2) + 1);
    stage.bossLevel = level;
    stage.difficultyLabel = "Boss Lv." + level;
    stage.recommendedPower = 4500 + level * 1000;
    stage.enemies.forEach(function (enemy) {
      enemy.maxHp = Math.round(enemy.maxHp * 2);
      enemy.attack = Math.round(enemy.attack * 1.4);
    });
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
    "boss-tide-archive": ["lia", "yuan", "rena", "elorna", "risan", "mirea", "maro", "orivelle", "sumine", "cenya", "talia"],
    "boss-clock-sentinel": ["reyn", "chodan", "siyeon"],
    "boss-forge-colossus": ["isar", "ruida", "harlow", "magenta", "yaoze", "lorne", "kairen", "aster", "kael"],
    "boss-wind-hunt": ["hina", "cenwu", "ferye", "norell", "sorae"],
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

  var dispatchVersion = release.challengeCycle || updateCycle;
  var dispatchMissions = [
    { id: "dispatch-library", name: "潮汐書庫抄錄", region: "潮汐書庫", description: "把失散的索引頁送回書庫外環，適合均衡隊伍。", recommendedPower: 1350, environment: "書頁風", environmentEffect: "我方速度提高 8%，更容易先於敵人行動", modifiers: { teamSpeed: 1.08 }, enemyTrait: "索引散落", enemyTraitEffect: "敵人生命偏低但數量較多", trialRule: "echo", enemies: [{ name: "索引書獸", maxHp: 1600, attack: 160, defense: 105, speed: 96, count: 2 }, { name: "散頁核", maxHp: 2100, attack: 145, defense: 130, speed: 62, count: 1 }], reward: { starSand: 180, characterExp: 1680 } },
    { id: "dispatch-lighthouse", name: "白帆岬補燈", region: "白帆岬", description: "替燈塔補上夜間回覆信標，重裝或支援角色能穩定完成。", recommendedPower: 1900, environment: "白帆夜潮", environmentEffect: "隊伍防禦提高 8%，治療量降低 10%", modifiers: { teamDefense: 1.08, healing: 0.9 }, enemyTrait: "潮夜巡獵", enemyTraitEffect: "敵方會優先攻擊生命比例最低的角色，能越過前排", trialRule: "mark", enemies: [{ name: "夜潮獵影", maxHp: 2300, attack: 205, defense: 142, speed: 125, count: 2 }, { name: "白帆燈核", maxHp: 2900, attack: 185, defense: 168, speed: 70, count: 1 }], reward: { starSand: 380, characterExp: 1500 } },
    { id: "dispatch-mirror", name: "鏡潮回收", region: "鏡潮島", description: "回收被折光分裂的回覆片段，持續輸出與破防可協助拆解護盾。", recommendedPower: 2550, environment: "鏡潮折光", environmentEffect: "敵方開場持有護盾，耗盡後仍可重整", modifiers: { enemyAttack: 1.08, enemyDefense: 1.06, teamAttack: 1.04 }, enemyTrait: "折光護盾", enemyTraitEffect: "每名敵人開場持有最大生命 14% 的護盾，耗盡後最多重整兩次", trialRule: "shield", enemies: [{ name: "折光拾荒獸", maxHp: 3000, attack: 245, defense: 180, speed: 105, count: 2 }, { name: "鏡潮主核", maxHp: 3900, attack: 220, defense: 208, speed: 74, count: 1 }], reward: { starSand: 260, characterExp: 1800, starMarks: 1 } }
  ];

  // 星海迷航：獨立於主線的短局隨機航程。每期抽取一條航線，
  // 玩家在事件、商店、休整和戰鬥之間做選擇，最後依探索條件進入不同結局。
  var voyageVersion = release.challengeCycle || updateCycle;
  var maveSummerSkin = { id: "skin-mave-summer-beach-party", characterId: "mave", characterName: "梅芙", rarity: 4, name: "梅芙｜夏日海灘派對", themeLabel: "SUMMER BEACH PARTY", previewTitle: "夏日海灘派對", description: "採用正式新版的金色眼睛與黑紫長髮，搭配夏日服裝和完整海灘立繪；只改變外觀，不改變戰鬥數值。", source: "大廳商店購買；舊版已取得者保留", previewImage: "./assets/cards/skins/mave-summer-beach-party.png", accent: "#f2a8d6" };
  var harlowSummerSkin = { id: "skin-harlow-summer-beach-party", characterId: "harlow", characterName: "赫洛", rarity: 4, name: "赫洛｜夏日海灘派對", themeLabel: "SUMMER BEACH PARTY", previewTitle: "夏日海灘派對", description: "保留赫洛的臉部特徵與金色眼睛，改變服裝、動作、姿勢與完整展示立繪，不改變戰鬥數值。", source: "大廳商店購買；角色開放後可選為上場造型", previewImage: "./assets/cards/skins/harlow-summer-beach-party.png", accent: "#f5c36d" };
  var newSeasonSkins = [
    { id: "skin-celesia-fluffy-white-cat", characterId: "celesia", characterName: "瑟蕾雅", name: "瑟蕾雅｜綿綿白貓", themeLabel: "FLUFFY WHITE CAT", previewTitle: "綿綿白貓", previewImage: characterAtlas.byId["skin-celesia-fluffy-white-cat"].image, accent: "#d9c6ef" },
    { id: "skin-chodan-qwer", characterId: "chodan", characterName: "Chodan", name: "Chodan｜QWER", themeLabel: "QWER", previewTitle: "QWER", previewImage: characterAtlas.byId["skin-chodan-qwer"].image, accent: "#d4b7f7" },
    { id: "skin-magenta-qwer", characterId: "magenta", characterName: "Magenta", name: "Magenta｜QWER", themeLabel: "QWER", previewTitle: "QWER", previewImage: characterAtlas.byId["skin-magenta-qwer"].image, accent: "#efb8d9" },
    { id: "skin-hina-qwer", characterId: "hina", characterName: "Hina", name: "Hina｜QWER", themeLabel: "QWER", previewTitle: "QWER", previewImage: characterAtlas.byId["skin-hina-qwer"].image, accent: "#a5d6ee" },
    { id: "skin-siyeon-qwer", characterId: "siyeon", characterName: "Siyeon", name: "Siyeon｜QWER", themeLabel: "QWER", previewTitle: "QWER", previewImage: characterAtlas.byId["skin-siyeon-qwer"].image, accent: "#e4b6c8" }
  ].map(function (skin) { return Object.assign({ rarity: 4, description: "第一大版本角色圖鑑正式造型；只改變外觀，不改變戰鬥數值。", source: "大廳商店購買；取得角色後可選為上場造型" }, skin); });
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
      special: { starSand: 520, characterExp: 1000, starMarks: 1 }
    },
    // seasonSkin 保留舊版資料相容性；seasonSkins 只供角色培養頁預覽，取得改由大廳商店處理。
    seasonSkin: maveSummerSkin,
    seasonSkins: [maveSummerSkin, harlowSummerSkin].concat(newSeasonSkins)
  };

  // 大廳商店使用帳號資源；迷航商站仍只使用當次航程的星海碎片。
  var shopCatalog = {
    version: updateCycle,
    materials: Object.keys(breakthroughMaterialTemplates).map(function (bossId) {
      var material = breakthroughMaterialTemplates[bossId];
      return { id: material.materialId, name: material.materialName, sandCost: 480, expCost: 12000, limit: 6 };
    }).concat([{ id: universalBreakthroughMaterial.materialId, name: universalBreakthroughMaterial.materialName, sandCost: 640, expCost: 16000, limit: 6 }]),
    skins: [
      { id: maveSummerSkin.id, name: maveSummerSkin.name, characterId: maveSummerSkin.characterId, image: maveSummerSkin.previewImage, sandCost: 2400, forSale: false },
      { id: harlowSummerSkin.id, name: harlowSummerSkin.name, characterId: harlowSummerSkin.characterId, image: harlowSummerSkin.previewImage, sandCost: 2400, forSale: false }
    ].concat(newSeasonSkins.map(function (skin) { return { id: skin.id, name: skin.name, characterId: skin.characterId, image: skin.previewImage, sandCost: 2400 }; })),
    conversions: [
      { id: "sand-to-exp", costKey: "starSand", cost: 160, rewardKey: "characterExp", reward: 3000, limit: null },
      { id: "exp-to-sand", costKey: "characterExp", cost: 6000, rewardKey: "starSand", reward: 80, limit: 20 }
    ]
  };

  // 星伴培育完全使用獨立資源，不會消耗角色經驗、星砂或命座素材。
  var petVersion = updateCycle;
  var petDefinitions = [
    { id: "star-fox", name: "星絨狐", temperament: "好奇", icon: "✦", accent: "#c49bff", image: "./assets/pets/star-fox.png", maxLevel: 25, description: "會把沒有寄出的回覆藏在尾巴裡，喜歡追逐微小星屑。" },
    { id: "tide-otter", name: "潮泡獸", temperament: "親人", icon: "◌", accent: "#71d8dc", image: "./assets/pets/tide-otter-v2.png", maxLevel: 25, description: "在潮汐邊收集泡沫，靠近玩家時會發出細小的水聲。" },
    { id: "wind-bird", name: "風鈴雀", temperament: "敏捷", icon: "◇", accent: "#86b8ff", image: "./assets/pets/wind-bird.png", maxLevel: 25, description: "會把風向變成旋律，喜歡停在航路標記的最高處。" },
    { id: "mirror-sprout", name: "霧鏡芽", temperament: "安靜", icon: "◈", accent: "#b897e8", image: "./assets/pets/mirror-sprout.png", maxLevel: 25, description: "在霧鏡裡映出不同表情，偶爾會替玩家找到遺失的小物。" },
    { id: "aurora-fawn", name: "極光幼鹿", temperament: "溫柔", icon: "♢", accent: "#8ee6c7", image: "./assets/pets/aurora-fawn.png", maxLevel: 25, description: "鹿角會收集夜空的微光，靠近時會讓工坊的星塵變得柔和。" },
    { id: "rune-drake", name: "符文幼龍", temperament: "頑皮", icon: "✧", accent: "#ff9a94", image: "./assets/pets/rune-drake.png", maxLevel: 25, description: "喜歡把古老符文當作玩具，偶爾會用一聲噴嚏點亮整面牆。" },
    { id: "cloud-whale", name: "雲潮鯨", temperament: "悠閒", icon: "≈", accent: "#79c9ff", image: "./assets/pets/cloud-whale.png", maxLevel: 25, description: "在雲海裡慢慢游動，會把玩家的好心情變成一圈圈潮光。" }
  ];
  petDefinitions=petDefinitions.concat((typeof require==='function'?require('./pet-system.js'):globalThis.StarshipPetSystem).fourStarDefinitions);
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
    Object.freeze({ id: "story", icon: "◈", title: "閱讀劇情並取得養成資源", copy: "目前開放 1.0 主線。完成正式章節可領取一次故事獎勵；1.1 之後的章節仍在製作，尚未對一般玩家開放。" }),
    Object.freeze({ id: "gacha", icon: "✧", title: "了解回覆召集", copy: "限定 4★ 可先選目標；每抽皆可出4★，機率隨未出四星次數指數提高，第70抽保底。歪到其他 4★ 會有星砂補償。" }),
    Object.freeze({ id: "growth", icon: "⬡", title: "培養與戰力", copy: "角色培養會提升生命、攻擊、防禦、速度與戰力；重複角色會增加命座並留下該角色專用晶核。三星滿命滿等約接近一般四星 55 等，四星滿命也會提升技能倍率與面板。" }),
    Object.freeze({ id: "trial", icon: "✹", title: "星界試煉與隊伍協同", copy: "最多派出 4 名角色。每關會顯示推薦戰力、敵人數值與特性；總戰力只是參考，治療、護盾、減防、速度和技能搭配都會影響勝負。" }),
    Object.freeze({ id: "dispatch", icon: "⌁", title: "用額外玩法取得養成資源", copy: "星港委託是每版本一次的短篇戰鬥任務，能取得星砂、角色經驗或星痕；版本更新後任務進度會重置，角色不會消失。" }),
    Object.freeze({ id: "boss", icon: "♢", title: "80 等突破與 Boss", copy: "角色升到 80 等後不能直接繼續升級；請在 Boss 選單挑戰 Lv.1–3 三檔首領，收集專屬材料或星界通用突破印記，再完成80等突破。原星階最高90等；三星升四星、原生四星升五星後可升95等，五星升六星後可升100等。" }),
    Object.freeze({ id: "voyage", icon: "✹", title: "星海迷航與特殊結局", copy: "這是獨立於主線的短局航程。選擇事件、商店與休整方式，找出一般、隱藏和協鳴特殊結局；本期特殊四星裝扮藏在特殊結局獎勵裡。" }),
    Object.freeze({ id: "pet", icon: "◌", title: "星伴培育與玩家展示", copy: "寵物有獨立的飼料、玩具和星伴代幣，可餵食、玩耍、訓練、探索、換裝與特效。你可以選擇私人收藏或公開給其他玩家評分，評分只給小額寵物獎勵。" })
  ]);
  var announcements=Object.freeze([{id:"equipment-dungeon-20261102",badge:"1.1.2更新",date:"2026-11-02",title:"獨立裝備秘境與召集機率修正",copy:"裝備改由獨立秘境取得；Boss保留突破材料與經驗。技能升級已列入後續老角色補強規劃，現在不開放。",reward:"每日台北00:00體力補滿100，成功挑戰10點掉落5–8件裝備。1.1.1更新／回歸補償不重發。",highlights:["手機橫向版與雙方前後排自動戰鬥，支援暫停及重播","角色與星伴非四星結果20%三星、80%培養素材，不再每抽必出；既有保底及收藏保留","三檔難度，普通／稀有／珍藏裝備，0級掉落、20級上限","失敗／超時不扣體力、不掉落；不影響Boss或試煉次數","1.1.2主更新已重置試煉與塔；本次介面修正不再重置","既有裝備、角色、星伴、資源、保底保留；技能升級關閉"]}]);
  var storySource=null,futureStoryRevision=null,storyReplan=null,storyWorldMap=null;
  var storyChapters=[],version3StoryChapters=[],version2StoryChapters=[],version4StoryChapters=[],version5StoryChapters=[],northernMythArc=[];
  var banners = [
    {
      id: release.open11 ? "limited-1-1" : "limited-1-0-to-2-0",
      name: release.open11 ? "限定｜1.1 QWER 合奏召集" : "限定｜1.0 QW 回覆召集",
      type: "limited",
      poolKey: "limited",
      defaultFeaturedId: release.open11 ? "hina" : "chodan",
      description: release.open11 ? "1.1 限定池；Hina、Siyeon 為當期 4★，承接原有限定池保底。" : "1.0 限定池；Chodan、Magenta 為當期 4★。",
      featured4Stars: release.open11 ? [cards.hina, cards.siyeon] : [cards.chodan, cards.magenta],
      standard4Stars: [cards.chodan, cards.magenta],
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
      active: false,
      defaultFeaturedId: "risan",
      description: "2.0–2.5 新限定池；可從璃珊、曜澤、伊芙琳、澪歌、菲芮、諾芮亞、奧薇拉中選一隻，選中者 55%。",
      featured4Stars: version2Four,
      standard4Stars: version2Four,
      standard3Stars: activeThree
    },
    {
      id: "standard-echo",
      name: "常駐｜回音召集（" + release.version + "）",
      type: "standard",
      poolKey: "standard",
      description: "常駐池獨立計數；只收錄目前已開放的 1.0 角色，沒有精選保證。",
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
  var allStoryChapters=[],liveStoryChapters=[],storyChapterAliases={},storySceneAliases={},groupedVersion3StoryChapters=[],groupedVersion4StoryChapters=[],groupedVersion5StoryChapters=[];

  return {
    cards: cards,
    characterAssets: characterAssets,
    characterAtlas: characterAtlas,
    storyCharacters: storyCharacters,
    isarAscended: isarAscended,
    activeCards: activeCards,
    authorPreviewCards: authorPreviewCards,
    futureCards: futureCards,
    futureCharacterPlan: futureCharacterPlan,
    futureCharacterReleasePlan: futureCharacterReleasePlan,
    futureStoryRevision: futureStoryRevision,
    storyReplan: storyReplan,
    storyWorldMap: storyWorldMap,
    version3Cards: version3Cards,
    activeFour: activeFour,
    activeThree: activeThree,
    characterAnimations: characterAnimations,
    banners: banners,
    version2Cards: version2Cards,
    version4Cards: version4Cards,
    version5Cards: version5Cards,
    // 正式服目前只提供 1.0 正文；後續版本保留於開發檔，不輸出到遊戲章節。
    storyChapters: liveStoryChapters,
    storyVersionReward: storyVersionReward,
    liveStoryChapters: liveStoryChapters,
    version2StoryChapters: version2StoryChapters,
    version3StoryChapters: groupedVersion3StoryChapters,
    version4StoryChapters: groupedVersion4StoryChapters,
    version5StoryChapters: groupedVersion5StoryChapters,
    storyChapterAliases: storyChapterAliases,
    storySceneAliases: storySceneAliases,
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
    shopCatalog: shopCatalog,
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
    updateVersion: release.version,
    releaseConfig: release,
    compensationCycle: release.compensationCycle,
    explorationUpdateCycle: release.explorationUpdateCycle,
    explorationUpdateReward: release.explorationUpdateReward,
    explorationRepairReward: release.explorationRepairReward,
    updateCycle: updateCycle,
    updateReward: Object.freeze({ starSand: 6000, characterExp: 6000, starMarks: 3 })
  };
}));
