# Generates the Helabiz logo files - profile pictures and wordmark lockups.
#
#   powershell -ExecutionPolicy Bypass -File marketing\social\generate-logo.ps1
#
# Unlike generate-images.ps1 this draws text with GDI+ rather than TextRenderer:
# the wordmark is Latin only, so there are no Sinhala conjuncts to lose, and
# GDI+ is the one that can draw onto a transparent background without fringing.

Add-Type -AssemblyName System.Drawing

$OutDir = Join-Path $PSScriptRoot 'logo'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$Jade      = [System.Drawing.ColorTranslator]::FromHtml('#14776B')  # brand primary
$JadeBright= [System.Drawing.ColorTranslator]::FromHtml('#2FBFAC')  # the dark-mode primary
$Ink       = [System.Drawing.ColorTranslator]::FromHtml('#11201D')
$Paper     = [System.Drawing.ColorTranslator]::FromHtml('#F7F6F2')
$White     = [System.Drawing.Color]::White
$Clear     = [System.Drawing.Color]::Transparent

$FontFamily = 'Segoe UI'

function New-Canvas {
    param([int]$Width, [int]$Height, $Background)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $G = [System.Drawing.Graphics]::FromImage($bmp)
    $G.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $G.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $G.Clear($Background)
    return @{ Bitmap = $bmp; Graphics = $G }
}

<#
    The storefront glyph: an awning bar over two legs with a crossbar - an "H"
    built out of a shop front. Drawn as strokes so it stays crisp at any size.
#>
function Draw-Mark {
    param($G, [single]$CX, [single]$CY, [single]$Size, $Color)

    $pen = New-Object System.Drawing.Pen($Color, [single]($Size * 0.135))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round

    $half = $Size / 2
    $l = $CX - $half
    $r = $CX + $half
    $t = $CY - $half * 0.86
    $b = $CY + $half * 0.86

    $inset = $Size * 0.085
    $legTop = $t + $Size * 0.20

    $G.DrawLine($pen, $l, $t, $r, $t)                                   # awning
    $G.DrawLine($pen, $l + $inset, $legTop, $l + $inset, $b)            # left leg
    $G.DrawLine($pen, $r - $inset, $legTop, $r - $inset, $b)            # right leg
    $G.DrawLine($pen, $l + $inset, ($legTop + $b) / 2, $r - $inset, ($legTop + $b) / 2)  # crossbar

    $pen.Dispose()
}

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

<#
    Profile picture: the mark alone, full-bleed background.

    No wordmark and no inner rounded square - Facebook and Instagram crop
    avatars to a circle and render them near 40px in feed, where a lockup is
    unreadable and a square-inside-a-circle reads as a mistake.
#>
function New-Profile {
    param([string]$File, [int]$Size = 1024, $Background, $MarkColor)

    $c = New-Canvas -Width $Size -Height $Size -Background $Background
    $G = $c.Graphics

    # 46% of the canvas keeps the glyph well inside the circle crop.
    Draw-Mark -G $G -CX ([single]($Size / 2)) -CY ([single]($Size / 2)) -Size ([single]($Size * 0.46)) -Color $MarkColor

    $path = Join-Path $OutDir $File
    $c.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $G.Dispose(); $c.Bitmap.Dispose()
    Write-Host ("  " + $File + "  (" + $Size + "x" + $Size + ")")
}

<#
    Horizontal lockup: rounded mark tile + "Hela" / "biz" wordmark, the same
    split used in the app header.
#>
function New-Lockup {
    param(
        [string]$File,
        [int]$Width = 1600,
        [int]$Height = 480,
        $Background,
        $TileColor,
        $GlyphColor,
        $WordColor,
        $AccentColor
    )

    $c = New-Canvas -Width $Width -Height $Height -Background $Background
    $G = $c.Graphics

    $tile = [single]($Height * 0.52)
    $tileX = [single](($Width - $tile * 4.05) / 2)
    $tileY = [single](($Height - $tile) / 2)

    $path = New-RoundedPath -X $tileX -Y $tileY -W $tile -H $tile -R ($tile * 0.28)
    $brush = New-Object System.Drawing.SolidBrush($TileColor)
    $G.FillPath($brush, $path)
    $brush.Dispose(); $path.Dispose()

    Draw-Mark -G $G -CX ([single]($tileX + $tile / 2)) -CY ([single]($tileY + $tile / 2)) -Size ([single]($tile * 0.50)) -Color $GlyphColor

    $font = New-Object System.Drawing.Font($FontFamily, [single]($tile * 0.62), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $fmt = [System.Drawing.StringFormat]::GenericTypographic

    $wordX = [single]($tileX + $tile * 1.34)
    $helaW = $G.MeasureString('Hela', $font, 10000, $fmt).Width
    $wordY = [single]($tileY + $tile * 0.10)

    $b1 = New-Object System.Drawing.SolidBrush($WordColor)
    $G.DrawString('Hela', $font, $b1, $wordX, $wordY, $fmt)
    $b1.Dispose()

    $b2 = New-Object System.Drawing.SolidBrush($AccentColor)
    $G.DrawString('biz', $font, $b2, [single]($wordX + $helaW), $wordY, $fmt)
    $b2.Dispose()

    $font.Dispose()

    $path2 = Join-Path $OutDir $File
    $c.Bitmap.Save($path2, [System.Drawing.Imaging.ImageFormat]::Png)
    $G.Dispose(); $c.Bitmap.Dispose()
    Write-Host ("  " + $File + "  (" + $Width + "x" + $Height + ")")
}

Write-Host "Generating Helabiz logo files..."

# ---- Profile pictures --------------------------------------------------
New-Profile -File 'profile-jade-1024.png'  -Size 1024 -Background $Jade  -MarkColor $White
New-Profile -File 'profile-jade-512.png'   -Size 512  -Background $Jade  -MarkColor $White
New-Profile -File 'profile-dark-1024.png'  -Size 1024 -Background $Ink   -MarkColor $JadeBright
New-Profile -File 'profile-light-1024.png' -Size 1024 -Background $Paper -MarkColor $Jade
New-Profile -File 'mark-transparent-1024.png' -Size 1024 -Background $Clear -MarkColor $Jade
New-Profile -File 'mark-white-transparent-1024.png' -Size 1024 -Background $Clear -MarkColor $White

# ---- Wordmark lockups --------------------------------------------------
New-Lockup -File 'lockup-dark.png'  -Background $Ink   -TileColor $JadeBright -GlyphColor $Ink   -WordColor $White -AccentColor $JadeBright
New-Lockup -File 'lockup-light.png' -Background $Paper -TileColor $Jade       -GlyphColor $White -WordColor $Ink   -AccentColor $Jade
New-Lockup -File 'lockup-transparent.png' -Background $Clear -TileColor $Jade -GlyphColor $White -WordColor $Ink   -AccentColor $Jade
New-Lockup -File 'lockup-transparent-onDark.png' -Background $Clear -TileColor $JadeBright -GlyphColor $Ink -WordColor $White -AccentColor $JadeBright

Write-Host ""
Write-Host ("Done. " + (Get-ChildItem $OutDir -Filter *.png).Count + " files in marketing\social\logo")
