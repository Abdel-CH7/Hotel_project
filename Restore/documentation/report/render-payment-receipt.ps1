param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$bitmap = New-Object System.Drawing.Bitmap 1440, 900
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$graphics.Clear([System.Drawing.Color]::FromArgb(238, 242, 245))

$sheet = New-Object System.Drawing.RectangleF 323, 28, 794, 844
$shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(32, 15, 23, 42))
$graphics.FillRectangle($shadowBrush, 333, 38, 794, 844)
$graphics.FillRectangle([System.Drawing.Brushes]::White, $sheet)

$dark = [System.Drawing.Color]::FromArgb(15, 23, 42)
$teal = [System.Drawing.Color]::FromArgb(0, 175, 170)
$deepTeal = [System.Drawing.Color]::FromArgb(11, 77, 84)
$muted = [System.Drawing.Color]::FromArgb(100, 116, 139)
$border = [System.Drawing.Color]::FromArgb(203, 213, 225)
$soft = [System.Drawing.Color]::FromArgb(248, 250, 252)

$titleFont = New-Object System.Drawing.Font 'Arial', 21, ([System.Drawing.FontStyle]::Bold)
$brandFont = New-Object System.Drawing.Font 'Arial', 11, ([System.Drawing.FontStyle]::Bold)
$headingFont = New-Object System.Drawing.Font 'Arial', 13, ([System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font 'Arial', 10, ([System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font 'Arial', 10
$smallFont = New-Object System.Drawing.Font 'Arial', 9
$amountFont = New-Object System.Drawing.Font 'Arial', 10, ([System.Drawing.FontStyle]::Bold)

$darkBrush = New-Object System.Drawing.SolidBrush $dark
$tealBrush = New-Object System.Drawing.SolidBrush $teal
$deepTealBrush = New-Object System.Drawing.SolidBrush $deepTeal
$mutedBrush = New-Object System.Drawing.SolidBrush $muted
$softBrush = New-Object System.Drawing.SolidBrush $soft
$borderPen = New-Object System.Drawing.Pen $border, 1

$receiptTitle = 'Re' + [char]0x00E7 + 'u de paiement'
$generatedText = 'G' + [char]0x00E9 + 'n' + [char]0x00E9 + 'r' + [char]0x00E9 + ' le 17/07/2026'
$brandText = 'HMS ' + [char]0x00B7 + ' Gestion h' + [char]0x00F4 + 'teli' + [char]0x00E8 + 're'
$graphics.DrawString($receiptTitle, $titleFont, $darkBrush, 367, 70)
$graphics.DrawString($generatedText, $smallFont, $mutedBrush, 368, 109)
$graphics.DrawString($brandText, $brandFont, $deepTealBrush, 893, 76)
$graphics.FillRectangle($tealBrush, 367, 136, 706, 3)
$graphics.DrawString('Paiement', $headingFont, $deepTealBrush, 367, 164)

$degree = [char]0x00B0
$eAcute = [char]0x00E9
$emDash = [char]0x2014
$rows = @(
    @(('N' + $degree + ' paiement'), 'PAY-20260717-RRC3BL'),
    @(('N' + $degree + ' r' + $eAcute + 'servation'), 'RLA570GKHEN'),
    @('Client', 'Chafi Jawad'),
    @('Code client', 'CP12897'),
    @('Date du paiement', '17/07/2026'),
    @('Type', ('R' + $eAcute + 'glement')),
    @('Mode', ('Carte de cr' + $eAcute + 'dit')),
    @(('R' + $eAcute + 'f' + $eAcute + 'rence'), $emDash),
    @('Montant', '300,00 DH'),
    @('Statut', ('Valid' + $eAcute)),
    @('Saisi par', $emDash)
)

$x = 367
$y = 201
$labelWidth = 239
$valueWidth = 467
$rowHeight = 48

for ($index = 0; $index -lt $rows.Count; $index++) {
    $rowY = $y + ($index * $rowHeight)
    $graphics.FillRectangle($softBrush, $x, $rowY, $labelWidth, $rowHeight)
    $graphics.DrawRectangle($borderPen, $x, $rowY, $labelWidth, $rowHeight)
    $graphics.DrawRectangle($borderPen, $x + $labelWidth, $rowY, $valueWidth, $rowHeight)
    $graphics.DrawString($rows[$index][0], $labelFont, $mutedBrush, $x + 12, $rowY + 15)
    $font = if ($rows[$index][0] -eq 'Montant') { $amountFont } else { $bodyFont }
    $graphics.DrawString($rows[$index][1], $font, $darkBrush, $x + $labelWidth + 12, $rowY + 15)
}

$footerY = $y + ($rows.Count * $rowHeight) + 27
$graphics.DrawLine($borderPen, 367, $footerY, 1073, $footerY)
$footerText = 'Ce re' + [char]0x00E7 + 'u concerne une saisie de paiement li' + $eAcute + 'e ' + [char]0x00E0 + ' la r' + $eAcute + 'servation indiqu' + $eAcute + 'e.'
$graphics.DrawString($footerText, $smallFont, $mutedBrush, 367, $footerY + 14)

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$borderPen.Dispose()
$shadowBrush.Dispose()
$darkBrush.Dispose()
$tealBrush.Dispose()
$deepTealBrush.Dispose()
$mutedBrush.Dispose()
$softBrush.Dispose()
$titleFont.Dispose()
$brandFont.Dispose()
$headingFont.Dispose()
$labelFont.Dispose()
$bodyFont.Dispose()
$smallFont.Dispose()
$amountFont.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
