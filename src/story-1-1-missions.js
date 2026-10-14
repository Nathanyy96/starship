(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipStory11Missions = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Candidate mission rules. Public completion and rewards remain disabled until release review.
  var acts = [
  {
    "title": "行前核對",
    "steps": [
      {
        "prompt": "北行物資缺少乾繩，應如何出發？",
        "choices": [
          "照原時刻出發",
          "先借用或購買乾繩並核對藥品",
          "夜路趕到霧橋"
        ],
        "answer": 1,
        "fact": "乾繩與藥品已核對。"
      },
      {
        "prompt": "白鐘至霧橋的行程如何記錄？",
        "choices": [
          "三日商路與安全宿營點",
          "一夜捷徑",
          "界痕直接抵達"
        ],
        "answer": 0,
        "fact": "依三日商路行進。"
      }
    ]
  },
  {
    "title": "兩岸清點",
    "steps": [
      {
        "prompt": "Siyeon 已在近岸與 QWER 重聚；遠岸名冊如何標記？",
        "choices": [
          "把兩岸都記成安全可通",
          "分列近岸與遠岸人員、急藥及接應",
          "先讓榆安試渡"
        ],
        "answer": 1,
        "fact": "兩岸人員與急藥已分列。"
      },
      {
        "prompt": "通路看似完整，卻無法抵達對岸，應如何處理？",
        "choices": [
          "安置兩岸人員，留待白天尋找異常源頭",
          "讓榆安試走",
          "只要聽到回聲就渡過"
        ],
        "answer": 0,
        "fact": "兩岸人員安置完成，開始尋找錯位源頭。"
      }
    ]
  },
  {
    "title": "追查折影獸",
    "steps": [
      {
        "prompt": "溪邊三爪灰粉與黑棘幼獸指向什麼？",
        "choices": [
          "每天都會新開裂隙",
          "被召喚的小魔物，須追查召喚源頭",
          "所有黑晶獸都是同一隻"
        ],
        "answer": 1,
        "fact": "確認幼獸與空間源頭的關係。"
      },
      {
        "prompt": "在哪裡與折影獸交戰？",
        "choices": [
          "讓居民在渡口一起參戰",
          "將居民留在安全處，從上游石坡接近",
          "讓傷者試走假路"
        ],
        "answer": 1,
        "fact": "戰場與受困居民分開。"
      },
      {
        "prompt": "怎樣攻擊折影獸？",
        "choices": [
          "辨認真身、合作破甲，再擊頸後核心",
          "獨自衝進假路",
          "只靠數拍子讓道路恢復"
        ],
        "answer": 0,
        "fact": "六人分工，準備破甲與核心合擊。"
      }
    ]
  },
  {
    "title": "合戰與撤離",
    "steps": [
      {
        "prompt": "魔物攻向後排時，如何接應？",
        "choices": [
          "追逐所有假影",
          "守住真路，掩護同伴，合力牽制",
          "讓傷者引走魔物"
        ],
        "answer": 1,
        "fact": "同伴接應，未追入假路。"
      },
      {
        "prompt": "魔物倒下、錯位消退後，下一步？",
        "choices": [
          "直接運整台車",
          "救援員先確認通路，再扶傷者與急藥過岸",
          "等下一輪拍點"
        ],
        "answer": 1,
        "fact": "源頭擊敗，通路確認後撤離。"
      },
      {
        "prompt": "魔物倒下是否代表損失消失？",
        "choices": [
          "所有器材自動恢復",
          "人先撤出，車身與部分樂器留在遠岸，善後另行處理",
          "不再需要點名"
        ],
        "answer": 1,
        "fact": "人員撤出，車身與部分樂器留在遠岸。"
      }
    ]
  },
  {
    "title": "善後與聯絡",
    "steps": [
      {
        "prompt": "救援後的損失與責任如何交班？",
        "choices": [
          "短演後視為全部恢復",
          "岑霧核庫存、芮妲估車損、榆安核藥、QWER修繕與留信",
          "把車費與藥品留空"
        ],
        "answer": 1,
        "fact": "物資、車損、藥品及修繕已交班。"
      },
      {
        "prompt": "斷橋告示與初步運糧表到了，下一步？",
        "choices": [
          "立即簽完 1.2 踏查",
          "等完整驛報到齊再判斷",
          "宣告北路已恢復"
        ],
        "answer": 1,
        "fact": "1.2 踏查留待完整驛報。"
      }
    ]
  }
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
