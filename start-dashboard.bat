@echo off
REM Amazon Pillow Tracker - Dashboard Launcher

cd /d "%~dp0"

REM === Smart sync: skips if DB already newer than Excel ===
echo Checking data freshness...
call pnpm sync
if errorlevel 1 (
    echo.
    echo SYNC FAILED. Continuing with existing data...
    timeout /t 3 /nobreak >nul
)
echo.

REM If dev server already running, just open browser
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    start "" "http://localhost:3000"
    exit /b 0
)

echo ========================================
echo  Amazon Pillow Tracker - Starting...
echo ========================================
echo.
echo Server window will minimize.
echo Browser will open when ready (up to 30s).
echo To stop: close the minimized "Tracker Server" window.
echo.

REM Start dev server in a minimized window
start "Tracker Server" /min cmd /k "pnpm dev"

REM Wait for port 3000 to listen
for /l %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 (
        start "" "http://localhost:3000"
        exit /b 0
    )
)

echo.
echo Server did not start within 30 seconds.
echo Check the "Tracker Server" window for errors.
pause
exit /b 1
