$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$extension = Join-Path $root "extension"
$dist = Join-Path $root "dist"
$manifestPath = Join-Path $extension "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing manifest.json at $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$zipName = "gmail-guard-$($manifest.version).zip"
$zipPath = Join-Path $dist $zipName

if (Test-Path -LiteralPath $dist) {
    Remove-Item -LiteralPath $dist -Recurse -Force
}

New-Item -ItemType Directory -Path $dist -Force | Out-Null
$packageItems = Get-ChildItem -LiteralPath $extension -Force
if ($packageItems.Count -eq 0) {
    throw "Extension folder is empty: $extension"
}

Compress-Archive -Path $packageItems.FullName -DestinationPath $zipPath -CompressionLevel Optimal

Write-Output $zipPath
