param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "[OK]   $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "[ERR]  $msg" -ForegroundColor Red
}

try {
    if (-not (Test-Path $ConfigPath)) {
        throw "Config file not found: $ConfigPath"
    }

    Write-Info "Reading config: $ConfigPath"
    $config = Get-Content -Path $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json

    if (-not $config.projectsPath) {
        throw "config.json missing projectsPath"
    }

    if (-not $config.FrameConfig) {
        throw "config.json missing FrameConfig"
    }

    if (-not $config.FrameConfig.name) {
        throw "config.json missing FrameConfig.name"
    }

    if (-not $config.FrameConfig.updates -or $config.FrameConfig.updates.Count -eq 0) {
        throw "config.json missing FrameConfig.updates or it is empty"
    }

    if (-not $config.projects -or $config.projects.Count -eq 0) {
        throw "config.json missing projects or it is empty"
    }

    $projectsPath = $config.projectsPath
    $frameName = $config.FrameConfig.name
    $updates = $config.FrameConfig.updates
    $projects = $config.projects

    $frameRoot = Join-Path $projectsPath $frameName

    if (-not (Test-Path $frameRoot)) {
        throw "Framework project not found: $frameRoot"
    }

    Write-Info "Framework project: $frameRoot"
    Write-Info "Projects to update: $($projects -join ', ')"
    Write-Info "Update paths:"
    foreach ($u in $updates) {
        Write-Host "       - $u"
    }
    Write-Host ""

    foreach ($projectName in $projects) {
        $projectRoot = Join-Path (Join-Path $projectsPath $projectName) $projectName

        Write-Host "------------------------------------------" -ForegroundColor DarkGray
        Write-Info "Processing project: $projectName"
        Write-Info "Project path: $projectRoot"

        if (-not (Test-Path $projectRoot)) {
            Write-Warn "Project path not found, skipped: $projectRoot"
            continue
        }

        foreach ($relativePath in $updates) {
            $srcPath = Join-Path $frameRoot $relativePath
            $dstPath = Join-Path $projectRoot $relativePath

            Write-Info "Sync: $relativePath"

            if (-not (Test-Path $srcPath)) {
                Write-Warn "Source path not found, skipped: $srcPath"
                continue
            }

            $srcItem = Get-Item $srcPath

            if ($srcItem.PSIsContainer) {
                if (Test-Path $dstPath) {
                    Write-Info "Removing target folder: $dstPath"
                    Remove-Item -Path $dstPath -Recurse -Force
                }

                $dstParent = Split-Path $dstPath -Parent
                if (-not (Test-Path $dstParent)) {
                    Write-Info "Creating parent folder: $dstParent"
                    New-Item -ItemType Directory -Path $dstParent -Force | Out-Null
                }

                Write-Info "Copy folder: $srcPath -> $dstPath"
                Copy-Item -Path $srcPath -Destination $dstPath -Recurse -Force
                Write-Success "Folder synced: $relativePath"
            }
            else {
                $dstParent = Split-Path $dstPath -Parent
                if (-not (Test-Path $dstParent)) {
                    Write-Info "Creating parent folder: $dstParent"
                    New-Item -ItemType Directory -Path $dstParent -Force | Out-Null
                }

                Write-Info "Copy file: $srcPath -> $dstPath"
                Copy-Item -Path $srcPath -Destination $dstPath -Force
                Write-Success "File synced: $relativePath"
            }
        }

        Write-Success "Project done: $projectName"
        Write-Host ""
    }

    Write-Success "All done"
}
catch {
    Write-Err $_.Exception.Message
    exit 1
}