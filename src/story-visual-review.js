/* Author review artwork. Publish with the approved 1.1 reader, not the current public reader. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipStoryVisualReview = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var portraits = [
    { chapter: "main-1-0", act: 3, anchor: "賽芙拉讀完伊薩爾的短箋", id: "seifra", name: "賽芙拉", role: "白鐘城觀測分會負責人", src: "./assets/story-characters/seifra.png" },
    { chapter: "main-1-0", act: 3, anchor: "諾亞斯將一張量測圖放到桌上", id: "noyas", name: "諾亞斯", role: "觀測分會技術人員", src: "./assets/story-characters/noyas.png" },
    { chapter: "main-1-0", act: 3, anchor: "凱琳帶瑟蕾雅換了個角度", id: "kailin", name: "凱琳", role: "現地巡守與救援人員", src: "./assets/story-characters/kailin.png" },
    { chapter: "main-1-0", act: 3, anchor: "名叫奧恩的管事正指揮工人", id: "oun", name: "奧恩", role: "工坊管事與維修者", src: "./assets/story-characters/oun.png" },
    { chapter: "main-1-0", act: 3, anchor: "米菈立即改走", id: "mila", name: "米菈", role: "工坊學徒", src: "./assets/story-characters/mila.png" },
    { chapter: "main-1-0", act: 3, anchor: "附近的老瓦克聽見", id: "vark", name: "老瓦克", role: "工坊老匠人", src: "./assets/story-characters/vark.png" },
    { chapter: "main-1-1", act: 1, anchor: "站長岑霧正重新掛好回程牌", id: "cenwu", name: "岑霧", role: "山腰驛站站長", src: "./assets/cards/cenwu.png" },
    { chapter: "main-1-1", act: 1, anchor: "Hina坐在最外一桶旁", id: "hina", name: "Hina", role: "QWER 樂手｜吉他手", src: "./assets/cards/hina.png" },
    { chapter: "main-1-1", act: 2, anchor: "Siyeon正在核對名字", id: "siyeon", name: "Siyeon", role: "QWER 樂手｜在近岸照看居民", src: "./assets/cards/siyeon.png" },
    { chapter: "main-1-1", act: 2, anchor: "「是車夫芮妲。」", id: "ruida", name: "芮妲", role: "迴音谷車夫｜此時仍在遠岸", src: "./assets/cards/ruida.png" },
    { chapter: "main-1-1", act: 2, anchor: "扭傷腳踝的藥師榆安", id: "yuan", name: "榆安", role: "隨車藥師｜此時仍在遠岸", src: "./assets/cards/yuan.png" }
  ];
  var corrections = {
    "./assets/story/1-0-16.webp": { src: "./assets/story/review/1-0-16-kailin-v2.webp", caption: "凱琳在警戒繩外帶路；米菈與老瓦克在後方工坊工作。" },
    "./assets/story/1-1-03.webp": { src: "./assets/story/review/1-1-03-shared-map-v2.webp", caption: "近岸重新攤圖；芮妲與榆安仍在窄水對面的遠岸等候。" },
    "./assets/story/1-1-04.webp": { src: "./assets/story/review/1-1-04-medicine-v2.webp", caption: "榆安已到近岸，將急用藥交給同岸驛員；芮妲與車仍在遠岸。" },
    "./assets/story/1-1-05.webp": { src: "./assets/story/review/1-1-05-stop-v2.webp", caption: "Hina 舉起紅片停手；苔角行獸擾動遠岸輔錨後，兩岸重新複核。" }
  };
  var additions = [
    {"chapter":"main-1-0","act":4,"anchor":"卸貨廊原本從外側吊架直通地面內廊","src":"./assets/story/review/1-0-rescue-01.webp","caption":"救援動作 01｜外側吊架、中央搬運台與內側受困平台；側道與翹起的踏板已不可靠。","sequence":1},
    {"chapter":"main-1-0","act":4,"anchor":"右手抓住牆邊凸起的鐵件","src":"./assets/story/review/1-0-rescue-02.webp","caption":"救援動作 02｜側道突然閉合，瑟蕾雅抓住鐵件；星標只能暫時穩住一個磚角。","sequence":2},
    {"chapter":"main-1-0","act":4,"anchor":"用力把人拽出","src":"./assets/story/review/1-0-rescue-03.webp","caption":"救援動作 03｜雷恩送繩接應，Chodan 抓住手腕，合力將瑟蕾雅拉回外側。","sequence":3},
    {"chapter":"main-1-0","act":4,"anchor":"將能固定的齒輪先卡住","src":"./assets/story/review/1-0-rescue-04.webp","caption":"救援動作 04｜奧恩與工人以長柄、止動楔控制機輪，不能直接拆掉承重機座。","sequence":4},
    {"chapter":"main-1-0","act":4,"anchor":"米菈敲回兩下。","src":"./assets/story/review/1-0-rescue-05.webp","caption":"救援動作 05｜先確認訊號：兩下短音可以動，一下長音停下抓牢；米菈回敲確認。","sequence":5},
    {"chapter":"main-1-0","act":4,"anchor":"第二次拉緊，柱邊的繩形才穩住","src":"./assets/story/review/1-0-rescue-06.webp","caption":"救援動作 06｜箭繩送引繩，粗繩繞內柱承重；外側主繩固定於吊架，另加石座保險繩。","sequence":6},
    {"chapter":"main-1-0","act":4,"anchor":"奧恩試過受力，才讓所有人退開","src":"./assets/story/review/1-0-rescue-07.webp","caption":"救援動作 07｜兩根橫木接住搬運台邊，跨過一步多寬的空槽；檢查受力後才准通行。","sequence":7},
    {"chapter":"main-1-0","act":4,"anchor":"眼看一道牆影從兩步外掠過","src":"./assets/story/review/1-0-rescue-08.webp","caption":"救援動作 08｜聽到長音，米菈抓牢粗繩、瑟蕾雅伏低，等牆影移過才繼續。","sequence":8},
    {"chapter":"main-1-0","act":4,"anchor":"沒有為了求快拆掉那塊夾板","src":"./assets/story/review/1-0-rescue-09.webp","caption":"救援動作 09｜繩帶從老瓦克背後穿過，分擔重量；保留右腿夾板，不能硬彎傷腿。","sequence":9},
    {"chapter":"main-1-0","act":4,"anchor":"替瑟蕾雅與Chodan接過繩帶","src":"./assets/story/review/1-0-rescue-10.webp","caption":"救援動作 10｜工人將搬運台分段靠近內側，雷恩接過繩帶，老瓦克慢慢移上台面。","sequence":10},
    {"chapter":"main-1-0","act":4,"anchor":"定住將要翻起的木條","src":"./assets/story/review/1-0-rescue-11.webp","caption":"救援動作 11｜平台傾斜時先交出老人重量、換邊；外側分擔拉力，星標只穩住木條接點。","sequence":11},
    {"chapter":"main-1-0","act":4,"anchor":"她的手轉了方向，抓住他的肩帶","src":"./assets/story/review/1-0-rescue-12.webp","caption":"救援動作 12｜橫木被扯歪，瑟蕾雅改抓雷恩的肩帶，放棄滑向台邊的量測工具箱。","sequence":12},
    {"chapter":"main-1-0","act":4,"anchor":"「明天先睡。」","src":"./assets/story/review/1-0-rescue-13.webp","caption":"救援動作 13｜撤到警戒線外，老瓦克安置於鋪布的門板上，奧恩扶住疲憊的米菈。","sequence":13},
    { chapter: "main-1-0", act: 3, anchor: "諾亞斯將一張量測圖放到桌上", src: "./assets/story/review/1-0-26-observers.webp", caption: "觀測分會｜賽芙拉記錄經過，諾亞斯展示量測圖，瑟蕾雅與雷恩一起核對。" },
    { chapter: "main-1-1", act: 1, anchor: "站長岑霧正重新掛好回程牌", src: "./assets/story/review/1-1-07-waystation.webp", caption: "山腰驛站｜岑霧掛回程牌，Hina 整理風向木片。" }
  ];
  function imagesFor(chapter, baseImages) {
    return (baseImages || []).map(function (item) { return Object.assign({}, item, corrections[item.src] || {}); })
      .concat(additions.filter(function (item) { return item.chapter === chapter; }));
  }
  return { status: "author-review-for-1.1", portraits: portraits, corrections: corrections, additions: additions, imagesFor: imagesFor };
}));
