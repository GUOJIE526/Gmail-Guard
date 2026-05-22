$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "extension\assets"
New-Item -ItemType Directory -Path $assets -Force | Out-Null

Add-Type -AssemblyName System.Drawing

function New-Brush($hex) {
    return [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-Pen($hex, $width) {
    return [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
}

foreach ($size in @(16, 32, 48, 128)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $bg = New-Brush "#0f766e"
    $shield = New-Brush "#ffffff"
    $accent = New-Brush "#dc2626"
    $outline = New-Pen "#0b4f49" ([Math]::Max(1, [Math]::Floor($size / 24)))

    $radius = [Math]::Max(3, [Math]::Floor($size / 6))
    $rect = [System.Drawing.RectangleF]::new(1, 1, $size - 2, $size - 2)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    $graphics.FillPath($bg, $path)
    $graphics.DrawPath($outline, $path)

    $points = @(
        [System.Drawing.PointF]::new($size * 0.50, $size * 0.18),
        [System.Drawing.PointF]::new($size * 0.75, $size * 0.29),
        [System.Drawing.PointF]::new($size * 0.70, $size * 0.63),
        [System.Drawing.PointF]::new($size * 0.50, $size * 0.82),
        [System.Drawing.PointF]::new($size * 0.30, $size * 0.63),
        [System.Drawing.PointF]::new($size * 0.25, $size * 0.29)
    )
    $graphics.FillPolygon($shield, $points)

    $alertRadius = [Math]::Max(2, [Math]::Floor($size / 12))
    $graphics.FillEllipse($accent, $size * 0.58, $size * 0.55, $alertRadius * 2, $alertRadius * 2)

    $output = Join-Path $assets "icon-$size.png"
    $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
    $bg.Dispose()
    $shield.Dispose()
    $accent.Dispose()
    $outline.Dispose()
    $path.Dispose()
}

Write-Output "Generated icons in $assets"
