# Membuat ikon PWA (192px & 512px) dari satu gambar logo.
# Cara pakai (dari folder frontend):
#   powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1 -Source "src\assets\logo-app.png"
param(
    [string]$Source = "src\assets\logo-app.png"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
    Write-Host "File sumber tidak ditemukan: $Source" -ForegroundColor Red
    Write-Host "Simpan logo Anda sebagai $Source lalu jalankan ulang skrip ini."
    exit 1
}

$outDir = "public\icons"
New-Item -ItemType Directory -Force $outDir | Out-Null

$img = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
foreach ($size in @(192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Sisakan padding 8% agar aman untuk ikon maskable Android
    $pad = [int]($size * 0.08)
    $inner = $size - (2 * $pad)
    $ratio = [Math]::Min($inner / $img.Width, $inner / $img.Height)
    $w = [int]($img.Width * $ratio)
    $h = [int]($img.Height * $ratio)
    $x = [int](($size - $w) / 2)
    $y = [int](($size - $h) / 2)

    $g.DrawImage($img, $x, $y, $w, $h)
    $g.Dispose()
    $bmp.Save("$outDir\icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "OK: $outDir\icon-$size.png"
}
$img.Dispose()

Write-Host "Selesai. Jalankan 'npm run build' lalu deploy ulang agar ikon baru terpasang." -ForegroundColor Green
