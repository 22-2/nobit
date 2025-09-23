# e2e-setup.ps1
# This script prepares the Obsidian E2E testing environment for Windows.
# It unpacks Obsidian, builds the plugin, links it to the test vault,
# and prompts the user to manually set up the vault in the unpacked Obsidian.

# Strict mode for error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Configuration ---
# You might need to adjust these paths based on your Obsidian installation
$ObsidianAppExePath = "C:\Users\17890\AppData\Local\Programs\obsidian\Obsidian.exe" # Obsidian.exe のフルパス
$ElectronCliPath = "C:\Users\17890\AppData\Local\nvm\nodejs\node.exe" # nvm for Windows を使っている場合の electron CLI への node.exe パス
# または npx がPATHにあるなら "npx"
$VaultName = "e2e-vault" # テスト用Vaultの名前
# --- End Configuration ---

# Resolve script directory (monorepo root)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$VaultPath = Join-Path $ScriptDir $VaultName
$ObsidianUnpackedPath = Join-Path $ScriptDir ".obsidian-unpacked"
$PluginPath = Join-Path $VaultPath ".obsidian\plugins\nobit" # プラグインIDに合わせて修正

# --- Path Validation ---
if (-not (Test-Path $ObsidianAppExePath)) {
    Write-Host "Error: Obsidian.exe not found at $ObsidianAppExePath. Please update the script with the correct path." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $VaultPath -PathType Container)) {
    Write-Host "Creating test vault directory: $VaultPath"
    New-Item -Path $VaultPath -ItemType Directory | Out-Null
}

# --- 1. Unpack Obsidian ---
Write-Host "`nUnpacking Obsidian from $ObsidianAppExePath to $ObsidianUnpackedPath..." -ForegroundColor Green
Remove-Item -Path $ObsidianUnpackedPath -Recurse -Force -ErrorAction SilentlyContinue

# Obsidian.exe の場所から app.asar を特定
# 通常、Obsidian.exeと同じディレクトリか、その下のResourcesにある
# AppImageのような単一ファイルではなく、Windowsインストール版の構造を仮定
$ObsidianBaseDir = Split-Path $ObsidianAppExePath -Parent
$AsarPath = Join-Path $ObsidianBaseDir "resources\app.asar"
$ObsidianAsarPath = Join-Path $ObsidianBaseDir "resources\obsidian.asar" # 通常のObsidian起動用asar

if (-not (Test-Path $AsarPath)) {
    # 例: C:\Program Files\Obsidian\resources\app.asar のようなパスを試す
    $AsarPath = Join-Path (Join-Path (Split-Path $ObsidianAppExePath -Parent) "resources") "app.asar"
    $ObsidianAsarPath = Join-Path (Join-Path (Split-Path $ObsidianAppExePath -Parent) "resources") "obsidian.asar"
}

if (-not (Test-Path $AsarPath)) {
    Write-Host "Error: app.asar not found for Obsidian at expected paths. Please verify Obsidian installation or update script." -ForegroundColor Red
    exit 1
}

# @electron/asar ツールを npx 経由で実行
Invoke-Expression "npx `@electron/asar` extract `"$AsarPath`" `"$ObsidianUnpackedPath`""
Copy-Item -Path $ObsidianAsarPath -Destination $ObsidianUnpackedPath -Force | Out-Null
Write-Host "Done." -ForegroundColor Green

# --- 2. Build Plugin ---
Write-Host "`nBuilding plugin..." -ForegroundColor Green
& { Push-Location $ScriptDir; pnpm build; Pop-Location } | Out-Null # モノレポのルートでpnpm buildを実行
Write-Host "Done." -ForegroundColor Green

# --- 3. Link Built Plugin ---
Write-Host "`nLinking built plugin to $PluginPath..." -ForegroundColor Green
if (-not (Test-Path $PluginPath -PathType Container)) {
    New-Item -Path $PluginPath -ItemType Directory | Out-Null
}
New-Item -ItemType SymbolicLink -Path $PluginPath -Target (Join-Path $ScriptDir "apps\obsidian-plugin\dist") -Force | Out-Null
Write-Host "Done." -ForegroundColor Green

# --- 4. Launch Unpacked Obsidian and Manual Setup Prompt ---
Write-Host "`nObsidian will now start. Please" -ForegroundColor Yellow
Write-Host "  - open $VaultPath as a vault," -ForegroundColor Yellow
Write-Host "  - go to 'Settings (歯車アイコン) -> Community plugins'," -ForegroundColor Yellow
Write-Host "  - turn 'Restricted mode' OFF," -ForegroundColor Yellow
Write-Host "  - enable the 'Nobit' plugin," -ForegroundColor Yellow
Write-Host "  - then close Obsidian." -ForegroundColor Yellow
Write-Host "Press [ENTER] to continue..." -ForegroundColor Cyan

$null = Read-Host

# 抽出したObsidianを実行 (npx electron は npx electron.cmd を起動)
# `npx electron` が PATH にない場合、node.exe のフルパスを指定する
# 例: `"$ElectronCliPath" `"$ObsidianUnpackedPath\main.js`"`
Write-Host "`nLaunching unpacked Obsidian for manual setup..." -ForegroundColor Green
Start-Process -FilePath "npx.cmd" -ArgumentList @("electron", (Join-Path $ObsidianUnpackedPath "main.js")) -NoNewWindow -ErrorAction SilentlyContinue

Write-Host "Manual setup completed. You can now run your Playwright tests." -ForegroundColor Green
