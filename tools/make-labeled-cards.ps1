# Retired on 2026-09-22.  The game and design documents now share the clean
# portrait SVGs in assets/cards/complete.  Running the former renderer would
# recreate the old labeled-png images and make the document/game sources drift.
throw "The labeled-card renderer is retired. Use tools/make-complete-portraits.mjs and assets/cards/complete instead."

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$sourceRoot = Join-Path $root "gacha-system\assets\cards"
$outputRoot = Join-Path $sourceRoot "labeled-png"
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

function U([int[]]$codes) { return (-join ($codes | ForEach-Object { [char]$_ })) }
function To-Color($hex, $alpha) {
  $clean = $hex.TrimStart('#')
  return [Drawing.Color]::FromArgb($alpha, [Convert]::ToInt32($clean.Substring(0, 2), 16), [Convert]::ToInt32($clean.Substring(2, 2), 16), [Convert]::ToInt32($clean.Substring(4, 2), 16))
}

$cards = @(
  @{ id = "celesia"; source = "celesia.png"; name = (U @(0x745F,0x854E,0x96C5)); romanized = "Celesia"; element = (U @(0x661F)); rarity = 4; accent = "#9e92ff" },
  @{ id = "reyn"; source = "reyn.png"; name = (U @(0x96F7,0x6069)); romanized = "Reyn"; element = (U @(0x71D5)); rarity = 3; accent = "#78a4c8" },
  @{ id = "lia"; source = "lia.png"; name = (U @(0x8389,0x4E9E)); romanized = "Lia"; element = (U @(0x661F)); rarity = 3; accent = "#9bbdff" },
  @{ id = "isar"; source = "isar.png"; name = (U @(0x4F0A,0x85A9,0x723E)); romanized = "Isar"; element = (U @(0x70C8)); rarity = 3; accent = "#c88755" },
  @{ id = "rena"; source = "rena.png"; name = (U @(0x854E,0x5A1C)); romanized = "Rena"; element = (U @(0x70C8)); rarity = 3; accent = "#f08a65" },
  @{ id = "eda"; source = "eda.png"; name = (U @(0x827E,0x59B2)); romanized = "Eda"; element = (U @(0x661F)); rarity = 4; accent = "#f4c66b" },
  @{ id = "veyra"; source = "veyra.png"; name = (U @(0x8587,0x73C2)); romanized = "Veyra"; element = (U @(0x6DE8)); rarity = 4; accent = "#57d9c0" },
  @{ id = "harlow"; source = "harlow.png"; name = (U @(0x8D6B,0x6D1B)); romanized = "Harlow"; element = (U @(0x70C8)); rarity = 4; accent = "#ff795c" },
  @{ id = "chodan"; source = "chodan.png"; name = "Chodan"; romanized = "Chodan"; element = (U @(0x6708)); rarity = 4; accent = "#91a8d8" },
  @{ id = "magenta"; source = "magenta.png"; name = "Magenta"; romanized = "Magenta"; element = (U @(0x70C8)); rarity = 4; accent = "#ff71b8" },
  @{ id = "hina"; source = "hina.png"; name = "Hina"; romanized = "Hina"; element = (U @(0x71D5)); rarity = 4; accent = "#6fa8ff" },
  @{ id = "siyeon"; source = "siyeon.png"; name = "Siyeon"; romanized = "Siyeon"; element = (U @(0x6DE8)); rarity = 4; accent = "#b7e9d6" }
)

$brand = U @(0x661F,0x754C,0x4E4B,0x5F8B)
$star = U @(0x2605)

foreach ($card in $cards) {
  $sourcePath = Join-Path $sourceRoot $card.source
  if (-not (Test-Path -LiteralPath $sourcePath)) { continue }
  $outputPath = Join-Path $outputRoot ($card.id + ".png")
  $source = [Drawing.Bitmap]::new($sourcePath)
  $canvas = [Drawing.Bitmap]::new($source.Width, $source.Height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [Drawing.Graphics]::FromImage($canvas)
  try {
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.DrawImage($source, 0, 0, $source.Width, $source.Height)
    $shadeBrush = [Drawing.Drawing2D.LinearGradientBrush]::new([Drawing.Point]::new(0, [int]($source.Height * 0.58)), [Drawing.Point]::new(0, $source.Height), [Drawing.Color]::FromArgb(0, 4, 8, 24), [Drawing.Color]::FromArgb(232, 4, 8, 24))
    $graphics.FillRectangle($shadeBrush, 0, [int]($source.Height * 0.52), $source.Width, [int]($source.Height * 0.48))
    $accentBrush = [Drawing.SolidBrush]::new((To-Color $card.accent 110))
    $graphics.FillEllipse($accentBrush, [int]($source.Width * 0.86), [int]($source.Height * 0.07), [int]($source.Width * 0.08), [int]($source.Width * 0.08))
    $whiteBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(246, 247, 255))
    $softBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(210, 222, 247))
    $goldBrush = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(255, 232, 165))
    $nameFont = [Drawing.Font]::new("Microsoft JhengHei UI", [float]($source.Width * 0.035), [Drawing.FontStyle]::Bold)
    $romanizedFont = [Drawing.Font]::new("Arial", [float]($source.Width * 0.016), [Drawing.FontStyle]::Regular)
    $smallFont = [Drawing.Font]::new("Microsoft JhengHei UI", [float]($source.Width * 0.014), [Drawing.FontStyle]::Bold)
    $starFont = [Drawing.Font]::new("Arial", [float]($source.Width * 0.02), [Drawing.FontStyle]::Regular)
    $left = [float]($source.Width * 0.045)
    $graphics.DrawString($card.name, $nameFont, $whiteBrush, $left, [float]($source.Height * 0.79))
    $graphics.DrawString($card.romanized, $romanizedFont, $softBrush, $left, [float]($source.Height * 0.855))
    $graphics.DrawString(((-join (1..$card.rarity | ForEach-Object { $star }))), $starFont, $goldBrush, $left, [float]($source.Height * 0.91))
    $elementSize = [int]($source.Width * 0.07)
    $elementX = [int]($source.Width * 0.88)
    $elementY = [int]($source.Height * 0.82)
    $graphics.FillEllipse([Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(190, 8, 15, 39)), $elementX, $elementY, $elementSize, $elementSize)
    $graphics.DrawEllipse([Drawing.Pen]::new([Drawing.Color]::FromArgb(210, 235, 242, 255), [float]($source.Width * 0.002)), $elementX, $elementY, $elementSize, $elementSize)
    $elementFont = [Drawing.Font]::new("Microsoft JhengHei UI", [float]($source.Width * 0.027), [Drawing.FontStyle]::Bold)
    $elementSizeText = $graphics.MeasureString($card.element, $elementFont)
    $graphics.DrawString($card.element, $elementFont, $whiteBrush, [float]($elementX + ($elementSize - $elementSizeText.Width) / 2), [float]($elementY + ($elementSize - $elementSizeText.Height) / 2))
    $graphics.DrawString($brand, $smallFont, $softBrush, $left, [float]($source.Height * 0.035))
    $canvas.Save($outputPath, [Drawing.Imaging.ImageFormat]::Png)
    Write-Output $outputPath
  } finally {
    $graphics.Dispose()
    $source.Dispose()
    $canvas.Dispose()
  }
}
