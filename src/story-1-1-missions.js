(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipStory11Missions = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Candidate mission rules. Public completion and rewards remain disabled until release review.
  var acts = [
    { title: "行前核對", steps: [
      { prompt: "北行物資缺少乾繩，應如何出發？", choices: ["照原時刻出發", "先借用或購買乾繩並核對藥品", "夜路趕到霧橋"], answer: 1, fact: "乾繩與藥品已核對。" },
      { prompt: "白鐘至霧橋的行程如何記錄？", choices: ["三日商路與安全宿營點", "一夜捷徑", "界痕直接抵達"], answer: 0, fact: "依三日商路行進。" }
    ] },
    { title: "兩岸清點", steps: [
      { prompt: "Siyeon 已在近岸與 QWER 重聚；遠岸名冊如何標記？", choices: ["把兩岸都記成安全可通", "分列近岸與遠岸人員、急藥及接應", "先讓榆安試渡"], answer: 1, fact: "兩岸人員與急藥已分列。" },
      { prompt: "兩岸燈號可以證明什麼？", choices: ["可以互認，但不能證明承重安全", "已能搬運車身", "可以不測試直接渡過"], answer: 0, fact: "互認與承重分開記錄。" }
    ] },
    { title: "測線與停止演練", steps: [
      { prompt: "先測哪一段？", choices: ["整座谷地", "已看見的短段，先做空載繩測試", "讓傷者先試路"], answer: 1, fact: "空載短段通過。" },
      { prompt: "空載後如何確認承重？", choices: ["只聽回聲", "輕載並做撤回測試", "直接運整台車"], answer: 1, fact: "輕載與撤回已測。" },
      { prompt: "交付救援隊前還須核對什麼？", choices: ["停止信號、兩岸人數與主錨", "演出節拍", "未測區的最快路線"], answer: 0, fact: "救援卡只標已測短段、不可走區與停止信號。" }
    ] },
    { title: "有限撤離", steps: [
      { prompt: "第一批應送什麼？", choices: ["整台樂器車", "水與固定腳踝材料，確認可撤回", "先追逐苔角行獸"], answer: 1, fact: "水與固定材料已送達。" },
      { prompt: "風線改變時怎麼處理？", choices: ["繼續加速", "停手退到已測踏點，重核燈號、人數與主錨", "讓傷者試新路"], answer: 1, fact: "停手與複核完成。" },
      { prompt: "撤離次序與受驚生物怎麼處理？", choices: ["先搬車身再救人", "分批撤榆安與居民、急藥隨人；芮妲最後撤，暫停低音讓出獸徑", "擊殺生物後忽略承重"], answer: 1, fact: "人員撤出，車身與部分樂器留在遠岸。" }
    ] },
    { title: "善後與聯絡", steps: [
      { prompt: "救援後的損失與責任如何交班？", choices: ["短演後視為全部恢復", "岑霧核庫存、芮妲估車損、榆安核藥、QWER修繕與留信", "把車費與藥品留空"], answer: 1, fact: "物資、車損、藥品及修繕已交班。" },
      { prompt: "斷橋告示與初步運糧表到了，下一步？", choices: ["立即簽完 1.2 踏查", "等完整驛報到齊再判斷", "宣告北路已恢復"], answer: 1, fact: "1.2 踏查留待完整驛報。" }
    ] }
  ];
  function normalize(input) {
    var p = input && typeof input === "object" ? input : {};
    var act = Number.isInteger(p.act) ? Math.max(0, Math.min(acts.length, p.act)) : Number.isInteger(p.step) ? Math.max(0, Math.min(acts.length, p.step)) : 0;
    var step = act < acts.length && Number.isInteger(p.act) && Number.isInteger(p.step) ? Math.max(0, Math.min(acts[act].steps.length - 1, p.step)) : 0;
    return { act: act, step: step, mistakes: Math.max(0, Number(p.mistakes) || 0), facts: Array.isArray(p.facts) ? p.facts.slice(0, 20) : [] };
  }
  function advance(input, choice) {
    var p = normalize(input);
    if (p.act >= acts.length) return { progress: p, correct: false, feedback: "任務已完成，可重看內容。" };
    var current = acts[p.act].steps[p.step];
    if (!Number.isInteger(choice) || choice < 0 || choice >= current.choices.length) throw new Error("請選擇有效選項。");
    if (choice !== current.answer) return { progress: Object.assign({}, p, { mistakes: p.mistakes + 1 }), correct: false, feedback: "未通過安全檢查；保留已確認名冊與步驟，請重試。" };
    p.facts.push(current.fact);
    if (p.step + 1 < acts[p.act].steps.length) p.step += 1;
    else { p.act += 1; p.step = 0; }
    return { progress: p, correct: true, feedback: current.fact };
  }
  return { acts: acts, normalize: normalize, advance: advance };
}));
