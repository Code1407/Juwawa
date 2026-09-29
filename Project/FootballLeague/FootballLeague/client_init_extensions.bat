@echo off
setlocal enabledelayedexpansion

REM =========================
REM Cocos Creator Extensions init script
REM Place this file at project root (same level as assets/extensions)
REM =========================

cd /d "%~dp0"

if not exist "extensions" (
  echo [ERROR] extensions folder not found at: "%cd%\extensions"
  exit /b 1
)

REM Optional: check node & npm
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js and ensure it is in PATH.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found. Please ensure Node.js npm is in PATH.
  exit /b 1
)

echo.
echo [INFO] Initializing extensions dependencies...
echo [INFO] Project root: %cd%
echo.

REM Loop all folders under extensions
for /d %%D in ("extensions\*") do (
  if exist "%%D\package.json" (
    echo ==========================================
    echo [INFO] Installing: %%~nxD
    echo [INFO] Path: %%D

    pushd "%%D"

    REM Prefer npm ci if package-lock.json exists (more reproducible)
    if exist "package-lock.json" (
      echo [INFO] Using: npm ci
      call npm ci
    ) else (
      echo [INFO] Using: npm install
      call npm install
    )

    if errorlevel 1 (
      echo [ERROR] Install failed in: %%D
      popd
      exit /b 1
    )

    popd
  ) else (
    REM no package.json, skip
    REM echo [SKIP] %%~nxD (no package.json)
  )
)

echo.
echo [OK] All extensions initialized successfully.
pause
exit /b 0