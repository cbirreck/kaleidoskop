@echo off
REM Desktop-Verknuepfung fuer den Alltag. Die Logik steht in bin\kaleidoskop.ps1 --
REM diese Datei leitet nur weiter, damit es nicht zwei Starter gibt, die auseinanderlaufen.
REM
REM Wenn "Kaleidoskop gucken" bedeutet, erst ein Terminal zu oeffnen, benutzen wir es
REM dreimal und nie wieder.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bin\kaleidoskop.ps1" %*

REM Beim Doppelklick schliesst sich das Fenster sofort. Bei einem Fehler soll man
REM lesen koennen, was schiefging.
if errorlevel 1 pause
