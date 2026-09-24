---
name: 星界之律
description: 星艦導航艙中的繁體中文玩家介面
colors:
  night: "#050b1a"
  panel: "#111c36"
  panel-strong: "#172544"
  text: "#f5f6fa"
  muted: "#c5d1e3"
  gold: "#e9bd76"
  gold-active: "#f0c989"
  cyan: "#79dfd6"
  danger: "#ffb0a7"
  line: "rgba(172, 201, 234, .26)"
typography:
  display:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 4.7rem)"
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: "-.03em"
  headline:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.5rem)"
    fontWeight: 700
    letterSpacing: "-.02em"
  body:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.7
  label:
    fontFamily: "Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: ".88rem"
    fontWeight: 650
rounded:
  action: "9px"
  card: "13px"
  panel: "16px"
  gate: "18px"
spacing:
  menu-gap: "12px"
  panel-padding: "26px"
  mobile-panel-padding: "18px"
components:
  destination-active:
    backgroundColor: "{colors.gold-active}"
    textColor: "{colors.night}"
    rounded: "{rounded.action}"
    padding: "8px 12px"
    height: "44px"
  primary-action:
    backgroundColor: "{colors.gold-active}"
    textColor: "{colors.night}"
    rounded: "{rounded.action}"
    padding: "10px 20px"
    height: "48px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
---

# Design System: 星界之律

## Overview

**Creative North Star: "星艦導航艙"**

深藍船艙、暖金航線與青色狀態光構成玩家介面的共同語言。既有星界場景圖承載氣氛；深色遮罩和有邊界的資訊面板讓文字、資源與操作保持清楚。這套系統覆蓋登入、大廳與玩家玩法畫面，內容以繁體中文呈現。

**Key Characteristics:**
- 場景圖作大面積背景，資訊層保持高對比。
- 目的地導覽是跨畫面的固定座標；選中項是實色暖金。
- 面板、資源和操作有明確輪廓，焦點有可見光環。

## Colors

深夜藍是畫布與面板基底。暖金標示航行方向和主要動作，青色用於狀態訊息，淺色文字保證長篇劇情可讀。

### Primary
- **航線金** (`gold`, `gold-active`): 導覽選中、主要動作和選中邊框。

### Secondary
- **狀態青** (`cyan`): 表單 accent 和成功訊息。

### Neutral
- **深夜底** (`night`): 頁面底色及場景圖的暗色遮罩終點。
- **艙室面板** (`panel`, `panel-strong`): 資源、卡片和閱讀區。
- **主文字與次文字** (`text`, `muted`): 標題、正文和輔助資訊。
- **艙室線** (`line`): 面板和控制項分界。
- **警示粉** (`danger`): 錯誤訊息。

**The Scene Legibility Rule.** 場景圖上的文字必須有深藍漸層遮罩；不要直接壓在明亮圖像上。

## Typography

**Display and Body Font:** Noto Sans TC，回退至 Microsoft JhengHei、system-ui 和 sans-serif。未載入外部字型。

大型標題使用緊字距，保留星艦場景的戲劇性；資訊與控制項使用較穩定的字重和行高。大廳主標題、玩法工具列與一般正文分層；原有 eyebrow 小標在此版本隱藏。

## Layout

頁面容器上限為 1480px，桌面左右留 28px；大廳目的地採四欄網格，其中劇情與星海迷航跨兩欄。1100px 以下改為三欄，760px 以下雙欄並讓玩法內容成單欄，360px 以下入口成單欄。目的地導覽吸附在頂端，窄螢幕可水平滑動。手機頁面留 12px 側邊空間，主動作在需要時展開全寬。

## Elevation & Depth

共用面板陰影為 `0 18px 44px rgba(1, 5, 18, .3)`。導覽使用更淺的黑色投影；場景圖則靠漸層遮罩與深色面板分層。面板還繼承底層 `styles.css` 的模糊背景效果。

## Shapes

圓角依語意遞增：目的地選項和主要動作 9px、入口卡約 13px、共用面板 16px、登入場景 18px。細線邊框使深色區塊在相近明度下仍可辨識。圖標保留 14px 圓角。

## Components

### Buttons
- 主要動作是暖金底與深色文字，hover 變為更亮的金色；按下時下移 1px。
- 主要動作內的文字子元素也維持深色，避免繼承底層樣式而失去對比。
- 次要、小型動作是深藍底、淺色文字和淺藍邊框。停用狀態降低透明度。
- 鍵盤焦點以 3px 淺金外框及 3px offset 顯示。

### Navigation
- 頂部目的地導覽吸附於視窗頂端。普通項為透明底與淺色文字；hover 加淡金底；目前目的地為實色金底與深色文字。窄螢幕橫向滑動，不壓縮標籤。

### Cards / Containers
- 大廳入口卡以既有場景圖加深色漸層，文字固定在圖像下方；劇情與迷航入口較寬。
- 大廳快速入口省略 emoji 圖標；大廳主場景抵達時有 0.42 秒短動畫，減少動態設定下停用。
- 玩法面板與資源格使用深藍底、淺色邊界和共同陰影。劇情閱讀區維持深色獨立底。

### Inputs
- 登入欄位使用深色半透明底、淺色文字和可見邊框；高度至少 50px。表單焦點沿用全域淺金輪廓。

## Do's and Don'ts

### Do:
- **Do** 使用現有星界場景圖及其深色遮罩延伸畫面。
- **Do** 以暖金實色與邊框清楚標示主要動作和目前目的地。
- **Do** 在手機保留可點擊尺寸與單欄閱讀路徑。

### Don't:
- **Don't** 讓背景圖的亮區直接承載正文或狀態數字。
- **Don't** 用只有顏色差異的細微提示取代選中狀態的實色標記。
- **Don't** 在窄螢幕將全部目的地擠成難以點擊的微小標籤。

### Shipped raster provenance

`assets/ui/astral-hub.png`、`assets/ui/astral-hall.png`、`assets/ui/astral-trial.png`、`assets/ui/game-icon.png` 與 `assets/pets/companion-workshop-bg.png` 均為本次改版前已納入 Git 的專案美術；此設計沿用這些檔案，沒有生成或修改像素。其他角色與星伴圖亦維持原有內容資產。
