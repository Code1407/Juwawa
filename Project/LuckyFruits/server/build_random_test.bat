@echo off
setlocal

rem Always run relative to this script so double-click and command-line runs behave the same.
cd /d "%~dp0" || (
    echo [ERROR] Cannot enter script directory: %~dp0
    exit /b 1
)

set "GAME_SERVER=GameSvr.exe"
set "TEST_CONFIG=RandomTest.cfg"
set "TEST_OUTPUT=output_luckyfruits.csv"

if not exist "%GAME_SERVER%" (
    echo [ERROR] Missing %GAME_SERVER%
    goto :failed
)
if not exist "%TEST_CONFIG%" (
    echo [ERROR] Missing %TEST_CONFIG%
    goto :failed
)

rem Remove the previous report first. If Excel is holding it open, fail clearly
rem instead of treating stale data as the result of the new test run.
if exist "%TEST_OUTPUT%" del /q "%TEST_OUTPUT%" >nul 2>&1
if exist "%TEST_OUTPUT%" (
    echo [ERROR] Cannot replace %TEST_OUTPUT%. Close it in Excel and run again.
    goto :failed
)

echo [INFO] Running LuckyFruits payout-rate test...
"%GAME_SERVER%" -config "%TEST_CONFIG%"
if errorlevel 1 (
    echo [ERROR] RandomTest failed with exit code %ERRORLEVEL%.
    goto :failed
)
if not exist "%TEST_OUTPUT%" (
    echo [ERROR] RandomTest finished but did not create %TEST_OUTPUT%.
    goto :failed
)

set "RTP_RESULT="
for /f "usebackq skip=3 tokens=2 delims=," %%R in ("%TEST_OUTPUT%") do if not defined RTP_RESULT set "RTP_RESULT=%%R"
if defined RTP_RESULT echo [RESULT] RTP: %RTP_RESULT%
echo [OK] Report generated: %CD%\%TEST_OUTPUT%
if /i not "%~1"=="--no-pause" pause
exit /b 0

:failed
if /i not "%~1"=="--no-pause" pause
exit /b 1
