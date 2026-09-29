@echo off
setlocal
cd /d "%~dp0"

rem Do not run RandomTest while a production GameSvr is active.
powershell.exe -NoProfile -Command "if (Get-Process -Name GameSvr -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 2 (
    echo RandomTest was not started: unable to determine whether GameSvr.exe is running.
    exit /b 1
)
if not errorlevel 1 (
    echo RandomTest was not started: an existing GameSvr.exe is running.
    echo Stop the game server first, then rerun this script.
    exit /b 1
)

rem Each round samples three scenes; use low priority and one logical CPU.
start "FootballLeague RandomTest" /low /affinity 1 /wait GameSvr.exe -config RandomTest.cfg
set "testExitCode=%ERRORLEVEL%"

if exist scene_rtp.csv type scene_rtp.csv
if not "%testExitCode%"=="0" echo RandomTest exited with code %testExitCode%.

endlocal & exit /b %testExitCode%
