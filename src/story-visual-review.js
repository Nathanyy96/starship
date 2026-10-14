/* Reviewed story artwork shared by the public reader and author preview. */
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
    "./assets/story/1-1-06.webp": { src: "./assets/story/review/1-1-06-borrowed-stage.webp", caption: "霧橋鎮｜借一只小鼓與四張椅子，四人以能用的器材完成短演。" },
    "./assets/story/1-0-08.webp": { src: "./assets/story/review/1-0-08-retreat-v2.webp", caption: "雷恩拉住後襟，兩人退到翻倒木車後；先重新約定站位，再接應引獸。" },
    "./assets/story/1-0-20.webp": { src: "./assets/story/review/1-0-20-mila-v2.webp", caption: "米菈沿梁面爬向搬運台；保留正式立繪的赤褐辮髮、青綠工作圍裙與短披肩。" },
    "./assets/story/1-0-16.webp": { src: "./assets/story/review/1-0-16-kailin-v2.webp", caption: "凱琳在警戒繩外帶路；米菈與老瓦克在後方工坊工作。" },
    "./assets/story/1-1-03.webp": { src: "./assets/story/review/1-1-03-shared-map-v2.webp", caption: "近岸重新攤圖；芮妲與榆安仍在窄水對面的遠岸等候。" },
    "./assets/story/1-1-04.webp": { src: "./assets/story/review/1-1-04-medicine-v2.webp", caption: "折影獸倒下後，榆安先過岸交出急用藥；救援員隨後接芮妲與能帶回的器材。" },
    "./assets/story/1-1-05.webp": { src: "./assets/story/review/1-1-spatial-battle.webp", caption: "上游合戰｜牽制真身、破開浮甲、擊向頸後核心；六人合作擊敗製造錯位的折影獸。" }
  };
  var additions = [
    { chapter: "main-1-1", act: 3, anchor: "裡頭伏著一頭比馬車還大的魔物", src: "./assets/story/review/1-1-spatial-source.webp", caption: "上游源頭｜折影獸的浮甲與頸光造成局部假路；眾人離開居民所在的渡口，找到了魔物。" },
    { chapter: "main-1-0", act: 1, anchor: "祭壇後方是一片靠著山壁的空石地", src: "./assets/story/review/1-0-29-altar-overview.webp", caption: "舊祭壇全貌｜低牆後是空石地；另一側石路通往谷口與商道。斷柱可供換位，後方沒有第二條出口。" },
    { chapter: "main-1-0", act: 4, anchor: "牠撞翻空木車", src: "./assets/story/review/1-0-30-street-overview.webp", caption: "工坊街口全貌｜木車已翻在交會處；左側空街供引獸，右側廣場供居民撤離，涵道口在工坊牆根。" },
    { chapter: "main-1-0", act: 5, anchor: "雷恩把帶來的食物放到桌上", src: "./assets/story/review/1-0-27-vark-visit.webp", caption: "休養處｜看望老瓦克，留下一份食物，等他把話慢慢說完。" },
    { chapter: "main-1-0", act: 5, anchor: "她把道歉說完整", src: "./assets/story/review/1-0-28-window-talk.webp", caption: "旅店窗邊｜雷恩整理繩箭，瑟蕾雅說出道歉，也聽他說自己會怕。" },
    {"chapter":"main-1-1","act":1,"anchor":"Chodan拿帳篷布遮住屋簷缺口","src":"./assets/story/review/1-1-road-shelter.webp","caption":"商路雨棚｜Chodan 遮住漏雨屋簷，Magenta 翻麵粉袋；瑟蕾雅收起行程表，一起搬袋。"},
    {"chapter":"main-1-1","act":1,"anchor":"紙條寫的是：山腰驛站風標失準","src":"./assets/story/review/1-1-mistbridge-letter.webp","caption":"霧橋鎮｜雨暮讀到 Hina 留信；通往山腰的路沿已崩，當晚先留宿。"},
    {"chapter":"main-1-1","act":1,"anchor":"樹梢向北，腳邊的草卻向南倒","src":"./assets/story/review/1-1-opposing-wind.webp","caption":"上山途中｜樹梢與腳邊草向相反方向倒；雷恩用短枝觀察，瑟蕾雅暫留地圖空白。"},
    {"chapter":"main-1-1","act":2,"anchor":"牠沒有吼，也沒有追人","src":"./assets/story/review/1-1-blackcrystal-detour.webp","caption":"坡背岔路｜黑晶巨獸在兩條石道間試探後退回林裡；眾人留在背風處，沒有追擊。"},
    {"chapter":"main-1-1","act":2,"anchor":"天黑後，兩岸用燈與短聲清點人數","src":"./assets/story/review/1-1-banks-night.webp","caption":"當晚兩岸全貌｜近岸棚照看撤出居民；遠岸芮妲、榆安與兩名居民回燈，南側另有接應隊，當晚不渡。"},
    {"chapter":"main-1-1","act":5,"anchor":"回霧橋的路走得很慢","src":"./assets/story/review/1-1-return-rest.webp","caption":"普通山路返鎮｜救援後休整一夜再出發；榆安腳傷需停歇，Hina 坐下休息，眾人慢行。"},
    {"chapter":"main-1-1","act":5,"anchor":"Chodan把鼓棒放到了桌上","src":"./assets/story/review/1-1-rehearsal-stop.webp","caption":"旅店後廳｜排練失序後先停下；放下鼓棒、晾開濕接頭，聽彼此說完，不急著恢復原樣。"},
    {"chapter":"main-1-1","act":5,"anchor":"鎮口貼出一張斷橋告示","src":"./assets/story/review/1-1-bridge-notice.webp","caption":"翌晨鎮口｜斷橋告示只確認封路與臨時繞行；橋北消息仍待驛報，瑟蕾雅不先畫安全線。"},
    { chapter: "main-1-0", act: 3, anchor: "諾亞斯將一張量測圖放到桌上", src: "./assets/story/review/1-0-26-observers.webp", caption: "觀測分會｜賽芙拉記錄經過，諾亞斯展示量測圖，瑟蕾雅與雷恩一起核對。" },
    { chapter: "main-1-1", act: 1, anchor: "站長岑霧正重新掛好回程牌", src: "./assets/story/review/1-1-07-waystation.webp", caption: "山腰驛站｜岑霧掛回程牌，Hina 整理風向木片。" }
  ];
  additions.forEach(function (item) {
    if (item.chapter === "main-1-0" && [6, 7, 10].indexOf(item.sequence) >= 0) item.essential = true;
  });
  function imagesFor(chapter, baseImages) {
    return (baseImages || []).map(function (item) { return Object.assign({}, item, corrections[item.src] || {}); })
      .concat(additions.filter(function (item) { return item.chapter === chapter; }));
  }
  return { status: "approved-current-story", portraits: portraits, corrections: corrections, additions: additions, imagesFor: imagesFor };
}));
