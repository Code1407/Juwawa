@echo off
setlocal

set CONFIG=RandomTest.cfg

if "%1"=="full" (
    set CONFIG=RandomTest_full.cfg
) else if "%1"=="quick" (
    set CONFIG=RandomTest_quick.cfg
)

echo Running RandomTest with config: %CONFIG%
GameSvr.exe -config %CONFIG%
PAUSE
