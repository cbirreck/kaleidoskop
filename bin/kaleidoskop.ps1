<#
.SYNOPSIS
    Startet das Kaleidoskop im Edge-Kiosk-Modus.

.DESCRIPTION
    Sucht den Projektordner relativ zu dieser Datei, baut bei Bedarf neu und oeffnet
    dist/index.html in Edge: Vollbild, keine Tabs, keine Adressleiste, kein X zum
    Wegklicken.

    Der Neubau passiert von selbst, wenn eine Quelldatei juenger ist als der Build.
    Ohne das startet man irgendwann ahnungslos einen alten Stand und sucht den Fehler
    im Code statt im Build.

.PARAMETER Rebuild
    Baut neu, auch wenn der Build aktuell aussieht.

.PARAMETER Windowed
    Normales Edge-Fenster statt Kiosk. Fuer die Fehlersuche: im Kiosk gibt es keine
    Entwicklertools.

.PARAMETER Restart
    Beendet eine laufende Instanz und startet neu, statt sie nur zu melden.

.EXAMPLE
    kaleidoskop
    Startet den Kiosk, baut vorher neu falls noetig.

.EXAMPLE
    kaleidoskop -Windowed
    Startet im normalen Fenster, mit F12 erreichbaren Entwicklertools.
#>
[CmdletBinding()]
param(
    [switch]$Rebuild,
    [switch]$Windowed,
    [switch]$Restart
)

$ErrorActionPreference = "Stop"

function Fail-With([string]$message) {
    Write-Host $message -ForegroundColor Red
    exit 1
}

# Projektordner liegt eine Ebene ueber diesem Skript -- damit funktioniert der Aufruf
# aus jedem Verzeichnis, auch ueber den PATH.
$root = Split-Path -Parent $PSScriptRoot
$page = Join-Path $root "dist\index.html"

if (-not (Test-Path (Join-Path $root "package.json"))) {
    Fail-With "Kein Projekt gefunden. Erwartet wurde package.json in: $root"
}

# --- Laeuft schon eine Instanz? ---------------------------------------------------
# Zwei Kiosk-Fenster uebereinander sind nicht offensichtlich, aber sehr verwirrend.
$running = @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*kaleidoskop*dist*index.html*' })

if ($running.Count -gt 0) {
    if (-not $Restart) {
        Write-Host "Kaleidoskop laeuft bereits (PID $($running[0].ProcessId))." -ForegroundColor Yellow
        Write-Host "Mit -Restart neu starten." -ForegroundColor DarkGray
        exit 0
    }
    Write-Host "Beende laufende Instanz ..." -ForegroundColor DarkGray
    foreach ($proc in $running) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 700
}

# --- Build aktuell? ---------------------------------------------------------------
$watched = @()
$srcDir = Join-Path $root "src"
if (Test-Path $srcDir) {
    $watched += Get-ChildItem -Path $srcDir -File -Recurse -ErrorAction SilentlyContinue
}
foreach ($name in @("index.html", "package.json", "vite.config.ts", "tsconfig.json")) {
    $candidate = Join-Path $root $name
    if (Test-Path $candidate) { $watched += Get-Item $candidate }
}

$newest = $watched | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$buildMissing = -not (Test-Path $page)
$buildStale = (-not $buildMissing) -and $newest -and ((Get-Item $page).LastWriteTime -lt $newest.LastWriteTime)

if ($Rebuild -or $buildMissing -or $buildStale) {
    if ($buildMissing) { Write-Host "Kein Build vorhanden, baue ..." -ForegroundColor Cyan }
    elseif ($buildStale) { Write-Host "Build ist aelter als $($newest.Name), baue neu ..." -ForegroundColor Cyan }
    else { Write-Host "Baue neu (-Rebuild) ..." -ForegroundColor Cyan }

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Fail-With "npm ist nicht im PATH, der Build kann nicht laufen. Node.js installiert?"
    }

    Push-Location $root
    try { & npm run build } finally { Pop-Location }

    if ($LASTEXITCODE -ne 0) { Fail-With "npm run build ist fehlgeschlagen (Exitcode $LASTEXITCODE)." }
    if (-not (Test-Path $page)) { Fail-With "Der Build lief durch, aber $page fehlt trotzdem." }
}

# --- Edge finden ------------------------------------------------------------------
$edge = @(
    (Join-Path ${env:ProgramFiles(x86)} "Microsoft\Edge\Application\msedge.exe"),
    (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe")
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if (-not $edge) { Fail-With "Edge nicht gefunden. Pfad in diesem Skript anpassen." }

# --- Starten ----------------------------------------------------------------------
$url = "file:///" + ($page -replace '\\', '/')

# Guertel und Hosentraeger gegen Edge-Einblendungen: die Seite traegt zwar selbst
# notranslate, aber im Kiosk soll gar nichts erst aufpoppen koennen.
$common = @(
    "--no-first-run",
    "--disable-features=Translate,msTranslate",
    "--disable-translate-new-ux",
    "--no-default-browser-check"
)

if ($Windowed) {
    $edgeArgs = @("--new-window", "--start-maximized") + $common + @($url)
    $mode = "Fenster-Modus (F12 fuer die Entwicklertools)"
} else {
    $edgeArgs = @("--kiosk", "--edge-kiosk-type=fullscreen") + $common + @($url)
    $mode = "Kiosk-Vollbild (Alt+F4 zum Schliessen)"
}

$proc = Start-Process -FilePath $edge -ArgumentList $edgeArgs -PassThru
Write-Host "Kaleidoskop gestartet - $mode" -ForegroundColor Green
Write-Host "PID $($proc.Id)  |  $page" -ForegroundColor DarkGray
exit 0
