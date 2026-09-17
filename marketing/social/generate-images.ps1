# Generates the Helabiz launch-teaser social images.
#
#   powershell -ExecutionPolicy Bypass -File marketing\social\generate-images.ps1
#
# Copy lives in posts.json, not here: Windows PowerShell reads .ps1 files as ANSI
# unless they carry a BOM, which mangles Sinhala. This script stays pure ASCII.
#
# Text is drawn with TextRenderer (GDI/Uniscribe) rather than Graphics.DrawString
# (GDI+). GDI+ drops Sinhala ZWJ conjuncts, which changes words outright - the
# word for "business" lost its yansaya and read "vayaapaara", not "vyaapaara".

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$OutDir = Join-Path $PSScriptRoot 'images'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

# ---- Brand -------------------------------------------------------------
$Jade   = [System.Drawing.ColorTranslator]::FromHtml('#14776B')
$JadeHi = [System.Drawing.ColorTranslator]::FromHtml('#1B9182')
$Ink    = [System.Drawing.ColorTranslator]::FromHtml('#11201D')
$Paper  = [System.Drawing.ColorTranslator]::FromHtml('#F7F6F2')
$White  = [System.Drawing.Color]::White

$FontFamily = 'Nirmala UI'

$FlagsWrap  = [System.Windows.Forms.TextFormatFlags]::WordBreak -bor `
              [System.Windows.Forms.TextFormatFlags]::NoPadding -bor `
              [System.Windows.Forms.TextFormatFlags]::NoPrefix
$FlagsRight = $FlagsWrap -bor [System.Windows.Forms.TextFormatFlags]::Right

function New-RoundedPath {
    param([single]$X, [single]$Y, [single]$W, [single]$H, [single]$R)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $R * 2
    $path.AddArc($X, $Y, $d, $d, 180, 90)
    $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
    $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
    $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# The storefront mark from the app's logo: an awning line over two legs.
function Draw-Logo {
    param($G, [single]$X, [single]$Y, [single]$Size, $MarkBg, $MarkFg, $WordColor)

    $path = New-RoundedPath -X $X -Y $Y -W $Size -H $Size -R ($Size * 0.28)
    $brush = New-Object System.Drawing.SolidBrush($MarkBg)
    $G.FillPath($brush, $path)
    $brush.Dispose(); $path.Dispose()

    $pen = New-Object System.Drawing.Pen($MarkFg, [single]($Size * 0.085))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round
    $l = $X + $Size * 0.26; $r = $X + $Size * 0.74
    $t = $Y + $Size * 0.30; $b = $Y + $Size * 0.72
    $G.DrawLine($pen, $l, $t, $r, $t)
    $G.DrawLine($pen, $l + $Size * 0.05, $t + $Size * 0.09, $l + $Size * 0.05, $b)
    $G.DrawLine($pen, $r - $Size * 0.05, $t + $Size * 0.09, $r - $Size * 0.05, $b)
    $G.DrawLine($pen, $l + $Size * 0.05, ($t + $b) / 2, $r - $Size * 0.05, ($t + $b) / 2)
    $pen.Dispose()

    $f = New-Object System.Drawing.Font($FontFamily, [single]($Size * 0.44), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $wordRect = New-Object System.Drawing.Rectangle([int]($X + $Size * 1.30), [int]($Y + $Size * 0.24), [int]($Size * 6), [int]($Size * 0.8))
    [System.Windows.Forms.TextRenderer]::DrawText($G, 'Helabiz', $f, $wordRect, $WordColor, $FlagsWrap)
    $f.Dispose()
}

function Measure-Block {
    param($G, [string]$Text, $Font, [int]$MaxWidth)
    if (-not $Text) { return 0 }
    $proposed = New-Object System.Drawing.Size($MaxWidth, 10000)
    $size = [System.Windows.Forms.TextRenderer]::MeasureText($G, $Text, $Font, $proposed, $FlagsWrap)
    return $size.Height
}

function Draw-Block {
    param($G, [string]$Text, $Font, $Color, [int]$X, [int]$Y, [int]$MaxWidth, $Flags = $null)
    if (-not $Text) { return }
    if ($null -eq $Flags) { $Flags = $FlagsWrap }
    $rect = New-Object System.Drawing.Rectangle($X, $Y, $MaxWidth, 10000)
    [System.Windows.Forms.TextRenderer]::DrawText($G, $Text, $Font, $rect, $Color, $Flags)
}

<#
    Draws one post. Dark flips the palette to the jade background used to
    break up the feed.
#>
function New-Post {
    param(
        [string]$File,
        [int]$Width = 1080,
        [int]$Height = 1080,
        [string]$Eyebrow,
        [string]$Headline,
        [string]$Sub,
        [string]$Footer = 'helabiz.lk',
        [switch]$Dark
    )

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $G = [System.Drawing.Graphics]::FromImage($bmp)
    $G.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $G.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    if ($Dark) {
        $bgA = $Jade; $bgB = $Ink
        $textColor = $White
        $eyebrowColor = [System.Drawing.ColorTranslator]::FromHtml('#8FE3D5')
        $subColor = [System.Drawing.ColorTranslator]::FromHtml('#CFE8E3')
        $markBg = $White; $markFg = $Jade; $wordColor = $White
        $footColor = [System.Drawing.ColorTranslator]::FromHtml('#9EC9C2')
    } else {
        $bgA = $Paper; $bgB = [System.Drawing.ColorTranslator]::FromHtml('#EBE8E0')
        $textColor = $Ink
        $eyebrowColor = $Jade
        $subColor = [System.Drawing.ColorTranslator]::FromHtml('#5C635F')
        $markBg = $Jade; $markFg = $White; $wordColor = $Ink
        $footColor = [System.Drawing.ColorTranslator]::FromHtml('#79817C')
    }

    $rect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bgA, $bgB, 135.0)
    $G.FillRectangle($grad, $rect)
    $grad.Dispose()

    # A soft corner glow, so the flat background has some depth.
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowSize = [int]([Math]::Max($Width, $Height) * 0.95)
    $glowPath.AddEllipse([int]($Width - $glowSize * 0.5), [int](-$glowSize * 0.45), $glowSize, $glowSize)
    $glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    if ($Dark) { $glow.CenterColor = [System.Drawing.Color]::FromArgb(70, $JadeHi) }
    else       { $glow.CenterColor = [System.Drawing.Color]::FromArgb(40, $Jade) }
    $glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $bgA))
    $G.FillPath($glow, $glowPath)
    $glow.Dispose(); $glowPath.Dispose()

    # Type scales off the shorter side, so a wide banner does not get
    # square-sized text that overruns its own height.
    $scale = [single]([Math]::Min($Width, $Height * 1.35))
    $margin = [int]($Width * 0.075)
    $maxW = [int]($Width - $margin * 2)

    $logoSize = [single]($scale * 0.075)
    $logoY = [single]($Height * 0.085)
    Draw-Logo -G $G -X $margin -Y $logoY -Size $logoSize -MarkBg $markBg -MarkFg $markFg -WordColor $wordColor

    $eyeFont  = New-Object System.Drawing.Font($FontFamily, [single]($scale * 0.0265), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $headFont = New-Object System.Drawing.Font($FontFamily, [single]($scale * 0.070),  [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subFont  = New-Object System.Drawing.Font($FontFamily, [single]($scale * 0.0325), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $footFont = New-Object System.Drawing.Font($FontFamily, [single]($scale * 0.0245), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

    # The footer sits on a fixed baseline and the text block centres in what is
    # left between the logo and that rule, so nothing overlaps at any ratio.
    $ruleY = [int]($Height - $Height * 0.085 - $scale * 0.048)
    $contentTop = [int]($logoY + $logoSize + $Height * 0.05)
    $contentBottom = [int]($ruleY - $Height * 0.05)

    $subW = [int]($maxW * 0.90)
    $eyeH  = Measure-Block -G $G -Text $Eyebrow -Font $eyeFont -MaxWidth $maxW
    $headH = Measure-Block -G $G -Text $Headline -Font $headFont -MaxWidth $maxW
    $subH  = Measure-Block -G $G -Text $Sub -Font $subFont -MaxWidth $subW

    $gapA = [int]($scale * 0.022)
    $gapB = [int]($scale * 0.030)
    $blockH = $eyeH + $gapA + $headH + $gapB + $subH

    $y = [int]($contentTop + [Math]::Max(0, ($contentBottom - $contentTop - $blockH) / 2))

    if ($Eyebrow) {
        Draw-Block -G $G -Text $Eyebrow -Font $eyeFont -Color $eyebrowColor -X $margin -Y $y -MaxWidth $maxW
        $y += $eyeH + $gapA
    }
    Draw-Block -G $G -Text $Headline -Font $headFont -Color $textColor -X $margin -Y $y -MaxWidth $maxW
    $y += $headH + $gapB
    Draw-Block -G $G -Text $Sub -Font $subFont -Color $subColor -X $margin -Y $y -MaxWidth $subW

    $rulePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(55, $footColor), 2)
    $G.DrawLine($rulePen, $margin, $ruleY, [int]($Width - $margin), $ruleY)
    $rulePen.Dispose()

    $footY = [int]($ruleY + $scale * 0.016)
    Draw-Block -G $G -Text $Footer -Font $footFont -Color $footColor -X $margin -Y $footY -MaxWidth $maxW
    Draw-Block -G $G -Text '@helabiz' -Font $footFont -Color $footColor -X $margin -Y $footY -MaxWidth $maxW -Flags $FlagsRight

    $eyeFont.Dispose(); $headFont.Dispose(); $subFont.Dispose(); $footFont.Dispose()

    $path = Join-Path $OutDir $File
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $G.Dispose(); $bmp.Dispose()
    Write-Host ("  " + $File + "  (" + $Width + "x" + $Height + ")")
}

Write-Host "Generating Helabiz social images..."

$copyPath = Join-Path $PSScriptRoot 'posts.json'
$copy = Get-Content -Path $copyPath -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($post in $copy.posts) {
    $width  = if ($post.width)  { [int]$post.width }  else { 1080 }
    $height = if ($post.height) { [int]$post.height } else { 1080 }

    $params = @{
        File     = $post.file
        Width    = $width
        Height   = $height
        Eyebrow  = $post.eyebrow
        Headline = $post.headline
        Sub      = $post.sub
    }
    if ($post.dark) { $params.Dark = $true }

    New-Post @params
}

Write-Host ""
Write-Host ("Done. " + (Get-ChildItem $OutDir -Filter *.png).Count + " images in marketing\social\images")
