from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUT = r"C:\starship\gacha-system\星界之律遊戲設定總覽.docx"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_borders(cell, color="D9D9D9", size="6"):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn("w:" + side))
        if node is None:
            node = OxmlElement("w:" + side)
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_run_font(run, size=None, bold=None, color="000000"):
    run.font.name = "Microsoft JhengHei"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft JhengHei")
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)


def style_paragraph(paragraph, size=10.5, color="20242C", bold=False, space_after=5, line=1.25):
    paragraph.paragraph_format.space_after = Pt(space_after)
    paragraph.paragraph_format.line_spacing = line
    for run in paragraph.runs:
        set_run_font(run, size=size, bold=bold, color=color)


def add_text(doc, text, size=10.5, color="20242C", bold=False, after=5, align=None):
    paragraph = doc.add_paragraph()
    if align is not None:
        paragraph.alignment = align
    run = paragraph.add_run(text)
    set_run_font(run, size=size, bold=bold, color=color)
    paragraph.paragraph_format.space_after = Pt(after)
    paragraph.paragraph_format.line_spacing = 1.3
    return paragraph


def add_heading(doc, text, level=1):
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    run = paragraph.add_run(text)
    size = {1: 18, 2: 13, 3: 11}[level]
    set_run_font(run, size=size, bold=True, color="000000")
    paragraph.paragraph_format.space_before = Pt(12 if level == 1 else 8)
    paragraph.paragraph_format.space_after = Pt(5)
    paragraph.paragraph_format.keep_with_next = True
    return paragraph


def add_bullets(doc, items, level=0):
    for item in items:
        paragraph = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
        run = paragraph.add_run(item)
        set_run_font(run, size=10, color="20242C")
        paragraph.paragraph_format.space_after = Pt(3)
        paragraph.paragraph_format.line_spacing = 1.2


def add_numbered(doc, items):
    for item in items:
        paragraph = doc.add_paragraph(style="List Number")
        run = paragraph.add_run(item)
        set_run_font(run, size=10, color="20242C")
        paragraph.paragraph_format.space_after = Pt(3)
        paragraph.paragraph_format.line_spacing = 1.2


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    header = table.rows[0]
    tr_pr = header._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)
    for index, value in enumerate(headers):
        cell = header.cells[index]
        cell.text = ""
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_shading(cell, "193B63")
        set_cell_borders(cell)
        set_cell_margins(cell)
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = paragraph.add_run(value)
        set_run_font(run, size=9.2, bold=True, color="FFFFFF")
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for col_index, value in enumerate(row):
            cell = cells[col_index]
            cell.text = ""
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_shading(cell, "F4F7FB" if row_index % 2 else "FFFFFF")
            set_cell_borders(cell)
            set_cell_margins(cell)
            paragraph = cell.paragraphs[0]
            run = paragraph.add_run(str(value))
            set_run_font(run, size=9, color="20242C")
            paragraph.paragraph_format.space_after = Pt(1)
            paragraph.paragraph_format.line_spacing = 1.15
    if widths:
        for row in table.rows:
            for index, width in enumerate(widths):
                row.cells[index].width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_page_break(doc):
    doc.add_page_break()


def main():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Inches(0.65)
    section.bottom_margin = Inches(0.6)
    section.left_margin = Inches(0.72)
    section.right_margin = Inches(0.72)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Microsoft JhengHei"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft JhengHei")
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(0x20, 0x24, 0x2C)
    for style_name in ("Heading 1", "Heading 2", "Heading 3", "Title"):
        style = styles[style_name]
        style.font.name = "Microsoft JhengHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft JhengHei")
        style.font.color.rgb = RGBColor(0, 0, 0)

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer_run = footer.add_run("星界之律 2.0–2.5  設定總覽")
    set_run_font(footer_run, size=8, color="6D7684")

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title_run = title.add_run("星界之律遊戲設定總覽")
    set_run_font(title_run, size=25, bold=True, color="000000")
    title.paragraph_format.space_after = Pt(4)
    subtitle = doc.add_paragraph()
    subtitle_run = subtitle.add_run("玩家版本 2.0–2.5  規則 內容與後續版本規劃")
    set_run_font(subtitle_run, size=11, bold=True, color="3B5C82")
    subtitle.paragraph_format.space_after = Pt(12)
    add_text(doc, "本文件是目前遊戲程式的單一規則總覽，供製作、測試、部署與後續版本維護使用。現行玩家內容開放至 2.5；3.0–4.5 的內容已整理完成但維持鎖定。任何數值或開放狀態調整，都應同步檢查 src/data.js、玩家介面與測試。", size=10.8, after=10)

    add_heading(doc, "版本摘要", 1)
    add_table(doc, ["項目", "目前設定", "狀態"], [
        ["玩家入口", "先登入，再進入星界之律大廳", "已完成"],
        ["劇情", "主線與支線 1.0–2.5，共 18 章，每章 3 幕", "開放"],
        ["角色卡池", "1.0–1.5 舊限定池、2.0–2.5 潮眼限定池、1.0–2.5 常駐池", "開放"],
        ["星界試煉", "30 關，最多 4 人，自走棋式自動戰鬥", "本次更新重置"],
        ["Boss 突破", "6 種 Boss；角色 80 等後取得指定材料，突破至 90 等", "新增玩法"],
        ["星港委託", "3 份短篇戰鬥任務，每版本各完成一次", "新增玩法"],
        ["後續內容", "3.0–4.5 劇情、角色、敵人與數值", "已建檔並鎖定"],
    ], widths=[1.35, 4.15, 1.1])

    add_heading(doc, "大更新獎勵", 2)
    add_text(doc, "版本標記為 2.0-2.5。伺服器在玩家建立帳號或登入時檢查 updateRewards.claimedVersions，只要該帳號尚未領取本版本，就加入 3,200 星砂並寫入領取時間。新帳號與舊帳號使用同一套邏輯，因此不會因為建立時間不同而漏領或重複領取。試煉獎勵次數與 Boss 挑戰紀錄按版本重置，但玩家角色、等級、命座、突破狀態與已取得的突破材料不重置。", after=4)
    add_bullets(doc, [
        "試煉版本、清除紀錄、最佳關卡、每關獎勵次數和上次戰報在本次更新一併重置。",
        "星港委託的完成紀錄也以 2.0-2.5 為版本鍵，下次版本更新時清空。",
        "Boss 每個版本重新計算成功獎勵次數；已取得的材料與角色突破狀態跨版本保留。",
        "前端本機存檔模式也執行相同的一次性檢查；正式玩家資料以後端為準。",
    ])

    add_page_break(doc)
    add_heading(doc, "抽卡規則", 1)
    add_text(doc, "抽卡核心由 src/gacha.js 統一提供給瀏覽器、Node 伺服器與測試使用。十連只是逐格執行十次單抽判定，不會把保底或 4★ 結果藏到最後一格。", after=7)
    add_table(doc, ["判定位置", "4★機率", "說明"], [
        ["第 1–20 抽", "0%", "前 20 抽不會提早出現 4★"],
        ["第 21 抽", "10%", "開始進入提升區間"],
        ["第 22–49 抽", "每抽 +4 個百分點", "第 49 抽最多顯示 99%"],
        ["第 50 抽", "100%", "硬保底，必定 4★"],
        ["4★內部判定", "精選 55%／其他 45%", "僅限定池使用，歪掉後下一張 4★ 保證精選"],
        ["非 4★結果", "三星 20%／一般回響 80%", "三星直接從該卡池的文件角色清單抽取"],
        ["額外星砂", "8%", "單格另掉落 40 星砂，不改變角色判定"],
    ], widths=[1.35, 1.55, 3.7])

    add_heading(doc, "目前卡池", 2)
    add_table(doc, ["卡池", "精選與範圍", "保底計數"], [
        ["限定 1.0–1.5", "文件 1.0–1.5 的 4★可選一名；三星為 1.0–1.5", "limited"],
        ["限定 2.0–2.5", "璃珊、曜澤、伊芙琳、澪歌、菲芮、諾芮亞、奧薇拉可選一名；三星為 1.0–2.5", "與限定共用 limited"],
        ["常駐回音", "目前已開放的 1.0–2.5 角色；沒有精選", "standard"],
        ["復刻池", "尚未開放", "不顯示於玩家選單"],
    ], widths=[1.45, 4.15, 1.0])

    add_heading(doc, "資源用途", 2)
    add_table(doc, ["資源", "取得方式", "用途"], [
        ["星砂", "大更新、劇情、試煉、委託、抽卡補償與少量抽卡掉落", "單抽 160，十連 1,600"],
        ["星痕", "重複 4★", "10 枚兌換限定池精選 4★"],
        ["回響粉", "一般回響結果", "抽卡系統內的非角色回響資源"],
        ["角色經驗", "試煉、委託、重複 3★等", "角色升級，不與星砂共用"],
        ["突破材料", "指定 Boss 勝利", "依角色指定 Boss 取得；80 等突破後升到 90 等"],
        ["個人命座晶核", "重複取得該名角色", "只能提升同一角色命座，每次 1 枚"],
    ], widths=[1.5, 3.0, 2.1])

    add_page_break(doc)
    add_heading(doc, "劇情內容", 1)
    add_text(doc, "玩家進入劇情選單後可以切換主線與支線。章節清單只讓 1.0–2.5 可選；3.0–4.5 仍在同一份檔案中顯示為已建檔但鎖定。選定章節後，當幕內容與本章所有幕次會同時顯示，避免只看到劇情標題。", after=7)
    add_table(doc, ["版本", "主線", "支線", "開放狀態"], [
        ["1.0", "界痕初響", "獸靈村的回覆", "開放"],
        ["1.1", "旅行回音", "移動舞台的空白段落", "開放"],
        ["1.2", "橋樑與遺構", "水工線交班表", "開放"],
        ["1.3", "洛汀港的潮線", "潮港失物登記", "開放"],
        ["1.4", "彼岸鐘庭", "鐘聲校準日誌", "開放"],
        ["1.5", "公共檔案的空白頁", "空白頁的旁註", "開放"],
        ["2.0", "潮汐書庫的無地址", "海圖邊角的回信", "開放"],
        ["2.1", "鏡潮島的折光", "鏡面上的第二句話", "開放"],
        ["2.2", "深潮測線", "潮線引航手冊", "開放"],
        ["2.3", "風廊之外", "風向維護表", "開放"],
        ["2.4", "霧鏡議庭", "證詞的空白欄", "開放"],
        ["2.5", "潮眼回覆", "潮核修復日誌", "開放"],
    ], widths=[.8, 2.2, 2.2, 1.4])
    add_heading(doc, "劇情獎勵與角色里程碑", 2)
    add_bullets(doc, [
        "每幕第一次完成時加入 100 星砂，完成紀錄以 chapterId:sceneId 儲存，重看不會重複領取。",
        "新帳號自動取得瑟蕾雅。完成 1.0 主線任意一幕後，可在大廳自選雷恩或莉亞。",
        "通關星界試煉第 10 關後，再開啟一次雷恩或莉亞自選，第二份獎勵優先顯示尚未取得的角色。",
    ])

    add_page_break(doc)
    add_heading(doc, "角色培養", 1)
    add_text(doc, "角色頁先顯示已取得角色，再以完整立繪、名稱、星級、元素、戰鬥定位與成長按鈕提供詳細培養。立繪比例使用 contain，名稱、星級與元素以固定標籤疊加，避免瑟蕾雅等角色在手機畫面被裁切。", after=7)
    add_table(doc, ["項目", "三星角色", "四星角色"], [
        ["基礎數值", "整體較低，靠治療、速度或特定功能補位", "生命、攻擊、防禦與整體戰力基準較高"],
        ["升級倍率", "每級 2.2% 主要屬性、1.7% 防禦、0.7% 速度", "每級 3.2% 主要屬性、2.5% 防禦、1.1% 速度"],
        ["升級成本", "起始 45 角色經驗，每級增加 18", "起始 70 角色經驗，每級增加 32"],
        ["協同價值", "便宜、快速或提供治療與特殊定位", "輸出、重裝、支援與控制組合較完整"],
    ], widths=[1.35, 2.7, 2.55])
    add_heading(doc, "等級上限與突破", 2)
    add_bullets(doc, [
        "現行角色等級上限為 90；角色可先升到 80 等，達到 80 等後必須完成指定 Boss 突破才能繼續升級。",
        "每名角色只對應一種 Boss 與一種突破材料：三星角色每次突破需要 3 枚，四星角色需要 4 枚。",
        "100 等只完成規則與資料預留，本次不在玩家介面開放，也不會被當成目前等級上限。",
    ])
    add_heading(doc, "命座規則", 2)
    add_bullets(doc, [
        "初次取得角色為 0 命；後續每取得一次相同角色，命座直接增加 1，並留下 1 枚該角色專用命座晶核。",
        "例如莉亞持有數量為 5，代表初次取得加上 4 次重複，應為 4 命與 4 枚個人晶核；舊存檔登入時會自動補回。",
        "培養頁每按一次提升命座消耗該角色 1 枚個人晶核，命座上限 6；不使用全角色共用的晶核。",
        "共鳴晶核仍是抽卡重複 4★ 的轉換資源，與角色個人命座晶核分開顯示。",
    ])

    add_page_break(doc)
    add_heading(doc, "星界試煉", 1)
    add_text(doc, "星界試煉採自走棋式自動戰鬥。玩家只決定最多四人的隊伍，戰鬥依速度、技能冷卻、敵方特性和隊伍協同自動進行。推薦戰力不是絕對門檻，系統保留低戰力靠配合取勝以及高戰力因編隊失誤而失敗的可能。", after=7)
    add_table(doc, ["規則", "內容"], [
        ["關卡數量", "30 關，逐關解鎖；第 30 關為終局關卡"],
        ["隊伍上限", "一次最多 4 名已取得角色"],
        ["版本次數", "每版本每一關最多成功領獎 10 次"],
        ["成功獎勵", "260 星砂、該關角色經驗"],
        ["失敗處理", "保留編隊與戰報，不扣獎勵次數"],
        ["更新處理", "2.0–2.5 更新已重置清除紀錄、最佳關卡、次數與上次戰報"],
        ["敵人資訊", "每關展示敵人圖片、數量、HP、攻擊、防禦、速度與威脅值"],
    ], widths=[1.35, 5.25])
    add_heading(doc, "編隊思路", 2)
    add_bullets(doc, [
        "重裝或守衛承受傷害，治療與修復角色維持隊伍，支援與指揮角色提高整體效率。",
        "測量、仲裁與編譯等角色可降低敵方防禦或清除增益；射手、斥候與爆發角色負責集中擊破。",
        "環境與敵方特性會改變答案，例如治療降低、敵方護盾、噪音延遲技能或高速獵襲。",
    ])

    add_page_break(doc)
    add_heading(doc, "Boss 與 80 等突破", 1)
    add_text(doc, "Boss 是角色 80 等後的專屬突破玩法。玩家在 Boss 頁選擇首領、查看敵人與環境情報，再從已取得角色中派出最多 4 人。每名角色的培養頁會明確顯示指定 Boss、材料名稱、需求數量與目前持有量。", after=7)
    add_table(doc, ["Boss", "突破材料", "對應角色群", "每名角色需求"], [
        ["星序守望者", "星序碎晶", "瑟蕾雅、艾妲、諾芮亞、奧蕾雅、伊萊拉", "三星 3 枚；四星 4 枚"],
        ["潮眼書庫獸", "潮眼晶核", "莉亞、蕾娜、艾洛娜、璃珊、澪歌、奧薇拉等", "三星 3 枚；四星 4 枚"],
        ["逆時守鐘人", "逆時鐘核", "雷恩、Chodan、Siyeon", "三星 3 枚；四星 4 枚"],
        ["鍛路熔殼王", "熱管熔核", "伊薩爾、赫洛、Magenta、曜澤、洛恩、凱嵐等", "三星 3 枚；四星 4 枚"],
        ["風廊獵王", "風標獵核", "Hina、菲芮、諾嵐、索萊", "三星 3 枚；四星 4 枚"],
        ["霧鏡裁定核", "霧鏡映核", "薇珂、梅芙、伊芙琳、霽羅、蘿堤亞、涅芙", "三星 3 枚；四星 4 枚"],
    ], widths=[1.4, 1.35, 2.45, 1.4])
    add_bullets(doc, [
        "每個 Boss 每版本最多成功領取 10 次獎勵；勝利取得 1 枚對應突破材料與 360 角色經驗，失敗不扣成功獎勵次數。",
        "Boss 的版本挑戰紀錄、編隊與上次戰報會在版本更新時重置；突破材料、角色等級和突破狀態保留在玩家帳號。",
        "Boss 戰同樣採自走棋式自動戰鬥，推薦戰力只作參考；角色技能、元素、速度與隊伍協同會影響勝負。",
    ])

    add_page_break(doc)
    add_heading(doc, "星港委託", 1)
    add_text(doc, "星港委託是比試煉更短的任務型玩法。每份委託有自己的環境、敵方特性與戰鬥推薦值，完成一次即領取獎勵；不共用試煉的 10 次獎勵次數，版本更新時一併重置。", after=7)
    add_table(doc, ["委託", "區域與特色", "完成獎勵"], [
        ["潮汐書庫抄錄", "潮汐書庫；敵人數量較多，速度隊伍有優勢", "180 星砂、1,200 角色經驗、4 回響粉"],
        ["白帆岬補燈", "白帆岬；防禦較高，重裝或支援較穩定", "380 星砂、1,500 角色經驗"],
        ["鏡潮回收", "鏡潮島；敵方護盾與增益需要清除和控場", "260 星砂、1,800 角色經驗、1 星痕"],
    ], widths=[1.45, 3.25, 1.9])
    add_heading(doc, "可擴充玩法方向", 2)
    add_bullets(doc, [
        "限時活動：以版本主題提供一次性任務、活動商店與額外劇情。",
        "探索地圖：使用角色定位處理採集、護送、解謎和隱藏事件。",
        "角色故事：為已取得角色提供獨立章節與培養素材。",
        "成就與每日任務：追蹤抽卡、培養、戰鬥協同和劇情完成度。",
    ])

    add_page_break(doc)
    add_heading(doc, "後續版本內容", 1)
    add_text(doc, "3.0–4.5 已完成內容設計並保存於資料層，目前不會被現行卡池或玩家劇情入口使用。每個版本至少一名四星，4.2 另外加入一名三星，維持三星偶爾發布的節奏。", after=7)
    add_table(doc, ["版本", "新角色", "劇情主題", "狀態"], [
        ["3.0", "霽羅 4★ 星", "第九個回覆", "建檔鎖定"],
        ["3.1", "蘿堤亞 4★ 幻", "回覆台的第三種顏色", "建檔鎖定"],
        ["3.2", "澄音 4★ 淨、岑芽 3★ 淨", "河床上沒有中心", "建檔鎖定"],
        ["3.3", "洛恩 4★ 烈", "空白座的火", "建檔鎖定"],
        ["3.4", "諾嵐 4★ 月", "北門沒有終點", "建檔鎖定"],
        ["3.5", "艾斯特 4★ 烈", "最後一個不回覆", "建檔鎖定"],
        ["4.0", "奧蕾雅 4★ 星", "新曙港的第一束光", "建檔鎖定"],
        ["4.1", "凱嵐 4★ 烈", "碎星工坊的熱源", "建檔鎖定"],
        ["4.2", "索萊 4★ 燕、塔莉亞 3★ 淨", "遠望塔的長距離回覆", "建檔鎖定"],
        ["4.3", "涅芙 4★ 幻", "白夜航路的記憶", "建檔鎖定"],
        ["4.4", "凱爾 4★ 月", "海溝守門人", "建檔鎖定"],
        ["4.5", "伊萊拉 4★ 淨", "第二條律", "建檔鎖定"],
    ], widths=[.7, 2.25, 2.55, 1.1])

    add_heading(doc, "開放前檢查", 2)
    add_bullets(doc, [
        "確認新版本的主線與支線各 3 幕，正文可完整顯示，角色名稱和元素 id 都存在。",
        "確認至少一名新四星與戰鬥數值、技能、敵人和卡面資產完整。",
        "確認更新版本鍵、試煉重置、委託重置和一次性星砂獎勵同步更新。",
        "確認新角色未誤加入 activeCards 或現行卡池，除非版本正式開放。",
    ])

    add_page_break(doc)
    add_heading(doc, "部署與資料保存", 1)
    add_text(doc, "玩家端與管理端使用同一個 Node 網站。正式部署時，玩家開啟根網址，製作者使用同一網址的 /admin.html；不需要玩家另外啟動本機伺服器。", after=7)
    add_table(doc, ["設定", "用途", "必要性"], [
        ["啟動命令", "node serve.mjs，平台會提供 PORT", "必要"],
        ["NODE_ENV", "正式環境設定為 production", "建議"],
        ["STARSHIP_ADMIN_KEY", "管理頁的私密金鑰，需自行設定長密鑰", "必要"],
        ["DATABASE_URL", "Postgres 連線字串，使用 starship_players 表", "推薦"],
        ["STARSHIP_DATA_DIR", "沒有 Postgres 時的 players.json 目錄", "備援"],
        ["持久化儲存", "避免檔案型玩家資料在重啟後消失", "檔案模式必要"],
    ], widths=[1.65, 3.65, 1.3])
    add_heading(doc, "專案入口", 2)
    add_bullets(doc, [
        "玩家頁：/",
        "測試頁：/test.html，測試抽卡存檔和玩家存檔分開。",
        "管理頁：/admin.html，可查詢玩家與執行測試資源調整。",
        "健康檢查：/api/health，正常時回傳 persistence 為 postgres 或 file。",
        "測試命令：node --test test/gacha.test.js test/battle.test.js。",
    ])
    add_text(doc, "文件與程式目前以 2.0–2.5 為玩家版本基準；4.5 內容完成建檔但仍需正式版本公告、資產確認與回歸測試後才可開放。", size=10.5, bold=True, color="193B63", after=0)

    doc.core_properties.title = "星界之律遊戲設定總覽"
    doc.core_properties.subject = "玩家版本 2.0–2.5 規則與 4.5 前內容規劃"
    doc.core_properties.author = "星界之律開發文件"
    doc.save(OUT)


if __name__ == "__main__":
    main()
