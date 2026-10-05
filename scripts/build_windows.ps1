# Builds IVMS for Windows x64: dist/windows/IVMS/ (app folder) and dist/windows/IVMS-<version>-x64-setup.exe.
# PostgreSQL is not bundled: users install it from https://www.postgresql.org/download/windows/
#
#   pwsh scripts/build_windows.ps1
#
# Needs: PowerShell 7.3+, Node.js (frontend build), uv, Inno Setup 6 (installed with Chocolatey if missing).
# Unsigned: Windows SmartScreen warns on first run until the installer is code-signed.
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true # fail on non-zero exit codes of npm, uv, ...
Set-Location (Split-Path $PSScriptRoot)

$MediaMtxVersion = '1.21.1'
# From https://github.com/bluenviron/mediamtx/releases/tag/v1.21.1 (checksums.sha256)
$MediaMtxSha256 = 'faa97974861eb75a68b5aa326c78e7e7a6f670b5ef191bace78e715130381f23'

$version = (Select-String -Path pyproject.toml -Pattern '^version = "(.*)"' | Select-Object -First 1).Matches.Groups[1].Value
$build = 'build/windows'
$out = 'dist/windows'
New-Item -ItemType Directory -Force $build, $out | Out-Null

Write-Host '==> Web UI'
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build

Write-Host "==> MediaMTX $MediaMtxVersion"
$zip = "$build/mediamtx_v${MediaMtxVersion}_windows_amd64.zip"
if (-not (Test-Path $zip)) {
  Invoke-WebRequest -OutFile $zip `
    "https://github.com/bluenviron/mediamtx/releases/download/v$MediaMtxVersion/mediamtx_v${MediaMtxVersion}_windows_amd64.zip"
}
if ((Get-FileHash -Algorithm SHA256 $zip).Hash -ne $MediaMtxSha256) {
  Remove-Item $zip
  throw 'MediaMTX checksum mismatch'
}
Expand-Archive -Force $zip "$build/mediamtx"
Copy-Item -Force "$build/mediamtx/mediamtx.exe" "$build/mediamtx.exe"

Write-Host '==> App folder'
uv sync --group desktop
uv run --group desktop pyinstaller packaging/windows/IVMS.spec `
  --noconfirm --clean --distpath $out --workpath "$build/pyinstaller"

Write-Host '==> Installer'
$iscc = (Get-Command iscc.exe -ErrorAction SilentlyContinue).Source
if (-not $iscc) { $iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe" }
if (-not (Test-Path $iscc)) {
  choco install innosetup --yes --no-progress
  $iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
}
& $iscc /Qp "/DAppVersion=$version" packaging/windows/installer.iss

Write-Host ''
Write-Host "Done: $out/IVMS-$version-x64-setup.exe"
Get-ChildItem $out -File | Format-Table Name, Length
