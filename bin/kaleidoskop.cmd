@echo off
REM Shim fuer cmd.exe, Win+R und die Explorer-Adressleiste: PowerShell findet
REM kaleidoskop.ps1 selbst im PATH, cmd.exe kann das nicht (.PS1 fehlt in PATHEXT).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0kaleidoskop.ps1" %*
