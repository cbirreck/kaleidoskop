@echo off
REM Startet das Kaleidoskop im Edge-Kiosk-Modus: Vollbild, keine Tabs,
REM keine Adressleiste, kein X zum Wegklicken.
REM
REM Diese Datei als Verknuepfung auf den Desktop legen. Wenn "Kaleidoskop gucken"
REM bedeutet, erst ein Terminal zu oeffnen, benutzen wir es dreimal und nie wieder.

set "PAGE=%~dp0dist\index.html"

if not exist "%PAGE%" (
  echo Kein Build gefunden. Bitte einmal "npm run build" ausfuehren.
  pause
  exit /b 1
)

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
  echo Edge nicht gefunden. Pfad in dieser Datei anpassen.
  pause
  exit /b 1
)

start "" "%EDGE%" --kiosk "file:///%PAGE:\=/%" --edge-kiosk-type=fullscreen --no-first-run
