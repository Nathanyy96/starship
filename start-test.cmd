@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  start "" "%~dp0test.html"
  exit /b 0
)
start "Starship Gacha Server" /b node "%~dp0serve.mjs"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8080/test.html
