(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipInteractiveMap = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Map art comes from 01M. Corrected maps use unlabelled replacement art;
  // navigation labels and travel facts follow the current 01 world/itinerary document.
  var maps = {
    "W-001": { name: "艾珥汀大陸", level: 0, image: "w-001.png", imageVersion: "xingjing-basin-20261009", clean: true, orientation: "北方在上。中央偏西是可耕作的星井內陸盆地，不是大湖；右側藍色海域是本土東側近海。「東海」尚不是正式地名。鏡潮群島在洛汀灣以東，帷海在群島東南外航的另一張區域圖。", note: "大陸圖只呈現艾珥汀本土。西北黃土為無曉高原，保留給第六大版本之後，並非第五大版本的根冠高地。彼岸鐘庭與遠潮界是特殊連結，圖上按鈕只供查閱地圖，不表示目前可以直接通行。", landmarks: [
      ["白鐘城", 43, 66], ["獸靈森地", 56, 70], ["洛汀灣", 68, 72], ["星井盆地", 31, 44], ["根冠高地", 45, 18], ["無曉高原｜後續規劃", 17, 18], ["東側近海", 84, 52]
    ], points: [
      ["R1-000", "第一大版本｜南部內陸", 43, 70], ["R2-000", "第二大版本｜洛汀灣與鏡潮群島", 68, 78],
      ["R3-000", "第三大版本｜星井內陸", 38, 49], ["R4-000", "第四大版本｜新曙沿岸", 67, 26],
      ["R5-000", "第五大版本｜根冠高地", 49, 22], ["R6-000", "第六大版本｜群島東南外航至帷海", 97, 91]
    ] },
    "R1-000": { name: "第一大版本｜南部內陸生活圈", level: 1, parent: "W-001", image: "r1-000.png", imageVersion: "river-plain-20261009", clean: true, orientation: "白鐘城位於南部開闊內陸河谷；北行經丘陵到霧橋，再往北才進山地。畫面沒有海岸；主河向東南流往圖外洛汀灣。", note: "白鐘城是內陸核心；獸靈之村在東，霧橋在北，南驛山谷在南。鐘庭採特殊連結。", points: [
      ["C1-101", "白鐘城", 39, 62], ["C1-102", "獸靈之村", 84, 60],
      ["C1-103", "霧橋鎮", 43, 36], ["C1-104", "南驛山谷", 62, 84],
      ["A1-105", "迴音谷／山腰驛站", 48, 18], ["A1-106", "霧橋第七遺構", 62, 9],
      ["A1-107", "北斷橋工區", 67, 29]
    ] },
    "C1-101": { name: "白鐘城", level: 2, parent: "R1-000", image: "c1-101.png", imageVersion: "river-plain-20261009", clean: true, orientation: "城市坐落開闊河谷；北門通往丘陵及霧橋，東門通獸靈之村；主河自西向東流，並非海港。", note: "東門通獸靈之村：步行兩日；北門通霧橋鎮：步行三日；沿河順流至洛汀港：兩日。", points: [
      ["#central", "中央廣場", 52, 39], ["#observatory", "城西觀測分會", 29, 35],
      ["#workshop", "工坊區", 22, 47], ["#market", "商業區", 67, 40],
      ["#residences", "居民區", 52, 49], ["#north-gate", "北門", 53, 25],
      ["#east-gate", "東門", 78, 43], ["#river", "河岸與橋梁", 76, 65]
    ] },
    "C1-102": { name: "獸靈之村", level: 2, parent: "R1-000", image: "c1-102.png", imageVersion: "forest-stream-20261009", clean: true, orientation: "聚落在白鐘城以東的森林與小溪間，西側商路返白鐘；圖中的溪流不是港灣或大湖。", note: "自治聚落；從西側出口循商路兩日抵白鐘城東門。南驛山谷的開場位移不是常設道路。", points: [
      ["#village", "中央聚落", 48, 35], ["#fire", "共用火場", 48, 40],
      ["#heal", "療養所", 84, 39], ["#rangers", "巡林者據點", 17, 27],
      ["#supplies", "物資倉與工坊", 65, 57], ["#west-road", "西側白鐘商路出口", 7, 39]
    ] },
    "C1-103": { name: "霧橋鎮", level: 2, parent: "R1-000", image: "c1-103.png", imageVersion: "foothill-town-20261009", clean: true, orientation: "鎮子位於白鐘以北的丘陵河谷，北面逐漸入山；東北工區是支路，不是鎮內多層高架道路。", note: "南返白鐘約三日；經山腰驛站至迴音谷約一日；北斷橋為工程支路。", points: [
      ["#town", "鎮中心", 45, 42], ["#post", "霧橋驛站", 53, 43],
      ["#south", "南路入口", 61, 87], ["#north", "山路入口", 37, 8],
      ["#bridge", "北斷橋支路", 88, 16]
    ] },
    "C1-104": { name: "南驛山谷", level: 2, parent: "R1-000", image: "c1-104.png", imageVersion: "southern-fields-20261009", clean: true, orientation: "南驛位於南部農地與獸靈森地的交界；小溪和林路屬正常地形，開場界痕位移不是常設道路。", note: "驛務、農地、商路和聚落構成南側生活圈；開場界痕屬一次性異常。", points: [
      ["#post", "驛站", 35, 43], ["#fields", "農地與聚落", 74, 67],
      ["#forest", "獸靈森地入口", 77, 19], ["#south", "南方商路", 30, 73]
    ] },
    "A1-105": { name: "迴音谷／山腰驛站", level: 2, parent: "R1-000", image: "a1-105.png", clean: true, note: "霧橋外山路的驛站與谷地共用一張區域圖；至第七遺構仍需再走兩日山路。", points: [
      ["#post", "山腰驛站", 45, 41], ["#valley", "迴音谷", 70, 56],
      ["#road", "往第七遺構山路", 65, 8]
    ] },
    "A1-106": { name: "霧橋第七遺構", level: 2, parent: "R1-000", image: "a1-106.png", clean: true, note: "遺構內的彼岸鐘庭是同界錯接，屬特殊連結，不是相鄰城市道路。", points: [
      ["#entrance", "山路入口", 19, 39], ["#outer", "遺構外圍", 34, 35],
      ["#core", "核心連結區", 55, 42], ["#special", "彼岸鐘庭特殊連結", 58, 52]
    ], offMap: [["S1-201", "彼岸鐘庭｜特殊連結示意"]] },
    "A1-107": { name: "霧橋鎮北斷橋工區", level: 2, parent: "R1-000", image: "a1-107.png", note: "施工、封閉與半幅限重通行是劇情狀態；底圖不把未測區畫成安全通道。", points: [
      ["#deck", "斷橋橋面", 54, 42], ["#slow", "居民慢行線", 44, 65],
      ["#spider", "橋下鳴棘蛛區", 64, 58], ["#gather", "工人集合區", 34, 48]
    ], authorOffMap: [["A1-108", "兩岸局部圖｜候審概念稿"]] },
    "A1-108": { name: "霧橋北側兩岸｜候審局部圖", level: 3, parent: "A1-107", image: "a1-108-two-banks-concept.png", previewOnly: true, concept: true, note: "作者試玩概念底圖。斷橋兩岸、聚落、獸徑和撤離空地尚待與1.1／1.2逐幕場景核對；圖片中的小徑、河床不代表已核准通行。", points: [
      ["#west-bank", "西岸驛站與聚落", 28, 30], ["#broken-bridge", "斷橋兩端", 51, 22],
      ["#east-bank", "東岸居民點", 77, 25], ["#gather", "西岸撤離空地", 23, 43],
      ["#animal-trail", "東岸獸徑｜待測", 87, 46]
    ], pointNotes: { "west-bank": "西岸生活區與驛站配置仍待正文核對。", "broken-bridge": "橋梁已斷；兩岸不能由底圖推定可直接通行。", "east-bank": "東岸居民點為概念位置，尚未核定住戶與任務站位。", gather: "撤離空地為概念位置，須與任務集合線確認。", "animal-trail": "獸徑是待測地形線索，不是已開放的安全替代道路。" } },
    "R2-000": { name: "第二大版本｜洛汀灣與鏡潮群島", level: 1, parent: "W-001", image: "r2-000.png", previewOnly: true, concept: true, note: "河口港灣接多島海域；白帆岬的精確羅盤方位仍待海圖鎖定。", points: [
      ["C2-201", "洛汀港｜子圖草稿", 18, 50], ["C2-204", "白帆岬｜子圖草稿", 34, 53], ["C2-202", "鏡潮內港｜子圖草稿", 63, 42],
      ["C2-203", "雲脊高島｜子圖草稿", 83, 16], ["A2-205", "沉脈井｜子圖草稿", 58, 78], ["#tide-eye", "外緣潮眼", 91, 53]
    ], pointNotes: { lotin: "白鐘主河下游的出海港；順流約兩日，逆流返白鐘約三至四日。", cape: "從洛汀港乘船約半日；精確方位暫不鎖定。", isles: "白帆岬向東航行約一至兩日到達多島生活圈。", "storm-isle": "群島東北的高島；2.3風暴與避難線。", well: "群島南側海域的測站與沉脈井。", "tide-eye": "群島外緣危險潮眼；關閉近航路後仍需保留替代遠航道。" } },
    "C2-201": { name: "洛汀港｜候審詳細圖", level: 2, parent: "R2-000", image: "c2-201-lotin-port-concept.png", previewOnly: true, concept: true, note: "白鐘主河下游的河口港；河運、潮位接駁、居民生活與外海出航分區。各碼頭用途與可通行航線待2.0細綱核對。", points: [
      ["#river", "白鐘主河入港", 32, 14], ["#town", "港區居民與市場", 28, 49],
      ["#quay", "河海接駁碼頭", 52, 54], ["#yard", "修船與物資區", 39, 67],
      ["#departure", "外海出航口｜待測", 77, 75]
    ], pointNotes: { river: "白鐘至洛汀順流約兩日，逆流返程約三至四日。", town: "港口須同時呈現居民生活與日常工作。", quay: "潮位影響分批接駁，具體碼頭安排尚待章節核對。", yard: "修船與物資位置為概念稿。", departure: "出航口只示意通往海域；白帆岬精確角度與替代航道待測。" } },
    "C2-202": { name: "鏡潮島內港｜候審詳細圖", level: 2, parent: "R2-000", image: "c2-202-mirror-inner-harbor-concept.png", previewOnly: true, concept: true, note: "群島內側居民港與補給區；東側礁盤及外緣潮眼不是安全捷徑。島間橋梁與航道仍待逐島海程驗證。", points: [
      ["#entry", "西側入港水道", 21, 44], ["#market", "居民市集與船務", 50, 41],
      ["#quay", "內港碼頭", 53, 56], ["#tide", "潮位觀測點", 61, 23],
      ["#reef", "東側礁盤｜危險", 85, 49]
    ], pointNotes: { entry: "西側入港水道為地形概念，尚未標為安全航線。", market: "群島居民生活、市集與船務在此交會。", quay: "補給與修船能力須依2.0–2.5細綱確認。", tide: "潮位量測位置為概念點。", reef: "外側礁盤不可視為通往潮眼的安全近路。" } },
    "C2-203": { name: "雲脊高島｜候審詳細圖", level: 2, parent: "R2-000", image: "c2-203-cloudspine-high-island-concept.png", previewOnly: true, concept: true, note: "2.3風暴地形候審：西南低港受風浪威脅，居民須循上坡路到高處避難；東岸陡崖與暗礁不可當替代登岸線。", points: [
      ["#low-quay", "西南低港", 31, 57], ["#homes", "居民聚落", 43, 44],
      ["#refuge", "高處避難所", 56, 29], ["#watch", "風暴觀測塔", 31, 30],
      ["#cliffs", "東側危險崖岸", 78, 49]
    ], pointNotes: { "low-quay": "風暴時低港可能封閉；不能由底圖推定可出航。", homes: "居民撤離範圍須與2.3正文核對。", refuge: "高處避難所為概念位置，容量與路線尚待核定。", watch: "觀測塔只提供天候線索，不保證提前預知所有風暴。", cliffs: "東側崖岸與暗礁不可作安全登岸線。" } },
    "C2-204": { name: "白帆岬｜候審詳細圖", level: 2, parent: "R2-000", image: "c2-204-white-sail-cape-concept.png", previewOnly: true, concept: true, note: "洛汀灣外海岬角概念圖；港外礁盤與潮差需要實測。白帆岬相對洛汀港的精確羅盤角尚未鎖定。", points: [
      ["#inland", "返洛汀港陸路", 23, 19], ["#landing", "內側接駁碼頭", 33, 39],
      ["#tide", "潮位記錄棚", 40, 36], ["#beacon", "岬端信標", 72, 47],
      ["#reef", "外側礁盤｜待測", 81, 60]
    ], pointNotes: { inland: "返港道路為概念線；洛汀港到白帆岬的正式交通仍以行程頁為準。", landing: "接駁碼頭配置待2.0章節與潮汐核對。", tide: "潮位記錄點為概念位置。", beacon: "岬端信標不代表已核准的出海方向。", reef: "外側礁盤與替代航道尚未實測，不能標示安全通行。" } },
    "A2-205": { name: "沉脈井｜候審測站圖", level: 2, parent: "R2-000", image: "a2-205-sunken-vein-well-concept.png", previewOnly: true, concept: true, note: "群島南側測站與下潛區概念。圖中的井口建築形狀與水深是美術暫案；下潛、接應及回收線須依2.2正文與測量核准，暗礁與深水區不作安全航道。", points: [
      ["#station", "水面接應測站", 34, 25], ["#boat", "接應船位｜待測", 41, 30],
      ["#well", "沉脈井上層｜概念", 47, 62], ["#shallow", "淺礁觀測區", 34, 51],
      ["#deep", "深水斷崖｜危險", 82, 68]
    ], pointNotes: { station: "水面接應員須保有停航與回收判斷；站位待正文確認。", boat: "接應船位與回收時機不由底圖外觀推定。", well: "井口形狀是美術暫案，不能據此推定正式設施尺度或可潛深度。", shallow: "淺礁仍需潮位與人員核對。", deep: "深水斷崖及暗礁不標為安全航線。" } },
    "R3-000": { name: "第三大版本｜霽光廊・星井盆地・北河走廊", level: 1, parent: "W-001", image: "r3-000.png", imageVersion: "dry-basin-20261009", previewOnly: true, concept: true, orientation: "中西部為可耕作的內陸盆地，白榆河沿東側山壁；右下霽光廊連霧橋，左上北門越分水線後才接右上獨立北河。", note: "從霧橋往西北入山；星井北門之後沿北河下行至北境，不從洛汀灣直接越圖。", points: [
      ["C3-301", "霽光廊｜子圖草稿", 79, 80], ["C3-302", "星井盆地｜子圖草稿", 37, 46], ["#elm-river", "白榆河", 93, 45],
      ["C3-304", "鍛路鎮｜子圖草稿", 48, 20], ["A3-305", "星井北門｜子圖草稿", 25, 10], ["A3-303", "北河走廊｜子圖草稿", 80, 12]
    ], pointNotes: { corridor: "霧橋向西北進入的山河門檻；白石驛站與岑光聚落位於此段。", basin: "中央山地盆地與地下遺構群，第三季的主要內陸生活圈。", "elm-river": "盆地東側的白榆河；改道前後兩岸仍需局部圖核對。", "forge-road": "盆地北側山脊上的鍛路鎮，接往北門。", "north-gate": "越山入口；星井終端位於附近山腹，並非另一座城市。", "north-river": "越山後沿北河向北境海岸下行。" } },
    "C3-301": { name: "霽光廊｜候審詳細圖", level: 2, parent: "R3-000", image: "c3-301-jiguang-corridor-concept.png", previewOnly: true, concept: true, orientation: "圖面右下是霧橋方向入口，往左上越山後進星井盆地；這是山河門檻，不接洛汀灣直路。", note: "白石驛站與岑光聚落的精確位置、橋梁承重和傷患分流線待第三季逐幕核對。", points: [
      ["#mistbridge-entry", "霧橋方向山路入口", 87, 72], ["#white-stone", "白石驛站｜概念位置", 72, 62],
      ["#cenguang", "岑光聚落｜概念位置", 56, 36], ["#survey-bridge", "山河橋梁｜待測", 31, 28],
      ["#basin-exit", "星井盆地出口", 17, 14]
    ], pointNotes: { "mistbridge-entry": "從霧橋向西北入山；大隊及傷患通行須先核對山口與橋梁。", "white-stone": "驛站概念位置，尚非已定任務站位。", cenguang: "聚落概念位置，居民日常路線須由第三季正文確認。", "survey-bridge": "橋梁承重與通行時段待量測，不由底圖判定安全。", "basin-exit": "山口之後接星井盆地，不能從洛汀灣直切過來。" } },
    "C3-302": { name: "星井盆地｜候審詳細圖", level: 2, parent: "R3-000", image: "c3-302-xingjing-basin-concept.png", previewOnly: true, concept: true, orientation: "盆地生活圈在中西部，白榆河沿東側；北緣山脊通星井北門，東南山路回霽光廊。", note: "農地、聚落與地下遺構為空間概念；白榆河改道後的兩岸交通與遺構進出須依第三季正文核對。", points: [
      ["#farms", "盆地農地與聚落", 48, 49], ["#ruins", "地下遺構帶｜概念", 20, 34],
      ["#baiyu", "白榆河東岸", 83, 42], ["#north-gate", "星井北門方向", 55, 10],
      ["#corridor", "霽光廊方向入口", 84, 84]
    ], pointNotes: { farms: "盆地地方生活圈；外來回覆台不能取代地方拒絕權。", ruins: "遺構外觀與出入口仍屬美術概念。", baiyu: "白榆河是盆地東側河道，不直接併入白鐘主河或北河。", "north-gate": "北門在跨分水線的高處，具體山道與管制待核定。", corridor: "由霽光廊越山抵盆地，非洛汀港捷徑。" } },
    "A3-303": { name: "北河走廊｜候審路線圖", level: 2, parent: "R3-000", image: "a3-303-north-river-corridor-concept.png", previewOnly: true, concept: true, orientation: "圖面左上越過星井北門分水線，沿獨立的北河谷往右上遠處北境海岸下行；與白榆河分流。", note: "北河與橋梁、補給聚落、下行山路為候審地形。通往新曙港仍依已定七至十日行程及河段開閉狀態。", points: [
      ["#gate", "星井北門越山口", 13, 18], ["#supply", "下行補給聚落｜概念", 52, 52],
      ["#crossing", "北河橋梁｜待測", 66, 63], ["#downriver", "往新曙港方向", 83, 18]
    ], pointNotes: { gate: "越過分水帶後才接北河；星井終端在附近山腹，不是獨立城市。", supply: "補給聚落為概念位置；河段封閉時不得推定可繼續前進。", crossing: "承重與水位待量測。", downriver: "往北境海岸新曙港約七至十日，須按季節與補給狀態通行。" } },
    "C3-304": { name: "鍛路鎮｜候審局部圖", level: 2, parent: "R3-000", image: "c3-304-forge-road-town-concept.png", previewOnly: true, concept: true, orientation: "鍛路鎮位於星井盆地北緣山脊。圖面左下沿坡返回盆地農地，右上受控山路接星井北門；東側白榆河在山腳，不穿過鎮心。", note: "熱路工坊、住區與物資儲備是 3.3 候審配置；爐數、供能量及山口通行須依第三季正文核定。", points: [
      ["#basin-road", "下坡返星井盆地", 16, 72], ["#homes", "山脊住區", 43, 41], ["#forge", "熱路工坊｜概念", 64, 38], ["#stores", "燃料與工具儲備", 74, 47], ["#gate-road", "上行星井北門", 88, 13]
    ], pointNotes: { "basin-road": "由盆地北緣上坡進鎮；不接洛汀灣或白鐘主河。", homes: "工鎮仍須有居民日常生活。", forge: "熱路設備配置為概念，不代表已核定供能能力。", stores: "補給及輪值容量待 3.3 正文確認。", "gate-road": "通往北門分水帶，山口管制及承重待核定。" } },
    "A3-305": { name: "星井北門｜候審分水帶圖", level: 2, parent: "R3-000", image: "a3-305-xingjing-north-gate-concept.png", previewOnly: true, concept: true, orientation: "左下是星井盆地與鍛路鎮上行路；中央為受控山口及分水線；右上越山後才進獨立北河谷。白榆河與北河不得相連。", note: "山口測站與附近山腹星界終端為候審位置；北門不是另一座城市，通行狀態由劇情及補給條件決定。", points: [
      ["#south-road", "南側鍛路鎮來路", 19, 73], ["#checkpoint", "北門管制與補給", 54, 38], ["#terminal", "星界終端山腹方向｜概念", 20, 17], ["#divide", "分水線", 68, 44], ["#north-river", "越山後北河谷", 86, 16]
    ], pointNotes: { "south-road": "由盆地經鍛路鎮上行；白榆河仍屬南側盆地。", checkpoint: "山口容量與通行時段須核定。", terminal: "星界終端在附近山腹，位置與入口未正式鎖定。", divide: "白榆河與北河是兩個分離河系，不是無阻航道。", "north-river": "跨越分水線後才沿北河下行至北境。" } },
    "R4-000": { name: "第四大版本｜新曙沿岸", level: 1, parent: "W-001", image: "r4-000.png", previewOnly: true, concept: true, note: "新曙港與內陸工坊、東北遠望塔、北方白夜航路和外海回覆海溝是不同尺度的地點。虹徑外環須經遠望塔已測窗口，4.2 僅能測試落點附近。", points: [
      ["C4-401", "新曙港｜子圖草稿", 42, 34], ["C4-402", "碎星工坊｜子圖草稿", 23, 69], ["C4-403", "遠望塔｜子圖草稿", 69, 30],
      ["#white-night", "白夜航路", 76, 7], ["#trench", "回覆海溝", 89, 57]
    ], offMap: [["S5-201", "虹徑外環｜遠望塔特殊連結示意"]], pointNotes: { "new-dawn": "星井北門後沿北河與山路下行約七至十日抵達的北境港城。", workshops: "新曙港向內陸約兩日的工坊區。", watchtower: "新曙港沿東北岸約三日到遠望塔生活圈。", "white-night": "遠望塔以北的季節沿海航路；可通狀態由劇情另行標示。", trench: "遠望塔港出船約三日的外海深水區，不貼在岸邊。" } },
    "C4-401": { name: "新曙港｜候審詳細圖", level: 2, parent: "R4-000", image: "c4-401-new-dawn-port-concept.png", previewOnly: true, concept: true, orientation: "北境海岸港城，圖面左下為北河與山路抵達的內陸入口，右側為港灣；不是白鐘主河的另一個河口。", note: "港口兼具居民生活、信標、船務、醫療與糧食庫存；河段封閉時須保留獨立補給。碼頭與庫房配置為候審概念。", points: [
      ["#river-road", "北河下行入城路", 14, 61], ["#homes", "居民與市集", 37, 36],
      ["#reserves", "醫療與糧食庫存｜概念", 58, 47], ["#quay", "港務與修船碼頭", 65, 60],
      ["#coast-road", "東北沿岸往遠望塔", 72, 11]
    ], pointNotes: { "river-road": "星井北門後沿北河與山路下行約七至十日抵達新曙；河段開閉須按劇情狀態。", homes: "港城居民生活區為概念配置。", reserves: "北河封閉時仍需醫療及糧食庫存；實際庫量待正文核對。", quay: "出航與維修能力不得由畫面船數推定。", "coast-road": "沿東北岸約三日抵遠望塔生活圈。" } },
    "C4-402": { name: "碎星工坊｜候審詳細圖", level: 2, parent: "R4-000", image: "c4-402-shattered-star-workshops-concept.png", previewOnly: true, concept: true, orientation: "工坊在新曙港內陸約兩日，圖面右上道路回港；左上高地支線通北境內陸，雪季通行待核准。", note: "工具、信標和船件維修與工人生活並置；圖中的爐數、橋梁、產能和高地補給線均為美術暫案。", points: [
      ["#foundry", "工坊與鍛造區", 37, 39], ["#storage", "零件與補給倉", 59, 35],
      ["#homes", "工人住區", 75, 64], ["#port-road", "返新曙港道路", 90, 15],
      ["#upland", "高地補給支線｜待測", 24, 12]
    ], pointNotes: { foundry: "工坊產能與設備依第四季正文核定。", storage: "港口信標與船件的補給用途為候審配置。", homes: "工人日常住區不得被工業場景取代。", "port-road": "由工坊至新曙港約兩日內陸路程。", upland: "往根冠高地的補給關係受雪季山口限制，不是常開捷徑。" } },
    "C4-403": { name: "遠望塔｜候審詳細圖", level: 2, parent: "R4-000", image: "c4-403-farwatch-tower-concept.png", previewOnly: true, concept: true, orientation: "新曙港東北沿岸的岬角生活圈；圖面左下沿岸路回港，右側為外海，北上白夜航路依季節開放。", note: "塔旁測試平台只示意 4.2 虹徑外環短窗口的量測區，不把外環畫成相鄰地塊；回覆海溝在離岸深水，不貼近此岸。", points: [
      ["#road", "返新曙港沿岸路", 17, 67], ["#homes", "塔下居民與補給", 41, 41],
      ["#landing", "避風接駁點｜概念", 54, 62], ["#tower", "遠望塔與信標", 62, 26],
      ["#window", "短窗口量測平台", 72, 25]
    ], offMap: [["S5-201", "虹徑外環｜已測窗口示意"]], pointNotes: { road: "新曙港沿東北岸約三日到遠望塔。", homes: "塔下居民生活與補給配置仍待正文核對。", landing: "小港不等於回覆海溝出航港，具體船務待定。", tower: "信標須回報沿岸與白夜季節航路狀態。", window: "4.2 短窗口只測落點附近；5.2 才深入外環，兩端均可拒絕通行。" } },
    "R5-000": { name: "第五大版本｜根冠高地與北境特殊連結", level: 1, parent: "W-001", image: "r5-000.png", imageVersion: "snow-grove-20261007", previewOnly: true, concept: true, orientation: "北側連續雪山與第四版西側雪線相接；根林只佔避風高地一隅，霜火谷地熱集中在下層，東南補給路通新曙沿岸。西北無曉高原不屬本圖。", note: "根冠與霜火谷位於北境內陸；補給路下行至新曙沿岸。虹徑外環須經遠望塔已測窗口，不在此地形圖上畫成相鄰島城。", points: [
      ["C5-501", "根冠高地｜子圖草稿", 48, 17], ["A5-502", "霜火谷｜子圖草稿", 43, 48], ["#coast-link", "新曙補給路", 81, 79],
    ], pointNotes: { "root-crown": "新曙港向北約五日山路；高地的根林、長冬與地方守望塑造第五季生活。", frostfire: "根冠下行約一日山路的霜火谷與鍛環；地熱只集中於谷底，不貫穿整座高地。", "coast-link": "沿岸藥物、器具與糧種上高地，木材、熱源材料與季節勞力下港口；雪季通行受山口狀態限制。" } },
    "C5-501": { name: "根冠高地｜候審詳細圖", level: 2, parent: "R5-000", image: "c5-501-root-crown-highland-concept.png", previewOnly: true, concept: true, orientation: "北側雪山連續，根林只在避風高地一隅；東南雪季道路下行往新曙，霜火谷在較低地形。", note: "高地居民、糧食儲備與守望點為候審配置；虹徑外環不是圖旁可步行到的浮島。", points: [
      ["#grove", "避風根林", 42, 24], ["#homes", "高地聚落", 50, 40],
      ["#stores", "冬季糧食與器具", 22, 61], ["#watch", "山口守望", 72, 22],
      ["#downhill", "新曙補給路｜雪季限行", 80, 77]
    ], pointNotes: { grove: "根林是局部避風地，不覆蓋整座高地。", homes: "居民生活與守望配置待第五季正文核對。", stores: "雪季需有庫存；實際容量待補給設定核定。", watch: "山口開閉依雪況與地方判斷。", downhill: "新曙港往根冠約五日山路；雪季不得由底圖推定常開。" } },
    "A5-502": { name: "霜火谷｜候審詳細圖", level: 2, parent: "R5-000", image: "a5-502-frostfire-valley-concept.png", previewOnly: true, concept: true, orientation: "根冠高地下行約一日抵谷地；地熱只集中在谷底泉區，周圍仍是寒冷山坡。", note: "鍛環、居住區與熱源材料儲備為候審配置；泉區危險邊界與補給路須依第五季正文核定。", points: [
      ["#upland", "上行根冠高地", 16, 13], ["#forge", "鍛環工坊", 33, 33],
      ["#springs", "谷底地熱泉區｜危險", 57, 45], ["#homes", "居民與儲備", 79, 52],
      ["#downhill", "下行補給路｜待測", 90, 69]
    ], pointNotes: { upland: "由谷地至根冠高地約一日山路。", forge: "鍛環產能和設施為概念，尚待正文核定。", springs: "熱泉危險邊界不可由圖面色彩判定安全。", homes: "居民與熱源材料儲備須和工坊區分。", downhill: "往新曙沿岸的補給線受雪季山口限制。" } },
    "R6-000": { name: "第六大版本｜帷海外航與照汐城生活圈", level: 1, parent: "W-001", image: "r6-000.png", previewOnly: true, concept: true, orientation: "西北方圖外是艾珥汀本土：從洛汀灣東航至鏡潮群島，再沿本圖由左上往右下東南外航，抵達帷海照汐城。", note: "照汐城不與新曙港或根冠高地直接相鄰。從照汐外岸到遠潮界須等跨界接點驗證，6.3 舊線永久關閉，6.6 另建新線有限通行。", points: [
      ["#supply-isles", "鏡潮群島補給", 18, 11], ["#outer-route", "帷海外航", 48, 49], ["C6-601", "照汐城｜子圖草稿", 86, 77],
      ["#outer-shore", "照汐外岸方向", 72, 88]
    ], pointNotes: { "supply-isles": "在既有群島補給後依季風東南外航。", "outer-route": "鏡潮群島至照汐城暫採順季風五至七日、逆風八至十日；替代港與危險海域仍待海圖。", choashi: "帷海諸邦的主要落腳城市，用具體社會逐步帶出諸邦。", "outer-shore": "先進入照汐城子圖，再到東南外岸局部圖查閱遠潮界連結；兩界仍分圖，不能把遠潮界畫成帷海島嶼。" } },
    "C6-601": { name: "照汐城｜候審詳細圖", level: 2, parent: "R6-000", image: "c6-601-choashi-city-concept.png", previewOnly: true, concept: true, orientation: "鏡潮群島補給後東南外航抵帷海；圖面西北港區接船，東南外岸測站與城市生活區分開。遠潮界不在此圖海面上。", note: "帷海諸邦的港城日常、市集、住區與測潮設施為候審配置；6.3 舊跨界線永久關閉，6.6 新線有限通行。", points: [
      ["#arrival", "西北入港與補給", 21, 31], ["#market", "市集與船務", 42, 31],
      ["#homes", "居民生活區", 71, 28], ["#tide", "測潮平台｜概念", 65, 46],
      ["A6-602", "照汐外岸接點｜子圖草稿", 87, 73]
    ], pointNotes: { arrival: "從鏡潮群島沿帷海外航抵達，順季風暫估五至七日、逆風八至十日。", market: "城市須呈現日常社會及船務，不只作跨界事件背景。", homes: "居民區配置待第六季正文核對。", tide: "潮位觀測設施為概念位置。" } },
    "A6-602": { name: "照汐外岸接點｜候審局部圖", level: 3, parent: "C6-601", image: "a6-602-choashi-outer-shore-concept.png", previewOnly: true, concept: true, orientation: "左上道路返回帷海照汐城，右下是同一海岸的外海與礁盤；遠潮界在另一張世界圖，不是岸外島嶼。", note: "沿岸觀測、舊接點封閉區與新線候審區分開。6.3 舊連結永久關閉；6.6 新線仍須雙端核准並受季節及載重限制。", points: [
      ["#city-road", "返照汐城道路", 18, 20], ["#tide", "潮位觀測台", 57, 38], ["#old-site", "舊接點封閉區", 35, 49], ["#new-review", "新線候審測站", 82, 12], ["#reef", "外海礁盤｜危險", 76, 65]
    ], offMap: [["S6-001", "遠潮界｜跨界地圖查閱"]], pointNotes: { "city-road": "外岸沿陸路返回照汐城生活區。", tide: "潮位與海況量測不等於跨界通行許可。", "old-site": "6.3 舊連結永久關閉，不得畫成返回路線。", "new-review": "6.6 另建新線；位置為候審，不表示新線在畫面中常開。", reef: "礁盤不可作安全航道，也不能當遠潮界陸地。" } },
    "S6-001": { name: "遠潮界｜繫舟盆地", level: 0, image: "s6-001.png", imageVersion: "basin-20261007", previewOnly: true, concept: true, note: "獨立世界圖。照汐外岸的已驗證連結落在盆地西緣石岸；6.3舊連結永久關閉，6.6另建受季節與載重限制的新線。", points: [
      ["#west-shore", "西緣石岸", 20, 55], ["S6-101", "繫舟城", 47, 43], ["S6-102", "青汐臺地", 78, 24], ["#water", "供水區", 86, 37]
    ], pointNotes: { "west-shore": "照汐外岸已驗證連結的落點；從此至繫舟城步行約一日。", water: "供水區；6.3事件中的傷者集合點與強制裝載地另列，不合併成同一處。" } },
    "S6-101": { name: "繫舟城｜候審詳細圖", level: 1, parent: "S6-001", image: "s6-101-tether-city-concept.png", previewOnly: true, concept: true, orientation: "遠潮界盆地中央的內陸水道城市。西向石岸步行約一日，東北往青汐臺地約半日至一日；水道不是海灣。", note: "河汊、濕地、碼頭與日常城區是候審布局；跨界舊線落在盆地西緣，不在城內。", points: [
      ["#west-road", "西緣石岸來路", 12, 69], ["#landings", "內陸船埠", 40, 55], ["#city", "城市生活區", 55, 38], ["#qingxi-road", "青汐臺地去路", 84, 19]
    ], pointNotes: { "west-road": "由西緣石岸步行約一日；6.3舊跨界連結永久關閉。", landings: "內陸河道與濕地船埠，不是外海港口。", city: "城市社會與常態生活配置待正文核定。", "qingxi-road": "往盆地東北臺地約半日至一日。" } },
    "S6-102": { name: "青汐臺地｜候審詳細圖", level: 1, parent: "S6-001", image: "s6-102-qingxi-plateau-concept.png", previewOnly: true, concept: true, orientation: "位於遠潮界繫舟盆地東北的高臺；西側下坡道路通往繫舟城，圖中左下可見盆地低地。", note: "臺地聚落、梯田與泉源供水為候審布局。供水區與6.3傷者集合點、強制裝載地分開標定。", points: [
      ["#city-road", "下坡往繫舟城", 18, 68], ["#terraces", "臺地聚落與梯田", 54, 32], ["#springs", "泉源供水區｜概念", 79, 26]
    ], pointNotes: { "city-road": "往繫舟城約半日至一日，仍須核對實際坡道。", terraces: "聚落和耕作梯田是候審配置。", springs: "供水設施與6.3事件的傷者集合點、強制裝載地不是同一處。" } },
    "S1-201": { name: "彼岸鐘庭｜候審特殊地形圖", level: 3, parent: "A1-106", image: "s1-201-bell-court-concept.png", previewOnly: true, concept: true, orientation: "只呈現第七遺構錯接窗口另一端的已知落點與外庭；與白鐘城及遺構地圖無共同羅盤比例，普通地理座標未定。", note: "1.4校準後才可透過遺構窗口進入。內庭通行與回程條件尚未驗證，圖像不表示窗口常開。", points: [
      ["#bell-landing", "鐘庭已知落點", 19, 72], ["#outer-court", "外庭生活區｜概念", 51, 46], ["#bell-inner", "內庭待測邊界", 82, 23]
    ], pointNotes: { "bell-landing": "由第七遺構窗口錯接至此；須依1.4劇情校準，不能視為普通道路。", "outer-court": "外庭建築與生活配置為候審概念。", "bell-inner": "尚未驗證為安全通路；不標示確定回程線。" } },
    "S5-201": { name: "虹徑外環｜候審特殊地形圖", level: 3, parent: "C4-403", image: "s5-201-rainbow-outer-ring-concept.png", previewOnly: true, concept: true, orientation: "這是遠望塔已測窗口另一端的獨立局部圖，非新曙或根冠相鄰地形；圖中方位與兩地地圖無共同羅盤比例。", note: "4.2僅測外環落點附近，5.2才可深入至命線織庭；兩端可拒絕通行。圖片是候審地形，不表示窗口常開。", points: [
      ["#rainbow-landing", "外環落點與測站", 17, 65], ["#settlement", "外環生活與休息點｜概念", 49, 35], ["#weave-court", "命線織庭方向", 87, 15]
    ], pointNotes: { "rainbow-landing": "4.2短窗口僅容測試落點附近；兩端可拒絕通行。", settlement: "聚落配置是候審概念，5.2路線仍待正文核對。", "weave-court": "5.2才深入外環；落點至織庭約一日步行。" } }
  };

  var details = {
    central: "城中公共廣場與城市交通核心。", observatory: "觀測會分會；與城西工坊共同處理量測與工程。",
    workshop: "城西工坊區。", market: "市場、旅店與一般商業帶。", residences: "居民生活區。",
    "north-gate": "往霧橋鎮，正常山路步行三日。", "east-gate": "往獸靈之村，正常商路步行兩日。",
    river: "城內河岸與橋梁；沿河順流兩日到洛汀港。", village: "聚落的日常生活核心。",
    fire: "共同生活與集會的火場。", heal: "醫療與療養空間。", rangers: "巡林與採集的接應點。",
    supplies: "公共物資、修繕與工坊。", "west-road": "村西商路出口；向西步行兩日到白鐘城東門。", road: "主要山路；依行程文件核對步程。",
    town: "霧橋鎮中心。", post: "地方驛站與換班點。", south: "往南方生活圈的商路。",
    north: "往山路與遺構方向。", bridge: "通往北斷橋工區的支路。", fields: "農地與一般聚落。",
    forest: "通往獸靈森地的道路。", valley: "迴音谷與救援區域。", entrance: "遺構山路入口。",
    outer: "遺構外圍及破損通路。", core: "遺構核心連結區。", special: "第七遺構通往彼岸鐘庭的同界錯接窗口；1.4鐘庭校準時成為主要劇情連結，不是可隨時步行的普通道路。",
    deck: "橋面僅在劇情核准後半幅限重通行。", slow: "居民取水與送藥的外側慢行線。",
    spider: "橋下鳴棘蛛活動區，施工需避開。", gather: "工程撤離與集合區。"
  };

  var routePlans = {
    "R2-000": ["洛汀港 → 白帆岬：約半日；圖上岬角在港口偏東，精確羅盤方位待海圖。", "白帆岬 → 鏡潮群島：向東約一至兩日；內側潮路與西側避風迴路均待實測。", "外緣潮眼封閉近航路時須停航或折返已知補給點；替代遠航道尚未驗證。"],
    "R6-000": ["鏡潮群島補給 → 帷海外航 → 照汐城：圖上由西北往東南；順季風暫估五至七日，逆風八至十日。", "惡劣海況先返回已知群島補給點或待航；替代港、危險水域與精確航向待海圖核定。", "照汐外岸的跨界接點與遠潮界西緣石岸分屬兩張世界圖。"]
  };
  var phaseStates = {
    "A1-107": [
      ["施工前", "斷橋封閉；居民慢行線僅供取水與送藥。"], ["核准後", "橋面半幅限重，工區按劇情核准通行；未測橋下區仍封閉。"]
    ],
    "R2-000": [["2.0", "港岬與群島常規航段；精確方位待測。"], ["2.3", "雲脊高島風暴，避難線依事件開放；外緣潮眼不可當捷徑。"], ["2.5", "外緣潮眼近航路關閉；替代遠航道待實測，不標安全通路。"]],
    "R4-000": [["常態", "白夜航路依季節與海況開放。"], ["4.2", "遠望塔短窗口僅到虹徑外環落點附近。"]],
    "R5-000": [["雪季", "根冠山口限行，補給路依雪況核准。"], ["5.2", "虹徑外環已可深入，但仍由窗口兩端核准。"]],
    "R6-000": [["6.2", "照汐外岸至遠潮界西緣石岸的舊連結經驗證可通。"], ["6.3", "舊連結永久關閉；不得再次用作返回線。"], ["6.6", "另建新線有限通行，受季節與載重窗口及雙方管理限制；舊線維持關閉。"]],
    "S6-001": [["6.2", "由照汐外岸抵西緣石岸，再步行至繫舟城。"], ["6.3", "西緣石岸舊連結永久關閉。"], ["6.6", "新線有限通行；不是重開舊落點。"]],
    "S1-201": [["1.4", "鐘庭校準後才可經遺構窗口進入；內庭未測區不開放。"]],
    "S5-201": [["4.2", "短窗口只抵落點附近。"], ["5.2", "可深入外環至織庭；兩端仍可拒絕通行。"]]
  };

  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function lineage(id) { var out = []; var seen = {}; while (maps[id] && !seen[id]) { seen[id] = true; out.unshift(id); id = maps[id].parent; } return out; }
  function render(id, selectedPoint, options) {
    var map = maps[id] || maps["W-001"];
    var canPreview = !!(options && options.authorPreview);
    var firstMajor = /^(R1-|C1-|A1-|S1-)/.test(id);
    var locked = map.previewOnly && !canPreview && !firstMajor;
    var trail = lineage(id).map(function (key, i, all) { return key === id ? "<span>" + escapeHtml(maps[key].name) + "</span>" : "<button type=\"button\" data-map-go=\"" + key + "\">" + escapeHtml(maps[key].name) + "</button><span aria-hidden=\"true\">›</span>"; }).join("");
    var dots = (locked ? [] : map.points || []).map(function (point) {
      var target = maps[point[0]], unavailable = target && target.pending, isDetail = point[0].charAt(0) === "#";
      return "<button type=\"button\" class=\"atlas-pin" + (isDetail ? " detail" : " child") + (point[0] === "R6-000" && id === "W-001" ? " offshore" : "") + (selectedPoint === point[0] ? " active" : "") + (unavailable ? " pending" : "") + "\" style=\"left:" + point[2] + "%;top:" + point[3] + "%\" data-map-go=\"" + escapeHtml(point[0]) + "\" aria-label=\"" + (isDetail ? "查看地點說明：" : "進入子地圖：") + escapeHtml(point[1]) + (unavailable ? "，地圖待製作" : "") + "\"><span>" + escapeHtml(point[0] === "R6-000" && id === "W-001" ? "第六版｜帷海外航" : point[1]) + "</span></button>";
    }).join("");
    var selected = (map.points || []).concat(map.offMap || []).find(function (p) { return p[0] === selectedPoint; });
    var localDescription = selected && selected[0].charAt(0) === "#" ? (map.pointNotes && map.pointNotes[selected[0].slice(1)]) || details[selected[0].slice(1)] : "";
    var nav = map.parent ? "<button type=\"button\" class=\"atlas-back\" data-map-go=\"" + map.parent + "\">← 返回上一層</button>" : "";
    var worldSwitch = id === "W-001" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"S6-001\">遠潮界｜跨界地圖 ↗</button><button type=\"button\" class=\"atlas-switch\" data-map-go=\"S1-201\">彼岸鐘庭｜遺構特殊連結 ↗</button>" : id === "S6-001" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"R6-000\">查看帷海外岸入口</button><button type=\"button\" class=\"atlas-switch\" data-map-go=\"W-001\">返回艾珥汀大陸</button>" : id === "S1-201" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"W-001\">返回艾珥汀大陸總圖</button>" : "";
    var landmarks = (map.landmarks || []).map(function (place) { return "<span class=\"atlas-landmark\" style=\"left:" + place[1] + "%;top:" + place[2] + "%\">" + escapeHtml(place[0]) + "</span>"; }).join("");
    var diagram = map.diagram && !locked ? "<div class=\"atlas-diagram\" aria-label=\"特殊連結拓樸示意\"><small>連結次序示意｜非地理比例或羅盤方位</small><div>" + (map.points || []).map(function (point, i) { return (i ? "<span aria-hidden=\"true\">→</span>" : "") + "<button type=\"button\" data-map-go=\"" + escapeHtml(point[0]) + "\">" + escapeHtml(point[1]) + "</button>"; }).join("") + "</div></div>" : "";
    var visual = diagram || (map.image && !locked ? "<div class=\"atlas-image-wrap atlas-level-" + map.level + (map.concept ? " atlas-concept" : "") + "\"><img src=\"./assets/maps/" + map.image + (map.imageVersion ? "?v=" + map.imageVersion : "") + "\" alt=\"" + escapeHtml(map.name) + "地圖\" loading=\"lazy\">" + landmarks + dots + "</div>" : "<div class=\"atlas-pending\"><strong>" + (locked ? "作者試玩概略圖" : "地圖原圖待製作") + "</strong><p>" + (locked ? "此大版本尚未向一般玩家開放；作者試玩可查看第一層區域概略圖。" : "此區已有層級入口，詳細地圖尚未經地理核對與出圖。") + "</p></div>");
    var destinations = (locked ? [] : (map.points || []).concat(map.offMap || [], canPreview ? map.authorOffMap || [] : [])).map(function (point) { var isDetail = point[0].charAt(0) === "#", isSpecial = !isDetail && (map.offMap || []).concat(map.authorOffMap || []).some(function (link) { return link[0] === point[0]; }); return "<button type=\"button\" class=\"" + (isDetail ? "atlas-detail-link" : isSpecial ? "atlas-special-link" : "atlas-child-link") + "\" data-map-go=\"" + escapeHtml(point[0]) + "\">" + (isDetail ? "查看說明｜" : isSpecial ? "查看特殊連結圖｜" : "進入子圖｜") + escapeHtml(point[1]) + (maps[point[0]] && maps[point[0]].pending ? " · 待製作" : "") + "</button>"; }).join("");
    var routes = canPreview && routePlans[id] ? "<section class=\"atlas-route-plan\"><strong>航路核對</strong><ul>" + routePlans[id].map(function (line) { return "<li>" + escapeHtml(line) + "</li>"; }).join("") + "</ul></section>" : "";
    var phases = canPreview && phaseStates[id] ? "<section class=\"atlas-route-plan\"><strong>劇情通行狀態</strong><ul>" + phaseStates[id].map(function (phase) { return "<li><b>" + escapeHtml(phase[0]) + "：</b>" + escapeHtml(phase[1]) + "</li>"; }).join("") + "</ul></section>" : "";
    return "<div class=\"atlas-heading\"><div><span class=\"eyebrow\">INTERACTIVE ATLAS / L" + map.level + "</span><h3 id=\"story-map-title\">" + escapeHtml(map.name) + "</h3></div><span class=\"story-map-version\">" + (locked ? "作者試玩" : map.pending ? "待製作" : map.concept ? (map.level >= 2 ? "候審子圖" : "區域概略圖") : map.clean ? "無字修正版" : "第一版原圖") + "</span></div><nav class=\"atlas-crumbs\" aria-label=\"地圖層級\">" + trail + "</nav><div class=\"atlas-controls\">" + nav + worldSwitch + "</div>" + (map.orientation ? "<p class=\"atlas-orientation\">" + escapeHtml(map.orientation) + "</p>" : "") + visual + (destinations ? "<div class=\"atlas-destinations\" aria-label=\"地圖目的地\">" + destinations + "</div>" : "") + routes + phases + "<div class=\"atlas-foot\"><p role=\"status\" aria-live=\"polite\">" + escapeHtml(localDescription || map.note || "後續區域的正式地圖與節點正在製作。") + "</p><small>" + (locked ? "尚未正式開放。" : map.concept ? "僅供作者校對地形與路線；未標定的距離、方位和細部站位仍待核定。" : map.image ? (map.clean ? "地名、行程與可通行狀態由互動標記和現行設定提供。" : "圖像為第一版概念原圖；地名、行程與可通行狀態以互動標記及現行設定為準。") : "詳細原圖尚未提供；此入口僅顯示規劃中的層級與區域名稱。") + "</small></div>";
  }
  return { maps: maps, lineage: lineage, render: render };
}));
