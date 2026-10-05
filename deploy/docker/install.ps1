# Installs or updates IVMS with Docker Desktop on Windows. Run from this folder: .\install.ps1
# Options: -Image <ref>  use this image (default: IVMS_IMAGE from .env)
#          -Load <file>  load an offline image archive (docker save) first
param([string]$Image = "", [string]$Load = "")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker Desktop is required: https://docs.docker.com/desktop/setup/install/windows-install/"
}

function New-Secret([int]$Length) {
    $chars = [char[]]"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $bytes = [byte[]]::new($Length)
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

if (-not (Test-Path .env)) { Copy-Item .env.example .env; Write-Host "Created .env" }
$lines = Get-Content .env
function Get-Var($Key) { ($lines | Where-Object { $_ -match "^$Key=" }) -replace "^$Key=", "" }
function Set-Var($Key, $Value) { $script:lines = $lines | ForEach-Object { if ($_ -match "^$Key=") { "$Key=$Value" } else { $_ } } }

# Fill only empty secrets: an existing install keeps its own
foreach ($key in "POSTGRES_PASSWORD", "SECRET_KEY", "JWT_SECRET") {
    if (-not (Get-Var $key)) { Set-Var $key (New-Secret 48) }
}
if ($Image) { Set-Var "IVMS_IMAGE" $Image }
Set-Content .env $lines

if ($Load) { docker load --input $Load } else { docker compose pull }
if ($LASTEXITCODE) { exit $LASTEXITCODE }
docker compose up --detach --wait
if ($LASTEXITCODE) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "IVMS is running: http://localhost:$(Get-Var 'IVMS_PORT')"
Write-Host "First visit: create the admin account. Logs: docker compose logs -f app"
