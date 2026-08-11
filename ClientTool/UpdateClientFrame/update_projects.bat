@echo off
chcp 65001 >nul
setlocal

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%update_projects.ps1
set CONFIG_FILE=%SCRIPT_DIR%config.json

if not exist "%PS_SCRIPT%" (
    echo [错误] 未找到脚本: %PS_SCRIPT%
    pause
    exit /b 1
)

if not exist "%CONFIG_FILE%" (
    echo [错误] 未找到配置文件: %CONFIG_FILE%
    pause
    exit /b 1
)

echo.
echo ==========================================
echo 开始更新 Cocos 项目工程文件
echo 配置文件: %CONFIG_FILE%
echo ==========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -ConfigPath "%CONFIG_FILE%"

echo.
echo ==========================================
echo 执行结束
echo ==========================================
pause
endlocal