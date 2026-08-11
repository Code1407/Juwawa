@echo off
setlocal EnableExtensions

chcp 65001 >nul

set "ROOT=%~dp0"
set "CONFIG=%ROOT%build-config.json"
set "TOOL_CONFIG=%ROOT%build_tool.json"

if "%~1"=="" (
  powershell -NoProfile -STA -ExecutionPolicy Bypass ^
    -File "%ROOT%build-ui.ps1" ^
    -ConfigPath "%CONFIG%" ^
    -ToolConfigPath "%TOOL_CONFIG%" ^
    -AutoBuildPath "%ROOT%autobuild.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass ^
    -File "%ROOT%autobuild.ps1" ^
    -ConfigPath "%CONFIG%" ^
    -ToolConfigPath "%TOOL_CONFIG%" ^
    %*
)
set "EC=%ERRORLEVEL%"

echo.
pause
endlocal
exit /b %EC%
