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
    { chapter: "main-1-0", act: 3, anchor: "諾亞斯將一張量測圖放到桌上", src: "./assets/story/review/1-0-26-observers.webp", caption: "觀測分會｜賽芙拉記錄經過，諾亞斯展示量測圖，瑟蕾雅與雷恩一起核對。" },
    { chapter: "main-1-1", act: 1, anchor: "站長岑霧正重新掛好回程牌", src: "./assets/story/review/1-1-07-waystation.webp", caption: "山腰驛站｜岑霧掛回程牌，Hina 整理風向木片。" }
  ];
  function imagesFor(chapter, baseImages) {
    return (baseImages || []).map(function (item) { return Object.assign({}, item, corrections[item.src] || {}); })
      .concat(additions.filter(function (item) { return item.chapter === chapter; }));
  }
  return { status: "author-review-for-1.1", portraits: portraits, corrections: corrections, additions: additions, imagesFor: imagesFor };
}));
