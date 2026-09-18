@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto OFFLINE
start "Starship Gacha Server" /b node "%~dp0serve.mjs"
for /L %%i in (1,1,10) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8080/admin.html -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 goto OPEN_PAGE
  timeout /t 1 /nobreak >nul
)
:OFFLINE
start "" "%~dp0admin.html"
goto END
:OPEN_PAGE
start "" http://127.0.0.1:8080/admin.html
:END
pause
