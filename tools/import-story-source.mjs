import { writeFile } from "node:fs/promises";

const documentId = "1uQqP1G_oKEoX_XtGNj9Lk5uZgU1KLSf26oC_iCqOvp4";
const documentUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
const outputPath = new URL("../src/story-source.js", import.meta.url);

const storyDefinitions = [
  { id: "main-1-0", type: "main", version: "1.0", versionLabel: "1.0", label: "1.0｜主線｜異界的來訪者", min: 40000, end: "1.1｜主線｜異界的同行者", legacySceneIds: ["signal", "village", "north"] },
  { id: "main-1-1", type: "main", version: "1.1", versionLabel: "1.1", label: "1.1｜主線｜異界的同行者", min: 60000, end: "1.2｜主線｜歸來的遺構", legacySceneIds: ["stage", "pickup", "echo"] },
  { id: "main-1-2", type: "main", version: "1.2", versionLabel: "1.2", label: "1.2｜主線｜歸來的遺構", min: 77000, end: "1.3｜主線｜無名的水位", legacySceneIds: ["measure", "bridge", "ruin"] },
  { id: "main-1-3", type: "main", version: "1.3", versionLabel: "1.3", label: "1.3｜主線｜無名的水位", min: 93000, end: "1.4｜主線｜另一岸也有黎明", legacySceneIds: ["harbor", "field", "tide"] },
  { id: "main-1-4", type: "main", version: "1.4", versionLabel: "1.4", label: "1.4｜主線｜另一岸也有黎明", min: 108000, end: "1.5｜主線｜把路留給明天", legacySceneIds: ["bell", "calibration", "shore"] },
  { id: "main-1-5", type: "main", version: "1.5", versionLabel: "1.5", label: "1.5｜主線｜把路留給明天", min: 122000, end: "1.0–1.1｜支線｜第十三把椅子與今天不排練", legacySceneIds: ["archive", "blank", "index"] },
  { id: "side-1-0-village", type: "side", version: "1.0", versionLabel: "1.0–1.1", label: "1.0–1.1｜支線｜第十三把椅子與今天不排練", min: 137000, end: "1.2–1.3｜支線｜獵人歸林與雨停以前", legacySceneIds: ["patrol", "clinic", "hunt"] },
  { id: "side-1-2-water", type: "side", version: "1.2", versionLabel: "1.2–1.3", label: "1.2–1.3｜支線｜獵人歸林與雨停以前", min: 141000, end: "1.4–1.5｜支線｜給昨天的妳與下一次敲門", legacySceneIds: ["draft", "flow", "cross"] },
  { id: "side-1-4-bell", type: "side", version: "1.4", versionLabel: "1.4–1.5", label: "1.4–1.5｜支線｜給昨天的妳與下一次敲門", min: 144000, end: "00｜設定與製作總頁", legacySceneIds: ["tools", "night", "mark"] },
  { id: "main-2.0", type: "main", version: "2.0", versionLabel: "2.0", label: "2.0｜主線｜潮汐之外仍有人", min: 175000, end: "2.0–2.1｜支線｜藍燈不滅與未寄出的回聲", legacySceneIds: ["library-arrival", "tide-map", "no-address"] },
  { id: "side-2.0-library", type: "side", version: "2.0", versionLabel: "2.0–2.1", label: "2.0–2.1｜支線｜藍燈不滅與未寄出的回聲", min: 182000, end: "2.1｜主線｜鏡中的名字", legacySceneIds: ["borrow", "lighthouse-letter", "margin"] },
  { id: "main-2.1", type: "main", version: "2.1", versionLabel: "2.1", label: "2.1｜主線｜鏡中的名字", min: 184000, end: "2.2｜主線｜斷線之下仍有潮聲", legacySceneIds: ["mirror-shore", "split-reply", "return-sentence"], missingInDocument: true },
  { id: "main-2.2", type: "main", version: "2.2", versionLabel: "2.2", label: "2.2｜主線｜斷線之下仍有潮聲", min: 187800, end: "2.2–2.3｜支線｜空船的乘客與風箏不替人回信", legacySceneIds: ["deep-line", "pressure-signal", "handover-depth"] },
  { id: "side-2.2-deep", type: "side", version: "2.2", versionLabel: "2.2–2.3", label: "2.2–2.3｜支線｜空船的乘客與風箏不替人回信", min: 191000, end: "2.3｜主線｜雲脊之上的地址", legacySceneIds: ["rope", "repair-turn", "surface"] },
  { id: "main-2.3", type: "main", version: "2.3", versionLabel: "2.3", label: "2.3｜主線｜雲脊之上的地址", min: 193000, end: "2.4｜主線｜霧鏡議庭", legacySceneIds: ["wind-columns", "cloud-address", "highland-return"] },
  { id: "main-2.4", type: "main", version: "2.4", versionLabel: "2.4", label: "2.4｜主線｜霧鏡議庭", min: 196400, end: "2.4–2.5｜支線｜見證人的空白", legacySceneIds: ["court-map", "witness-page", "public-record"] },
  { id: "side-2.4-witness", type: "side", version: "2.4", versionLabel: "2.4–2.5", label: "2.4–2.5｜支線｜見證人的空白", min: 198700, end: "2.5｜主線｜潮眼之後", legacySceneIds: ["half-sentence", "repair-mark", "empty-card"] },
  // 文件在 2.5 主線後仍保留了一份 2.4–2.5 支線與第三大版本圖鑑的備份，
  // 這裡要在支線標題處截斷，不能一路讀到 3.0，否則主線閱讀器會混入別章內容。
  { id: "main-2.5", type: "main", version: "2.5", versionLabel: "2.5", label: "2.5｜主線｜潮眼之後", min: 200000, end: "2.4–2.5｜支線｜見證人的空白", legacySceneIds: ["tide-eye", "eight-keys", "after-tide"] }
];

const fallback21Scenes = [
  {
    title: "序幕｜鏡潮島的第二個名字",
    body: "【時間線｜第145日清晨至第148日午後｜白帆岬外海・鏡潮島】\n\n潮汐書庫的方格圖抵達白帆岬後，海面連續三天在同一個位置反射出兩座島。璃珊把較亮的一座標成鏡潮島，較暗的一座沒有名字；她不願意把沒有回覆的地形直接歸入已知航線。\n\n伊芙琳用圓鏡照向海面，鏡裡出現一串被折斷的姓名。每個名字只出現一半，像有人正在說話，卻被另一個版本搶先完成。瑟蕾雅把航線停在島外，先把「可以靠近、暫緩靠近、拒絕靠近」三個選項送上岸，等島上的燈自己回應。"
  },
  {
    title: "第一幕｜同一個人，兩份回覆",
    body: "【時間線｜第149日至第151日｜鏡潮島東岸】\n\n島上的居民把回覆寫在能反光的薄片上。白天的薄片說可以，夜裡的薄片卻說還沒決定；管理台把兩份內容疊在一起，只留下最方便行動的那一句。\n\n伊芙琳要求停止自動合併，請每個人親自指出哪一句屬於自己。有人承認白天只是答應收水，並沒有答應開放住址；有人想保留舊名字，有人想換一個名字重新開始。諾芮亞還沒來到議庭，但她留下的見證格式已經被璃珊抄在島上的黑板上：原聲、推測、未知，不准用一欄冒充另一欄。\n\n雷恩在島外發現第二條退路，瑟蕾雅卻沒有把它畫成通往島內的入口。她說，知道怎麼進去，不代表已經得到進去的許可。"
  },
  {
    title: "第二幕｜把折光交回本人",
    body: "【時間線｜第152日至第154日｜鏡潮島中央回聲台】\n\n鏡潮島的中央回聲台要求隊伍選出一個「真正版本」，才能解除折光。瑟蕾雅把所有薄片攤開，讓居民看見互相衝突的回答；她拒絕替大家投票，也拒絕把暫緩的人數算成同意。\n\n一名年輕居民把兩片薄片都收回，只留下第三片空白。他說自己不是在兩個答案中選一個，而是想先知道如果選擇會影響誰。伊芙琳將這句話原樣放入回聲台，折光因此沒有消失，卻不再偷偷替人刪掉疑問。\n\n璃珊把潮圖的所有權改成共同維護，並在邊角留出撤回時間。島上的燈逐一降低亮度，表示它們不再等待一個中央命令，而是在等待每個人自己決定何時回覆。"
  },
  {
    id: "name-arrival",
    title: "終幕｜名字可以晚一點抵達",
    body: "【時間線｜第155日至第156日｜鏡潮島西岸】\n\n鏡潮島最後送出的不是一個新地址，而是一張只寫著「還在這裡」的卡片。卡片沒有署名，卻附上可撤回的回航時間。瑟蕾雅把它放進公共檔案，不把沒有名字理解成遺失。\n\n伊芙琳將圓鏡交回島上的回聲台，璃珊則把兩座反射島分別標成已確認與待本人命名。隊伍離岸時，海面仍然同時映出兩條路；不同的是，這一次沒有人要求它們只能剩下一條。\n\n瑟蕾雅在航海簿最後一頁寫下：名字不是抵達的入場券，能否自己改口才是。下一條向下的潮線在遠方亮起，兩短一長，像有人終於準備好讓他們聽見。"
  }
];

function findAfter(text, marker, minimum) {
  const position = text.indexOf(marker, minimum);
  if (position < 0) throw new Error(`找不到文件分頁：${marker}`);
  return position;
}

function cleanBody(value, label) {
  let body = value.replace(/\r\n/g, "\n");
  const repeatedTitle = new RegExp(`^\\s*(?:經驗ㄐ)?${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "u");
 body = body.replace(repeatedTitle, "");
  // 00 設定頁在主線後附有「待確認」備份索引；它不是正文，不能讓它進入閱讀器。
  body = body.replace(/\n\s*附錄｜[\s\S]*$/u, "");
 return body.trim();
}

function makeSlug(value) {
  return value.replace(/[【】\[\]（）()：:，。、“”「」『』・\s]+/gu, "-").replace(/^-|-$/g, "").toLowerCase();
}

function parseScenes(body, definition) {
  const lines = body.split("\n");
  const heading = /^(?:序幕|終幕|終節|尾聲|最後一盞燈|最後一頁|第[一二三四五六七八九十]+幕|第[一二三四五六七八九十]+節)(?:｜.*)?$/u;
  const points = [];
  lines.forEach((line, index) => { if (heading.test(line.trim())) points.push(index); });
  if (!points.length) return [{ id: `${definition.id}-source-1`, title: "正文", body: body.trim() }];
  return points.map((start, index) => {
    const end = index + 1 < points.length ? points[index + 1] : lines.length;
    const title = lines[start].trim();
    const sectionBody = lines.slice(start + 1, end).join("\n").trim();
    return {
      id: definition.legacySceneIds[index] || `${definition.id}-source-${String(index + 1).padStart(2, "0")}-${makeSlug(title)}`,
      title: title,
      body: sectionBody || "（本幕正文待補充。）"
    };
  });
}

function normalizeSceneList(definition, body) {
  return parseScenes(body, definition).map((scene) => ({
    id: scene.id,
    title: scene.title,
    body: scene.body.replace(/\n{3,}/g, "\n\n")
  }));
}

const response = await fetch(documentUrl);
if (!response.ok) throw new Error(`文件讀取失敗：${response.status}`);
const documentText = await response.text();

const chapters = {};
for (const definition of storyDefinitions) {
  if (definition.missingInDocument) {
    chapters[definition.id] = {
      sourceLabel: definition.label,
      sourceStatus: "document-tab-missing",
      fullBody: fallback21Scenes.map((scene) => `${scene.title}\n${scene.body}`).join("\n\n"),
      scenes: fallback21Scenes.map((scene, index) => ({ id: definition.legacySceneIds[index], title: scene.title, body: scene.body }))
    };
    continue;
  }
  const start = findAfter(documentText, definition.label, definition.min);
  const end = definition.end ? findAfter(documentText, definition.end, start + definition.label.length) : documentText.length;
  const body = cleanBody(documentText.slice(start + definition.label.length, end), definition.label);
  const scenes = normalizeSceneList(definition, body);
  chapters[definition.id] = {
    sourceLabel: definition.label,
    sourceStatus: "document",
    fullBody: body,
    scenes
  };
}

const serialized = JSON.stringify({
  documentId,
  importedAt: new Date().toISOString(),
  sourceNote: "由 Google 文件公開匯出內容整理；2.1 分頁在來源中只有標題並混入 2.2 正文，因此以承接劇情補齊遊戲閱讀內容。",
  chapters
}, null, 2);

const output = `/* Generated from the Starship story document. Do not edit the generated payload by hand. */\n(function (root, factory) {\n  if (typeof module === "object" && module.exports) module.exports = factory();\n  else root.StarshipStorySource = factory();\n}(typeof globalThis !== "undefined" ? globalThis : this, function () {\n  return ${serialized};\n}));\n`;

await writeFile(outputPath, output, "utf8");
console.log(`已匯入 ${Object.keys(chapters).length} 個劇情分頁，輸出 ${outputPath.pathname}`);
for (const [id, chapter] of Object.entries(chapters)) console.log(`${id}: ${chapter.scenes.length} 幕 / ${chapter.fullBody.length} 字 / ${chapter.sourceStatus}`);
