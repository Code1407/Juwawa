param(
  [Parameter(Mandatory=$true)][string]$ConfigPath,
  [string]$ToolConfigPath = "",
  [string]$CreatorExe = "",
  [string]$CreatorExe24 = "",
  [Parameter(ValueFromRemainingArguments=$true)]
  [string[]]$Packages
)

# ===================== UTF-8 (fix Chinese garbled) =====================
try {
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
} catch {}

# ===================== Helpers =====================
function Die([string]$msg) {
  Write-Host $msg -ForegroundColor Red
  exit 1
}

function Ensure-File([string]$p, [string]$errMsg) {
  if (-not (Test-Path -LiteralPath $p)) { Die $errMsg }
}

function Ensure-Dir([string]$p, [string]$errMsg) {
  if (-not (Test-Path -LiteralPath $p)) { Die $errMsg }
}

function Stop-ProcessTree {
  param(
    [int]$ProcessId
  )

  if ($ProcessId -le 0) { return }

  try {
    & taskkill.exe /PID $ProcessId /T /F | Out-Null
  } catch {
    try {
      Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    } catch {}
  }
}

function Test-LogPatterns {
  param(
    [string]$LogPath,
    [string[]]$Patterns = @(),
    [int]$Tail = 200
  )

  if ([string]::IsNullOrWhiteSpace($LogPath)) { return $null }
  if ($null -eq $Patterns -or $Patterns.Count -eq 0) { return $null }
  if (-not (Test-Path -LiteralPath $LogPath)) { return $null }

  try {
    $lines = if ($Tail -gt 0) {
      Get-Content -LiteralPath $LogPath -Tail $Tail -Encoding UTF8 -ErrorAction SilentlyContinue
    } else {
      Get-Content -LiteralPath $LogPath -Encoding UTF8 -ErrorAction SilentlyContinue
    }
    foreach ($pattern in $Patterns) {
      if ($lines -match $pattern) { return $pattern }
    }
  } catch {}

  return $null
}

function Start-ProcessWithTimeout {
  param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(Mandatory=$true)][string[]]$ArgumentList,
    [Parameter(Mandatory=$true)][string]$StdOutPath,
    [Parameter(Mandatory=$true)][string]$StdErrPath,
    [int]$TimeoutSeconds = 0,
    [string]$SuccessLogPath = "",
    [string[]]$SuccessPatterns = @(),
    [string[]]$FailurePatterns = @(),
    [int]$SuccessExitGraceSeconds = 30,
    [string]$DisplayName = "process"
  )

  $proc = Start-Process -FilePath $FilePath `
                        -ArgumentList $ArgumentList `
                        -NoNewWindow `
                        -PassThru `
                        -RedirectStandardOutput $StdOutPath `
                        -RedirectStandardError  $StdErrPath

  Write-Host ("[RUNNING] {0}, PID={1}" -f $DisplayName, $proc.Id) -ForegroundColor DarkGray
  Write-Host ("[RUNNING] stdout log: {0}" -f $StdOutPath) -ForegroundColor DarkGray

  $timedOut = $false
  $killedAfterSuccess = $false
  $successDetected = $false
  $failureDetected = $false
  $failurePattern = $null
  $lastStatusAt = [DateTime]::UtcNow

  if ($TimeoutSeconds -le 0 -and ($null -eq $SuccessPatterns -or $SuccessPatterns.Count -le 0)) {
    $proc.WaitForExit()
  } else {
    $watch = [Diagnostics.Stopwatch]::StartNew()
    while (-not $proc.HasExited) {
      if (-not $failureDetected) {
        $hitFailure = Test-LogPatterns -LogPath $StdOutPath -Patterns $FailurePatterns -Tail 120
        if ($null -eq $hitFailure) {
          $hitFailure = Test-LogPatterns -LogPath $StdErrPath -Patterns $FailurePatterns -Tail 120
        }
        if ($null -ne $hitFailure) {
          $failureDetected = $true
          $failurePattern = $hitFailure
          Write-Host ("[ERROR] {0} failure marker detected: {1}" -f $DisplayName, $failurePattern) -ForegroundColor Red
        }
      }

      if (-not $successDetected -and
          -not $failureDetected -and
          -not [string]::IsNullOrWhiteSpace($SuccessLogPath) -and
          $null -ne $SuccessPatterns -and
          $SuccessPatterns.Count -gt 0 -and
          (Test-Path -LiteralPath $SuccessLogPath)) {
        $hitSuccess = Test-LogPatterns -LogPath $SuccessLogPath -Patterns $SuccessPatterns -Tail 120
        if ($null -ne $hitSuccess) {
          $successDetected = $true
          Write-Host ("[INFO] {0} success marker detected; waiting {1}s for Creator to exit." -f $DisplayName, $SuccessExitGraceSeconds) -ForegroundColor DarkGray
        }
      }

      if ($successDetected) {
        if (-not $proc.WaitForExit($SuccessExitGraceSeconds * 1000)) {
          $killedAfterSuccess = $true
          Write-Host ("[WARN] {0} did not exit after success, killing process tree: PID={1}" -f $DisplayName, $proc.Id) -ForegroundColor Yellow
          Stop-ProcessTree -ProcessId $proc.Id
          try { $proc.WaitForExit(10000) | Out-Null } catch {}
        }
        break
      }

      if ($TimeoutSeconds -gt 0 -and $watch.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
        $timedOut = $true
        Write-Host ("[TIMEOUT] {0} exceeded {1}s, killing process tree: PID={2}" -f $DisplayName, $TimeoutSeconds, $proc.Id) -ForegroundColor Red
        Stop-ProcessTree -ProcessId $proc.Id
        try { $proc.WaitForExit(10000) | Out-Null } catch {}
        break
      }

      $now = [DateTime]::UtcNow
      if (($now - $lastStatusAt).TotalSeconds -ge 30) {
        $lastStatusAt = $now
        $elapsed = [int]$watch.Elapsed.TotalSeconds
        Write-Host ("[WAIT] {0} still running... elapsed={1}s, PID={2}" -f $DisplayName, $elapsed, $proc.Id) -ForegroundColor DarkGray
      }

      Start-Sleep -Seconds 2
    }
  }

  if (-not $failureDetected) {
    $hitFailure = Test-LogPatterns -LogPath $StdOutPath -Patterns $FailurePatterns -Tail 400
    if ($null -eq $hitFailure) {
      $hitFailure = Test-LogPatterns -LogPath $StdErrPath -Patterns $FailurePatterns -Tail 400
    }
    if ($null -ne $hitFailure) {
      $failureDetected = $true
      $failurePattern = $hitFailure
    }
  }

  if (-not $successDetected -and
      -not $failureDetected -and
      -not [string]::IsNullOrWhiteSpace($SuccessLogPath) -and
      $null -ne $SuccessPatterns -and
      $SuccessPatterns.Count -gt 0 -and
      (Test-Path -LiteralPath $SuccessLogPath)) {
    $hitSuccess = Test-LogPatterns -LogPath $SuccessLogPath -Patterns $SuccessPatterns -Tail 400
    if ($null -ne $hitSuccess) { $successDetected = $true }
  }

  $exitCode = $null
  if ($timedOut) {
    $exitCode = -999
  } elseif ($failureDetected) {
    $exitCode = -997
  } elseif ($successDetected) {
    $exitCode = 0
  } else {
    try { $exitCode = $proc.ExitCode } catch { $exitCode = $null }
    if ($null -eq $exitCode) { $exitCode = -998 }
  }

  return [PSCustomObject]@{
    Process            = $proc
    TimedOut           = $timedOut
    KilledAfterSuccess = $killedAfterSuccess
    SuccessDetected    = $successDetected
    FailureDetected    = $failureDetected
    FailurePattern     = $failurePattern
    ExitCode           = $exitCode
  }
}

function Safe-FileName([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return "NONAME" }
  $invalid = [IO.Path]::GetInvalidFileNameChars()
  $out = $name
  foreach ($c in $invalid) { $out = $out.Replace($c, '_') }
  return $out
}

function Is-UUID([string]$s) {
  return ($s -match '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
}

function Normalize-ConfigPathValue([string]$s) {
  if ($null -eq $s) { return "" }
  return (($s -replace '[\r\n\t]', '')).Trim()
}

function Get-RelativePathSafe {
  param(
    [string]$BasePath,
    [string]$FullPath
  )

  $baseFull = [IO.Path]::GetFullPath($BasePath).TrimEnd('\') + '\'
  $targetFull = [IO.Path]::GetFullPath($FullPath)
  $baseUri = [Uri]$baseFull
  $targetUri = [Uri]$targetFull
  return [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString()).Replace('/', '\')
}

function Remove-FileIfExists {
  param(
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  if (-not (Test-Path -LiteralPath $Path)) { return }

  try {
    Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
  } catch {}
}

function Cleanup-GameConfigArtifacts {
  param(
    [string]$ConfigPath,
    [string]$BackupPath
  )

  if (-not [string]::IsNullOrWhiteSpace($BackupPath)) {
    Remove-FileIfExists -Path $BackupPath
    Remove-FileIfExists -Path "$BackupPath.meta"
  }

  if (-not [string]::IsNullOrWhiteSpace($ConfigPath)) {
    Remove-FileIfExists -Path "$ConfigPath.buildtool.bak"
    Remove-FileIfExists -Path "$ConfigPath.buildtool.bak.meta"
  }
}

function Remove-OutputDirSafe {
  param(
    [string]$OutputDir,
    [string]$ExportRoot,
    [string]$LogsDir
  )

  if ([string]::IsNullOrWhiteSpace($OutputDir)) { return }
  if (-not (Test-Path -LiteralPath $OutputDir)) { return }

  $outputFull = [IO.Path]::GetFullPath($OutputDir)
  $exportFull = [IO.Path]::GetFullPath($ExportRoot)
  $logsFull = if ([string]::IsNullOrWhiteSpace($LogsDir)) { "" } else { [IO.Path]::GetFullPath($LogsDir) }
  $exportPrefix = $exportFull.TrimEnd('\') + '\'

  if ($outputFull.Equals($exportFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    Die ("[ERROR] Refuse to delete export root: {0}" -f $outputFull)
  }
  if (-not [string]::IsNullOrWhiteSpace($logsFull) -and $outputFull.Equals($logsFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    Die ("[ERROR] Refuse to delete logs dir: {0}" -f $outputFull)
  }
  if (-not $outputFull.StartsWith($exportPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Die ("[ERROR] Refuse to delete output outside export root: {0}" -f $outputFull)
  }

  Write-Host ("[OUTPUT] Clean old output: {0}" -f $outputFull) -ForegroundColor DarkGray

  $exeFiles = @(Get-ChildItem -LiteralPath $outputFull -Filter "*.exe" -File -Recurse -ErrorAction SilentlyContinue)
  if ($exeFiles.Count -gt 0) {
    $exePaths = @{}
    foreach ($exe in $exeFiles) {
      $exePaths[[IO.Path]::GetFullPath($exe.FullName).ToLowerInvariant()] = $true
    }

    $running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
      try {
        -not [string]::IsNullOrWhiteSpace($_.Path) -and $exePaths.ContainsKey([IO.Path]::GetFullPath($_.Path).ToLowerInvariant())
      } catch {
        $false
      }
    })
    foreach ($proc in $running) {
      Write-Host ("[OUTPUT] Stop running output exe: {0}, PID={1}" -f $proc.ProcessName, $proc.Id) -ForegroundColor Yellow
      try {
        Stop-ProcessTree -ProcessId $proc.Id
      } catch {}
    }
    if ($running.Count -gt 0) {
      Start-Sleep -Milliseconds 800
    }
  }

  $lastError = $null
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      Remove-Item -LiteralPath $outputFull -Recurse -Force -ErrorAction Stop
      return
    } catch {
      $lastError = $_.Exception.Message
      if ($attempt -lt 3) {
        Start-Sleep -Milliseconds (500 * $attempt)
      }
    }
  }

  Die ("[ERROR] Failed to clean old output, please close running files in: {0}`n{1}" -f $outputFull, $lastError)
}

function Compress-BuildOutput {
  param(
    [string]$OutputDir,
    [string]$PackageName,
    [string]$ArchiveExtension = ".zip",
    [bool]$IncludeRootFolder = $true
  )

  if ([string]::IsNullOrWhiteSpace($OutputDir) -or -not (Test-Path -LiteralPath $OutputDir)) {
    Write-Host ("[ZIP FAILED] Output dir not found: {0}" -f $OutputDir) -ForegroundColor Red
    return $null
  }

  if ([string]::IsNullOrWhiteSpace($PackageName)) {
    $PackageName = Split-Path -Leaf $OutputDir
  }
  if ([string]::IsNullOrWhiteSpace($ArchiveExtension)) {
    $ArchiveExtension = ".zip"
  }
  if (-not $ArchiveExtension.StartsWith(".")) {
    $ArchiveExtension = "." + $ArchiveExtension
  }

  $parentDir = Split-Path -Parent $OutputDir
  $zipPath = Join-Path $parentDir ("{0}{1}" -f (Safe-FileName $PackageName), $ArchiveExtension)

  try {
    Remove-FileIfExists -Path $zipPath
    Write-Host ("[ZIP] Compressing: {0}" -f $zipPath) -ForegroundColor Cyan

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $rootName = Split-Path -Leaf ([IO.Path]::GetFullPath($OutputDir).TrimEnd('\'))
    if ([string]::IsNullOrWhiteSpace($rootName)) { $rootName = (Safe-FileName $PackageName) }
    $files = @(Get-ChildItem -LiteralPath $OutputDir -Recurse -File -Force -ErrorAction Stop)
    if ($files.Count -le 0) {
      Write-Host ("[ZIP FAILED] Output dir has no files: {0}" -f $OutputDir) -ForegroundColor Red
      return $null
    }

    $totalFiles = $files.Count
    $doneFiles = 0
    $lastPercent = -1
    Write-Host "[ZIP] Progress:   0%" -NoNewline

    $zipStream = [IO.File]::Open($zipPath, [IO.FileMode]::CreateNew)
    try {
      $zip = New-Object IO.Compression.ZipArchive($zipStream, [IO.Compression.ZipArchiveMode]::Create, $false)
      try {
        foreach ($file in $files) {
          $relativePath = Get-RelativePathSafe -BasePath $OutputDir -FullPath $file.FullName
          $entryName = if ($IncludeRootFolder) {
            "{0}/{1}" -f $rootName, $relativePath.Replace('\', '/')
          } else {
            $relativePath.Replace('\', '/')
          }
          [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
          $doneFiles++
          $percent = [int][Math]::Floor(($doneFiles * 100.0) / $totalFiles)
          if ($percent -ne $lastPercent) {
            Write-Host ("`r[ZIP] Progress: {0,3}%" -f $percent) -NoNewline
            $lastPercent = $percent
          }
        }
      } finally {
        $zip.Dispose()
      }
    } finally {
      $zipStream.Dispose()
    }

    Write-Host ""
    $zipItem = Get-Item -LiteralPath $zipPath -ErrorAction SilentlyContinue
    $zipSizeMb = if ($null -ne $zipItem) { [Math]::Round($zipItem.Length / 1MB, 2) } else { 0 }
    Write-Host ("[ZIP SUCCESS] {0} ({1} MB)" -f $zipPath, $zipSizeMb) -ForegroundColor Green
    return $zipPath
  } catch {
    Write-Host ("[ZIP FAILED] {0}" -f $_.Exception.Message) -ForegroundColor Red
    return $null
  }
}

function Move-Creator24OutputToPackageRoot {
  param(
    [string]$WebMobileDir,
    [string]$PackageRoot
  )

  if ([string]::IsNullOrWhiteSpace($WebMobileDir) -or [string]::IsNullOrWhiteSpace($PackageRoot)) {
    Die "[ERROR] Invalid Cocos Creator 2.x output path."
  }
  if (-not (Test-Path -LiteralPath $WebMobileDir)) {
    Die ("[ERROR] Cocos Creator 2.x output not found: {0}" -f $WebMobileDir)
  }

  $rootFull = [IO.Path]::GetFullPath($PackageRoot)
  $webFull = [IO.Path]::GetFullPath($WebMobileDir)
  $rootPrefix = $rootFull.TrimEnd('\') + '\'

  if (-not $webFull.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Die ("[ERROR] Refuse to flatten output outside package root: {0}" -f $webFull)
  }

  New-Item -ItemType Directory -Force -Path $rootFull | Out-Null

  $items = Get-ChildItem -LiteralPath $webFull -Force
  foreach ($item in $items) {
    $dest = Join-Path $rootFull $item.Name
    $destFull = [IO.Path]::GetFullPath($dest)

    if (-not $destFull.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      Die ("[ERROR] Refuse to overwrite path outside package root: {0}" -f $destFull)
    }

    if (Test-Path -LiteralPath $destFull) {
      Remove-Item -LiteralPath $destFull -Recurse -Force
    }
    Move-Item -LiteralPath $item.FullName -Destination $destFull -Force
  }

  Remove-Item -LiteralPath $webFull -Recurse -Force
  Write-Host ("[OUTPUT] Flattened Cocos Creator 2.x output: {0}" -f $rootFull) -ForegroundColor DarkGray
}

function Get-LoadingImagePath {
  param(
    [string]$ProjectPath,
    [string]$LoadingBg = "",
    [bool]$WarnMissing = $true
  )

  if ([string]::IsNullOrWhiteSpace($ProjectPath)) { return $null }

  $templatesDir = Join-Path $ProjectPath "build-templates"
  if (-not (Test-Path -LiteralPath $templatesDir)) {
    return $null
  }

  $value = if ([string]::IsNullOrWhiteSpace($LoadingBg)) { "loading.png" } else { $LoadingBg.Trim() }
  $candidates = if ([IO.Path]::IsPathRooted($value)) {
    @($value)
  } else {
    @(
      (Join-Path $templatesDir $value),
      (Join-Path (Join-Path $templatesDir "web-mobile") $value)
    )
  }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) { return $candidate }

    if ([string]::IsNullOrWhiteSpace([IO.Path]::GetExtension($candidate))) {
      foreach ($ext in @(".png", ".jpg", ".jpeg")) {
        $withExt = $candidate + $ext
        if (Test-Path -LiteralPath $withExt) { return $withExt }
      }
    }
  }

  if ($WarnMissing -and -not [string]::IsNullOrWhiteSpace($LoadingBg)) {
    Write-Host ("[WARN] cocosLoadingBg not found, use Cocos default loading: {0}" -f $LoadingBg) -ForegroundColor Yellow
  }
  return $null
}

function Disable-WebSplashScreen {
  param(
    [string]$OutputDir,
    [string]$LoadingImagePath = ""
  )

  if ([string]::IsNullOrWhiteSpace($OutputDir)) { return }
  if (-not (Test-Path -LiteralPath $OutputDir)) { return }

  $changed = $false
  $loadingBgCss = "#171717"
  $loadingImgHtml = ""

  if (-not [string]::IsNullOrWhiteSpace($LoadingImagePath) -and (Test-Path -LiteralPath $LoadingImagePath)) {
    try {
      $ext = [IO.Path]::GetExtension($LoadingImagePath)
      if ([string]::IsNullOrWhiteSpace($ext)) { $ext = ".jpg" }
      $baseName = [IO.Path]::GetFileNameWithoutExtension($LoadingImagePath)
      if ([string]::IsNullOrWhiteSpace($baseName)) { $baseName = "loading" }
      $md5 = (Get-FileHash -LiteralPath $LoadingImagePath -Algorithm MD5).Hash.ToLower()
      $md5Short = if ($md5.Length -gt 5) { $md5.Substring(0, 5) } else { $md5 }
      $loadingName = "{0}.{1}{2}" -f $baseName, $md5Short, $ext.ToLower()
      $loadingDest = Join-Path $OutputDir $loadingName
      Copy-Item -LiteralPath $LoadingImagePath -Destination $loadingDest -Force
      $loadingBgCss = "#171717"
      $loadingImgHtml = '    <img class="buildtool-loading-img" src="./{0}" alt="">' -f $loadingName
      $changed = $true
    } catch {
      Write-Host ("[WARN] Failed to copy loading background: {0}" -f $LoadingImagePath) -ForegroundColor Yellow
    }
  }

  $indexPath = Join-Path $OutputDir "index.html"
  if (Test-Path -LiteralPath $indexPath) {
    try {
      $html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
      $newHtml = $html
      $newHtml = $newHtml -replace "splash\.style\.display\s*=\s*['""]block['""]", "splash.style.display = 'none'"
      $newHtml = $newHtml -replace "(?s)\s*<style id=""buildtool-disable-splash"">.*?</style>", ""
      $newHtml = $newHtml -replace "(?s)\s*<style id=""buildtool-loading-style"">.*?</style>", ""
      $newHtml = $newHtml -replace "(?s)\s*<div id=""buildtool-loading"">.*?</div>", ""
      $newHtml = $newHtml -replace "(?s)\s*<script id=""buildtool-loading-script"">.*?</script>", ""

      if ($newHtml -notmatch "buildtool-loading") {
        $loading = @"
  <div id="buildtool-loading">
$loadingImgHtml
  </div>
"@
        $newHtml = $newHtml -replace "<body>", ("<body>`r`n" + $loading)
      }

      $style = @"
  <style id="buildtool-disable-splash">
    #splash, .progress-bar { display: none !important; background: none !important; }
  </style>
"@
      $newHtml = $newHtml -replace "</head>", ($style + "`r`n</head>")

      $style = @"
  <style id="buildtool-loading-style">
    #buildtool-loading {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $loadingBgCss;
      pointer-events: none;
      opacity: 1;
      transition: opacity .35s ease;
    }
    .buildtool-loading-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      object-fit: fill;
    }
    html, body, #GameDiv, #Cocos2dGameContainer, #Cocos3dGameContainer { background: $loadingBgCss; }
    #buildtool-loading.buildtool-loading-hide { opacity: 0; }
    .buildtool-loading-bar { display: none !important; }
  </style>
"@
      $newHtml = $newHtml -replace "</head>", ($style + "`r`n</head>")

      $script = @"
<script id="buildtool-loading-script">
(function () {
  var hidden = false;
  var fadeMs = 250;
  var loadingUiDetected = false;
  var maxWaitMs = 12000;
  var loadingNodeNames = {
    uiLoading: true,
    UILoading: true,
    Loading: true,
    loading: true
  };

  function hideBuildToolLoading() {
    if (hidden) return;
    hidden = true;
    var el = document.getElementById('buildtool-loading');
    if (!el) return;
    el.className = (el.className ? el.className + ' ' : '') + 'buildtool-loading-hide';
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, fadeMs);
  }

  function isNodeVisible(node) {
    if (!node || node.active === false) return false;
    if (typeof node.activeInHierarchy === 'boolean' && !node.activeInHierarchy) return false;
    return true;
  }

  function containsLoadingUi(node) {
    if (!node) return false;
    var name = node.name || '';
    if (loadingNodeNames[name] && isNodeVisible(node)) return true;
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      if (containsLoadingUi(children[i])) return true;
    }
    return false;
  }

  function hasLoadingUiOpen() {
    try {
      if (!window.cc || !cc.director || !cc.director.getScene) return false;
      var scene = cc.director.getScene();
      return containsLoadingUi(scene);
    } catch (e) {
      return false;
    }
  }

  function scheduleHideBuildToolLoading() {
    var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
    raf(function () {
      raf(function () {
        raf(function () {
          setTimeout(hideBuildToolLoading, 80);
        });
      });
    });
  }

  function waitLoadingUiThenHide() {
    var startedAt = Date.now();
    var timer = setInterval(function () {
      if (hasLoadingUiOpen()) {
        loadingUiDetected = true;
        clearInterval(timer);
        scheduleHideBuildToolLoading();
        return;
      }
      if (Date.now() - startedAt > maxWaitMs) {
        clearInterval(timer);
        scheduleHideBuildToolLoading();
      }
    }, 50);
  }

  function bindSceneLaunch() {
    if (window.cc && cc.director && cc.Director && cc.Director.EVENT_AFTER_SCENE_LAUNCH) {
      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, waitLoadingUiThenHide);
      return true;
    }
    return false;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (bindSceneLaunch() || tries > 300) {
      clearInterval(timer);
    }
  }, 50);

  window.addEventListener('error', function () {
    setTimeout(hideBuildToolLoading, 12000);
  });
})();
</script>
"@
      $newHtml = $newHtml -replace "</body>", ($script + "`r`n</body>")

      if ($newHtml -ne $html) {
        Set-Content -LiteralPath $indexPath -Value $newHtml -Encoding UTF8
        $changed = $true
      }
    } catch {
      Write-Host ("[WARN] Failed to patch splash in index.html: {0}" -f $indexPath) -ForegroundColor Yellow
    }
  }

  $cssFiles = Get-ChildItem -LiteralPath $OutputDir -Filter "*.css" -File -ErrorAction SilentlyContinue
  foreach ($cssFile in $cssFiles) {
    try {
      $css = Get-Content -LiteralPath $cssFile.FullName -Raw -Encoding UTF8
      $newCss = $css
      $newCss = $newCss -replace "background:\s*#[0-9a-fA-F]{3,6}\s+url\(\./splash\.[^)]+\)\s+no-repeat\s+center\s*;", "background: none;"

      if ($newCss -notmatch "buildtool-disable-splash") {
        $newCss += @"

/* buildtool-disable-splash */
#splash, .progress-bar { display: none !important; background: none !important; }
"@
      }

      if ($newCss -ne $css) {
        Set-Content -LiteralPath $cssFile.FullName -Value $newCss -Encoding UTF8
        $changed = $true
      }
    } catch {
      Write-Host ("[WARN] Failed to patch splash in css: {0}" -f $cssFile.FullName) -ForegroundColor Yellow
    }
  }

  $splashFiles = Get-ChildItem -LiteralPath $OutputDir -Filter "splash.*" -File -ErrorAction SilentlyContinue
  foreach ($splashFile in $splashFiles) {
    try {
      Remove-Item -LiteralPath $splashFile.FullName -Force
      $changed = $true
    } catch {
      Write-Host ("[WARN] Failed to remove splash asset: {0}" -f $splashFile.FullName) -ForegroundColor Yellow
    }
  }

  if ($changed) {
    Write-Host ("[提示] Disabled web splash: {0}" -f $OutputDir) -ForegroundColor DarkGray
  }
}

function Apply-Creator24LoadingStyle {
  param(
    [string]$OutputDir,
    [string]$ProjectPath
  )

  if ([string]::IsNullOrWhiteSpace($OutputDir)) { return }
  if ([string]::IsNullOrWhiteSpace($ProjectPath)) { return }
  if (-not (Test-Path -LiteralPath $OutputDir)) { return }

  $templatesDir = Join-Path $ProjectPath "build-templates"
  if (-not (Test-Path -LiteralPath $templatesDir)) {
    Write-Host "[提示] Cocos 2.x use default loading (build-templates not found)." -ForegroundColor DarkGray
    return
  }

  $assetNames = @("loading.png", "loading_jdt1.png", "loading_jdt2.png", "loading_jdt3.png")
  $copied = @{}
  foreach ($assetName in $assetNames) {
    $src = Join-Path $templatesDir $assetName
    if (Test-Path -LiteralPath $src) {
      try {
        Copy-Item -LiteralPath $src -Destination (Join-Path $OutputDir $assetName) -Force
        $copied[$assetName] = $true
      } catch {
        Write-Host ("[WARN] Failed to copy Cocos 2.x loading asset: {0}" -f $src) -ForegroundColor Yellow
      }
    }
  }

  if ($copied.Count -eq 0) {
    Write-Host "[提示] Cocos 2.x use default loading (loading assets not found)." -ForegroundColor DarkGray
    return
  }

  $templateCssPath = $null
  foreach ($cssName in @("cocos24-loading.css", "loading.css", "style-mobile.css")) {
    $candidateCss = Join-Path $templatesDir $cssName
    if (Test-Path -LiteralPath $candidateCss) {
      $templateCssPath = $candidateCss
      break
    }
  }
  if (-not [string]::IsNullOrWhiteSpace($templateCssPath)) {
    Write-Host ("[提示] Use Cocos 2.x loading css: {0}" -f $templateCssPath) -ForegroundColor DarkGray
  }

  $indexPath = Join-Path $OutputDir "index.html"
  if (Test-Path -LiteralPath $indexPath) {
    try {
      $html = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
      $newHtml = $html
      $newHtml = $newHtml -replace "(?s)\s*<style id=""buildtool-disable-splash"">.*?</style>", ""
      $newHtml = $newHtml -replace "(?s)\s*<style id=""buildtool-loading-style"">.*?</style>", ""
      $newHtml = $newHtml -replace "(?s)\s*<div id=""buildtool-loading"">.*?</div>", ""
      $newHtml = $newHtml -replace "(?s)\s*<script id=""buildtool-loading-script"">.*?</script>", ""
      $newHtml = $newHtml -replace "splash\.style\.display\s*=\s*['""]none['""]", "splash.style.display = 'block'"

      if ($newHtml -notmatch 'id="splash"') {
        $splashHtml = @"
  <div id="splash">
    <div class="progress-bar stripes"><span style="width: 0%"><div></div></span></div>
  </div>
"@
        $newHtml = $newHtml -replace "(?i)(</canvas>)", ("`$1`r`n" + $splashHtml)
      } elseif ($newHtml -notmatch "progress-bar") {
        $newHtml = $newHtml -replace "(?i)(<div\s+id=""splash""[^>]*>)", "`$1`r`n    <div class=""progress-bar stripes""><span style=""width: 0%""><div></div></span></div>"
      } elseif ($newHtml -notmatch "(?is)<span[^>]*>\s*<div") {
        $newHtml = $newHtml -replace "(?is)(<div\s+class=""progress-bar[^""]*""[^>]*>\s*<span[^>]*>)", "`$1<div></div>"
      }

      if ($newHtml -ne $html) {
        Set-Content -LiteralPath $indexPath -Value $newHtml -Encoding UTF8
      }
    } catch {
      Write-Host ("[WARN] Failed to patch Cocos 2.x loading html: {0}" -f $indexPath) -ForegroundColor Yellow
    }
  }

  $cssFiles = @(Get-ChildItem -LiteralPath $OutputDir -Filter "style-mobile*.css" -File -ErrorAction SilentlyContinue)
  if ($cssFiles.Count -le 0) {
    $cssFiles = @(Get-ChildItem -LiteralPath $OutputDir -Filter "*.css" -File -ErrorAction SilentlyContinue)
  }

  foreach ($cssFile in $cssFiles) {
    $cssPath = $cssFile.FullName
    try {
      $css = Get-Content -LiteralPath $cssPath -Raw -Encoding UTF8
      $newCss = $css -replace "(?s)/\*\s*buildtool-cocos24-loading\s*\*/.*?/\*\s*end-buildtool-cocos24-loading\s*\*/", ""

      if (-not [string]::IsNullOrWhiteSpace($templateCssPath)) {
        $templateCss = Get-Content -LiteralPath $templateCssPath -Raw -Encoding UTF8
        $appendCss = @"

/* buildtool-cocos24-loading */
$templateCss
/* end-buildtool-cocos24-loading */
"@
      } else {
        $appendCss = @"

/* buildtool-cocos24-loading */
#splash {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background: url(./loading.png) no-repeat center;
  background-size: 100%;
}

.progress-bar {
  background: url(./loading_jdt1.png) no-repeat;
  position: relative;
  top: 92%;
  width: 300px;
  height: 16px;
  background-size: 300px 16px;
  margin: auto;
}

.progress-bar p {
  position: absolute;
  top: -40px;
  color: #FFFFFF;
  font-weight: 700;
  font-size: large;
  width: 300px;
}

.progress-bar div {
  background: url(./loading_jdt3.png) no-repeat;
  position: relative;
  left: 0px;
  top: 3px;
  width: 300px;
  height: 16px;
  background-size: 300px 16px;
}

.progress-bar span {
  background: url(./loading_jdt3.png) no-repeat;
  display: block;
  height: 50%;
  top: -50px;
}

.stripes span {
  height: 50px;
  background: url(./loading_jdt2.png) no-repeat;
  background-size: 300px 16px;
}
/* end-buildtool-cocos24-loading */
"@
      }

      $newCss += $appendCss
      if ($newCss -ne $css) {
        Set-Content -LiteralPath $cssPath -Value $newCss -Encoding UTF8
      }
    } catch {
      Write-Host ("[WARN] Failed to patch Cocos 2.x loading css: {0}" -f $cssPath) -ForegroundColor Yellow
    }
  }

  $mainFiles = @(Get-ChildItem -LiteralPath $OutputDir -Filter "main*.js" -File -ErrorAction SilentlyContinue)
  foreach ($mainFile in $mainFiles) {
    try {
      $js = Get-Content -LiteralPath $mainFile.FullName -Raw -Encoding UTF8
      $newJs = $js
      $newJs = $newJs -replace "(?s)/\*\s*buildtool-cocos24-loading-hide\s*\*/.*?/\*\s*end-buildtool-cocos24-loading-hide\s*\*/", "splash.style.display = 'none';"

      if ($newJs -ne $js) {
        Set-Content -LiteralPath $mainFile.FullName -Value $newJs -Encoding UTF8
      }
    } catch {
      Write-Host ("[WARN] Failed to patch Cocos 2.x loading js: {0}" -f $mainFile.FullName) -ForegroundColor Yellow
    }
  }

  Write-Host ("[提示] Applied Cocos 2.x loading style: {0}" -f $OutputDir) -ForegroundColor DarkGray
}

function Get-SceneUUID {
  param(
    [string]$ProjectPath,
    [string]$ScenePathOrUUID
  )

  $ScenePathOrUUID = Normalize-ConfigPathValue $ScenePathOrUUID
  if ([string]::IsNullOrWhiteSpace($ScenePathOrUUID)) {
    Die "[ERROR] Scene is empty in build config."
  }

  if (Is-UUID $ScenePathOrUUID) {
    return $ScenePathOrUUID
  }

  $sceneRel = $ScenePathOrUUID -replace '/', '\'
  $fullScenePath = Join-Path $ProjectPath $sceneRel

  if (-not (Test-Path -LiteralPath $fullScenePath)) {
    Die ("[ERROR] Scene not found: {0}" -f $ScenePathOrUUID)
  }

  $metaPath = "$fullScenePath.meta"
  if (-not (Test-Path -LiteralPath $metaPath)) {
    Die ("[ERROR] Scene meta not found: {0}" -f $ScenePathOrUUID)
  }

  try {
    $meta = (Get-Content -LiteralPath $metaPath -Raw -Encoding UTF8) | ConvertFrom-Json
    if ($null -eq $meta.uuid -or [string]::IsNullOrWhiteSpace([string]$meta.uuid)) {
      Die ("[ERROR] Scene meta missing uuid: {0}" -f $ScenePathOrUUID)
    }
    return [string]$meta.uuid
  } catch {
    Die ("[ERROR] Failed to parse scene meta: {0}" -f $ScenePathOrUUID)
  }
}

function Build-ArgsFromProjectConfig {
  param(
    [string]$ProjectPath,
    $ProjBuildCfg,
	$CommonCfg,
    [bool]$IsCreator24 = $false
  )

  $opt = @{}
  if ($null -eq $ProjBuildCfg) { return $opt }

  # orientation
  if ($null -ne $ProjBuildCfg.orientation -and -not [string]::IsNullOrWhiteSpace([string]$ProjBuildCfg.orientation)) {
    $orientation = ([string]$ProjBuildCfg.orientation).Trim()
    if ($orientation -match '^(auto|portrait|landscape)$') {
      $orientation = $orientation.ToLower()
    }
    if ($IsCreator24) {
      $opt["webOrientation"] = $orientation
    } else {
      $opt["packages"] = @{
        "web-mobile" = @{
          "orientation" = $orientation
        }
      }
    }
  }
  
  # md5Cache
  if ($null -ne $CommonCfg -and $null -ne $CommonCfg.md5Cache) {
    $opt["md5Cache"] = ([bool]$CommonCfg.md5Cache).ToString().ToLower()
  }

  # startScene
  if ($null -ne $ProjBuildCfg.startScene -and -not [string]::IsNullOrWhiteSpace([string]$ProjBuildCfg.startScene)) {
    $startUuid = Get-SceneUUID -ProjectPath $ProjectPath -ScenePathOrUUID ([string]$ProjBuildCfg.startScene)
    $opt["startScene"] = $startUuid
  }

  # scenes
  if ($null -ne $ProjBuildCfg.scenes -and $ProjBuildCfg.scenes.Count -gt 0) {
    $uuids = @()
    foreach ($s in $ProjBuildCfg.scenes) {
      if ([string]::IsNullOrWhiteSpace([string]$s)) { continue }
      $uuids += (Get-SceneUUID -ProjectPath $ProjectPath -ScenePathOrUUID ([string]$s))
    }
    if ($uuids.Count -gt 0) {
      $opt["scenes"] = ($uuids -join ",")
    }
  }

  return $opt
}

function Format-BuildOptionString {
  param([hashtable]$Options)
  $pairs = New-Object System.Collections.Generic.List[string]
  foreach ($k in $Options.Keys) {
    $raw = $Options[$k]
    $v = if ($raw -is [hashtable] -or $raw -is [System.Collections.IDictionary] -or $raw -is [pscustomobject]) {
      ($raw | ConvertTo-Json -Compress -Depth 16).Replace('"', '\"')
    } else {
      [string]$raw
    }
    $pairs.Add(("{0}={1}" -f $k, $v))
  }
  return ($pairs -join ";")
}

function Filter-CreatorLogLine([string]$line) {
  if ([string]::IsNullOrWhiteSpace($line)) { return $false }

  if ($line -match 'network_sandbox\.cc' -or
      $line -match 'network_service_instance_impl\.cc' -or
      $line -match 'cache_util_win\.cc' -or
      $line -match 'disk_cache\.cc' -or
      $line -match 'gpu_disk_cache\.cc') {
    return $false
  }

  if ($line -match 'Start enter command build with options') { return $true }
  if ($line -match 'build success in') { return $true }
  if ($line -match 'Built .+ successfully') { return $true }
  if ($line -match 'Finished') { return $true }
  if ($line -match 'ExitCode') { return $true }
  if ($line -match 'Build Failed' -or $line -match 'Unexpected token' -or $line -match 'Failed to build') { return $true }
  if ($line -match 'Error:' -or $line -match '\[ERROR\]' -or $line -match 'EPERM' -or $line -match 'Cannot find module') { return $true }

  return $false
}

function Merge-Logs {
  param(
    [string]$OutPath,
    [string]$ErrPath,
    [string]$AllPath
  )
  $o = if(Test-Path -LiteralPath $OutPath){ Get-Content -LiteralPath $OutPath -Encoding UTF8 -ErrorAction SilentlyContinue } else { @() }
  $e = if(Test-Path -LiteralPath $ErrPath){ Get-Content -LiteralPath $ErrPath -Encoding UTF8 -ErrorAction SilentlyContinue } else { @() }
  ($o + $e) | Set-Content -LiteralPath $AllPath -Encoding UTF8
}

function Get-SdkConfigTemplatePath {
  param(
    [string]$ToolRoot,
    [string]$SdkConfig
  )

  if ([string]::IsNullOrWhiteSpace($SdkConfig)) { return $null }

  $value = $SdkConfig.Trim()
  $candidate = if ([IO.Path]::IsPathRooted($value)) {
    $value
  } else {
    Join-Path (Join-Path $ToolRoot "sdkConfigTemplate") $value
  }

  if (Test-Path -LiteralPath $candidate) { return [IO.Path]::GetFullPath($candidate) }

  if ([string]::IsNullOrWhiteSpace([IO.Path]::GetExtension($candidate))) {
    $withExt = $candidate + ".json"
    if (Test-Path -LiteralPath $withExt) { return [IO.Path]::GetFullPath($withExt) }
  }

  Die ("[ERROR] sdkConfig template not found: {0}" -f $SdkConfig)
}

function Get-SudSdkConfigRelativePath {
  param(
    $Project,
    [string]$ToolRoot,
    [string]$ProjectName = ""
  )

  $displayName = if ([string]::IsNullOrWhiteSpace($ProjectName)) { [string]$Project.packageName } else { $ProjectName }
  $gameId = ""
  if ($null -ne $Project -and $null -ne $Project.gameId) {
    $gameId = ([string]$Project.gameId).Trim()
  }

  if ([string]::IsNullOrWhiteSpace($gameId)) {
    Write-Host ("[SUD] {0} 未配置 gameId，跳过该项目打包。" -f $displayName) -ForegroundColor Red
    return $null
  }

  $sudRoot = Join-Path (Join-Path $ToolRoot "sdkConfigTemplate") "sud"
  $gameDir = Join-Path $sudRoot $gameId
  $configPath = Join-Path $gameDir "configSdk.json"

  if (-not (Test-Path -LiteralPath $gameDir)) {
    Write-Host ("[SUD] {0} 缺少 gameId 配置目录，跳过该项目打包: {1}" -f $displayName, $gameDir) -ForegroundColor Red
    return $null
  }
  if (-not (Test-Path -LiteralPath $configPath)) {
    Write-Host ("[SUD] {0} 缺少 SUD configSdk.json，跳过该项目打包: {1}" -f $displayName, $configPath) -ForegroundColor Red
    return $null
  }

  return ("sud/{0}/configSdk.json" -f $gameId)
}

function Apply-SdkConfigToProject {
  param(
    [string]$ProjectPath,
    [string]$ToolRoot,
    [string]$SdkConfig,
    [string]$ProjectName = ""
  )

  if ([string]::IsNullOrWhiteSpace($SdkConfig)) { return $null }

  $srcPath = Get-SdkConfigTemplatePath -ToolRoot $ToolRoot -SdkConfig $SdkConfig
  $cfgPath = Join-Path $ProjectPath "assets\resources\configSdk.json"
  $resourcesDir = Split-Path -Parent $cfgPath

  if (-not (Test-Path -LiteralPath $resourcesDir)) {
    Die ("[ERROR] Project resources dir not found: {0}" -f $resourcesDir)
  }

  try {
    $srcText = Get-Content -LiteralPath $srcPath -Raw -Encoding UTF8
    [void]($srcText | ConvertFrom-Json)
  } catch {
    Die ("[ERROR] Failed to read or parse sdkConfig template: {0}" -f $srcPath)
  }

  $backupRoot = Join-Path ([IO.Path]::GetTempPath()) "cocos-buildtool"
  try {
    New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
  } catch {
    Die ("[ERROR] Failed to create temp backup dir: {0}" -f $backupRoot)
  }

  $existed = Test-Path -LiteralPath $cfgPath
  if (-not $existed) {
    $displayName = if ([string]::IsNullOrWhiteSpace($ProjectName)) { [IO.Path]::GetFileName($ProjectPath) } else { $ProjectName }
    Write-Host ("[SDK-CONFIG] {0} resources文件夹中没有configSdk.json文件" -f $displayName) -ForegroundColor Red
  }

  $backupPath = $null
  if ($existed) {
    $backupName = "{0}.{1}.{2}.buildtool.bak" -f ([IO.Path]::GetFileName($cfgPath)), $PID, ([Guid]::NewGuid().ToString("N"))
    $backupPath = Join-Path $backupRoot $backupName
    try {
      Copy-Item -LiteralPath $cfgPath -Destination $backupPath -Force
    } catch {
      Die ("[ERROR] Failed to backup sdk config file: {0}" -f $cfgPath)
    }
  }

  try {
    Copy-Item -LiteralPath $srcPath -Destination $cfgPath -Force
    Write-Host ("[SDK-CONFIG] Applied: {0} -> {1}" -f $srcPath, $cfgPath) -ForegroundColor Green
  } catch {
    if ($existed -and -not [string]::IsNullOrWhiteSpace($backupPath) -and (Test-Path -LiteralPath $backupPath)) {
      try { Copy-Item -LiteralPath $backupPath -Destination $cfgPath -Force } catch {}
    }
    Cleanup-GameConfigArtifacts -ConfigPath $cfgPath -BackupPath $backupPath
    Die ("[ERROR] Failed to write sdk config file: {0}" -f $cfgPath)
  }

  return [PSCustomObject]@{
    changed    = $true
    configPath = $cfgPath
    backupPath = $backupPath
    existed    = $existed
  }
}

function Restore-SdkConfigFile {
  param(
    $PatchInfo
  )

  if ($null -eq $PatchInfo) { return }
  if ($null -eq $PatchInfo.changed -or -not [bool]$PatchInfo.changed) { return }
  if ([string]::IsNullOrWhiteSpace([string]$PatchInfo.configPath)) { return }

  try {
    if ([bool]$PatchInfo.existed) {
      if (-not [string]::IsNullOrWhiteSpace([string]$PatchInfo.backupPath) -and (Test-Path -LiteralPath $PatchInfo.backupPath)) {
        Copy-Item -LiteralPath $PatchInfo.backupPath -Destination $PatchInfo.configPath -Force
        Write-Host ("[SDK-CONFIG] Restored: {0}" -f $PatchInfo.configPath) -ForegroundColor DarkGray
      }
    } else {
      Remove-FileIfExists -Path ([string]$PatchInfo.configPath)
      Remove-FileIfExists -Path ("{0}.meta" -f [string]$PatchInfo.configPath)
      Write-Host ("[SDK-CONFIG] Removed temporary file: {0}" -f $PatchInfo.configPath) -ForegroundColor DarkGray
    }
  } catch {
    Die ("[ERROR] Failed to restore sdk config file: {0}" -f $PatchInfo.configPath)
  } finally {
    Cleanup-GameConfigArtifacts -ConfigPath ([string]$PatchInfo.configPath) -BackupPath ([string]$PatchInfo.backupPath)
  }
}

function Apply-Creator24BuildTemplatesToProject {
  param(
    [string]$ProjectPath,
    [string]$ToolRoot,
    [string]$LoadingImagePath = "",
    [string]$LoadingBg = "",
    [string]$ProjectName = ""
  )

  if ([string]::IsNullOrWhiteSpace($ProjectPath)) { return $null }

  $projectTemplatesDir = Join-Path $ProjectPath "build-templates"
  $projectWebTemplate = Join-Path $projectTemplatesDir "web-mobile"
  $projectFull = [IO.Path]::GetFullPath($ProjectPath)
  $targetFull = [IO.Path]::GetFullPath($projectWebTemplate)
  $projectPrefix = $projectFull.TrimEnd('\') + '\'
  if (-not $targetFull.StartsWith($projectPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Die ("[ERROR] Refuse to patch build-templates outside project: {0}" -f $targetFull)
  }

  $rootExisted = Test-Path -LiteralPath $projectTemplatesDir
  $targetExisted = Test-Path -LiteralPath $projectWebTemplate
  if (-not $targetExisted) {
    $displayName = if ([string]::IsNullOrWhiteSpace($ProjectName)) { [IO.Path]::GetFileName($ProjectPath) } else { $ProjectName }
    if (-not $rootExisted) {
      Write-Host ("[提示] {0}项目下没有build-templates文件夹: {1}" -f $displayName, $projectTemplatesDir) -ForegroundColor Red
    } else {
      Write-Host ("[提示] {0}项目下没有build-templates\web-mobile文件夹: {1}" -f $displayName, $projectWebTemplate) -ForegroundColor Red
    }
    return $null
  }

  $hasCustomBg = -not [string]::IsNullOrWhiteSpace($LoadingBg)
  $bgDisplayName = if ($hasCustomBg) { $LoadingBg.Trim() } else { "loadingBg_seven.png" }
  if (-not $hasCustomBg) {
    $LoadingImagePath = Get-LoadingImagePath -ProjectPath $ProjectPath -LoadingBg $bgDisplayName -WarnMissing:$false
  }

  $bgExists = -not [string]::IsNullOrWhiteSpace($LoadingImagePath) -and (Test-Path -LiteralPath $LoadingImagePath)
  if (-not $bgExists) {
    $displayName = if ([string]::IsNullOrWhiteSpace($ProjectName)) { [IO.Path]::GetFileName($ProjectPath) } else { $ProjectName }
    Write-Host ("[提示] {0}build-templates中没有splash图:{1}" -f $displayName, $bgDisplayName) -ForegroundColor Red
  }

  $backupPath = $null

  $backupRoot = Join-Path ([IO.Path]::GetTempPath()) "cocos-buildtool"
  try {
    New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
  } catch {
    Die ("[ERROR] Failed to create temp backup dir: {0}" -f $backupRoot)
  }

  if ($targetExisted) {
    $backupPath = Join-Path $backupRoot ("web-mobile.{0}.{1}.buildtool.bak" -f $PID, ([Guid]::NewGuid().ToString("N")))
    try {
      Copy-Item -LiteralPath $projectWebTemplate -Destination $backupPath -Recurse -Force
    } catch {
      Die ("[ERROR] Failed to backup project build-template: {0}" -f $projectWebTemplate)
    }
  }

  try {
    $bgName = if ($bgExists) { [IO.Path]::GetFileName($LoadingImagePath) } else { [IO.Path]::GetFileName($bgDisplayName) }
    if ([string]::IsNullOrWhiteSpace($bgName)) {
      $bgName = "loading.png"
    }
    if ([string]::IsNullOrWhiteSpace([IO.Path]::GetExtension($bgName))) {
      $bgName = "{0}.png" -f $bgName
    }

    if ($bgExists) {
      $bgDest = Join-Path $projectWebTemplate $bgName
      $bgSourceFull = [IO.Path]::GetFullPath($LoadingImagePath)
      $bgDestFull = [IO.Path]::GetFullPath($bgDest)
      if (-not $bgSourceFull.Equals($bgDestFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        Copy-Item -LiteralPath $LoadingImagePath -Destination $bgDest -Force
      }
    }

    $splashImageFiles = @(Get-ChildItem -LiteralPath $projectWebTemplate -File -ErrorAction SilentlyContinue | Where-Object {
      $fileName = $_.Name
      $baseName = $_.BaseName
      $ext = $_.Extension.ToLower()
      if ($ext -notin @(".png", ".jpg", ".jpeg", ".webp")) { return $false }
      if ($fileName.Equals($bgName, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
      if ($baseName -like "loading_jdt*") { return $false }
      return ($baseName -like "loadingBg_*")
    })
    foreach ($unusedSplashImage in $splashImageFiles) {
      Remove-Item -LiteralPath $unusedSplashImage.FullName -Force
      Write-Host ("[提示] Removed unused Cocos 2.x splash image: {0}" -f $unusedSplashImage.Name) -ForegroundColor DarkGray
    }

    $cssPath = Join-Path $projectWebTemplate "style-mobile.css"
    if ($hasCustomBg -and (Test-Path -LiteralPath $cssPath)) {
      $css = Get-Content -LiteralPath $cssPath -Raw -Encoding UTF8
      $newCss = $css -replace 'loadingBg_[A-Za-z0-9_.-]+\.(png|jpg|jpeg|webp)', $bgName
      $newCss = $newCss.Replace("seven.jpg", $bgName).Replace("loading.png", $bgName)
      if ($newCss -ne $css) {
        Set-Content -LiteralPath $cssPath -Value $newCss -Encoding UTF8
      }
    } elseif ($hasCustomBg) {
      Write-Host ("[WARN] Cocos 2.x style-mobile.css not found: {0}" -f $cssPath) -ForegroundColor Yellow
    }

    if ($bgExists) {
      Write-Host ("[提示] Cocos 2.x loading background: {0}" -f $LoadingImagePath) -ForegroundColor DarkGray
    }
    if ($hasCustomBg) {
      Write-Host ("[提示] Patched Cocos 2.x project build-template css: {0}" -f $projectWebTemplate) -ForegroundColor DarkGray
    } else {
      Write-Host ("[提示] Cocos 2.x use project build-template default background: {0}" -f $bgName) -ForegroundColor DarkGray
    }
  } catch {
    if ($targetExisted -and -not [string]::IsNullOrWhiteSpace($backupPath) -and (Test-Path -LiteralPath $backupPath)) {
      try {
        if (Test-Path -LiteralPath $projectWebTemplate) {
          Remove-Item -LiteralPath $projectWebTemplate -Recurse -Force
        }
        Copy-Item -LiteralPath $backupPath -Destination $projectWebTemplate -Recurse -Force
      } catch {}
    }
    Die ("[ERROR] Failed to apply Cocos 2.x build-templates: {0}" -f $projectWebTemplate)
  }

  return [PSCustomObject]@{
    changed       = $true
    targetPath    = $projectWebTemplate
    backupPath    = $backupPath
    targetExisted = $targetExisted
    rootExisted   = $rootExisted
    rootPath      = $projectTemplatesDir
  }
}

function Restore-Creator24BuildTemplates {
  param(
    $PatchInfo
  )

  if ($null -eq $PatchInfo) { return }
  if ($null -eq $PatchInfo.changed -or -not [bool]$PatchInfo.changed) { return }
  if ([string]::IsNullOrWhiteSpace([string]$PatchInfo.targetPath)) { return }

  try {
    if (Test-Path -LiteralPath $PatchInfo.targetPath) {
      Remove-Item -LiteralPath $PatchInfo.targetPath -Recurse -Force
    }

    if ([bool]$PatchInfo.targetExisted) {
      if (-not [string]::IsNullOrWhiteSpace([string]$PatchInfo.backupPath) -and (Test-Path -LiteralPath $PatchInfo.backupPath)) {
        Copy-Item -LiteralPath $PatchInfo.backupPath -Destination $PatchInfo.targetPath -Recurse -Force
      }
      Write-Host ("[提示] Restored Cocos 2.x project build-templates: {0}" -f $PatchInfo.targetPath) -ForegroundColor DarkGray
    } elseif (-not [bool]$PatchInfo.rootExisted -and -not [string]::IsNullOrWhiteSpace([string]$PatchInfo.rootPath)) {
      $remaining = @(Get-ChildItem -LiteralPath $PatchInfo.rootPath -Force -ErrorAction SilentlyContinue)
      if ($remaining.Count -eq 0) {
        Remove-Item -LiteralPath $PatchInfo.rootPath -Force
      }
    }
  } catch {
    Die ("[ERROR] Failed to restore Cocos 2.x build-templates: {0}" -f $PatchInfo.targetPath)
  } finally {
    if (-not [string]::IsNullOrWhiteSpace([string]$PatchInfo.backupPath)) {
      if (Test-Path -LiteralPath $PatchInfo.backupPath) {
        Remove-Item -LiteralPath $PatchInfo.backupPath -Recurse -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

function Apply-PureClientToProject {
  param(
    [string]$ProjectPath,
    [string]$PureClientPath,
    [bool]$IsCreator24 = $false
  )

  if ([string]::IsNullOrWhiteSpace($PureClientPath)) { return $null }
  if ([string]::IsNullOrWhiteSpace($ProjectPath)) { return $null }

  $sourcePath = $PureClientPath -replace '/', '\'
  $sourcePath = [IO.Path]::GetFullPath($sourcePath)
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    Die ("[ERROR] common.pureClientPath not found: {0}" -f $sourcePath)
  }

  $sourceItem = Get-Item -LiteralPath $sourcePath
  $sourceFiles = @()
  $sourceRoot = ""
  if ($sourceItem.PSIsContainer) {
    $sourceRoot = $sourceItem.FullName
    $sourceFiles = @(Get-ChildItem -LiteralPath $sourceRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne ".meta" })
  } else {
    $sourceRoot = Split-Path -Parent $sourceItem.FullName
    $sourceFiles = @($sourceItem)
  }

  if ($sourceFiles.Count -le 0) {
    Die ("[ERROR] common.pureClientPath has no files: {0}" -f $sourcePath)
  }

  $destRoot = if ($IsCreator24) {
    Join-Path $ProjectPath "assets\PureClient"
  } else {
    Join-Path $ProjectPath "assets\script\framework\PureClient"
  }
  $destRoot = [IO.Path]::GetFullPath($destRoot)
  $destRootExisted = Test-Path -LiteralPath $destRoot

  $backupRoot = Join-Path ([IO.Path]::GetTempPath()) "cocos-buildtool"
  $backupRoot = Join-Path $backupRoot ("pureclient.{0}.{1}" -f $PID, ([Guid]::NewGuid().ToString("N")))
  try {
    New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $destRoot | Out-Null
  } catch {
    Die ("[ERROR] Failed to prepare PureClient patch dirs: {0}" -f $destRoot)
  }

  $records = @()
  try {
    foreach ($sourceFile in $sourceFiles) {
      $relativePath = Get-RelativePathSafe -BasePath $sourceRoot -FullPath $sourceFile.FullName
      $destPath = Join-Path $destRoot $relativePath
      $backupPath = Join-Path $backupRoot $relativePath
      $destDir = Split-Path -Parent $destPath
      $backupDir = Split-Path -Parent $backupPath

      New-Item -ItemType Directory -Force -Path $destDir | Out-Null
      New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

      $existed = Test-Path -LiteralPath $destPath
      if ($existed) {
        Copy-Item -LiteralPath $destPath -Destination $backupPath -Force
      }

      Copy-Item -LiteralPath $sourceFile.FullName -Destination $destPath -Force
      $records += [PSCustomObject]@{
        destPath   = $destPath
        backupPath = $backupPath
        existed    = $existed
      }
    }

    $latest = $sourceFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host ("[PURECLIENT] Applied: {0} -> {1}" -f $sourcePath, $destRoot) -ForegroundColor Green
    Write-Host ("[PURECLIENT] Latest source file: {0}" -f $latest.Name) -ForegroundColor DarkGray
  } catch {
    Restore-PureClientFile -PatchInfo ([PSCustomObject]@{ changed = $true; records = $records; backupRoot = $backupRoot; destRoot = $destRoot })
    Die ("[ERROR] Failed to apply PureClient files: {0}" -f $_.Exception.Message)
  }

  return [PSCustomObject]@{
    changed    = $true
    records    = $records
    backupRoot = $backupRoot
    destRoot   = $destRoot
    destRootExisted = $destRootExisted
  }
}

function Restore-PureClientFile {
  param(
    $PatchInfo
  )

  if ($null -eq $PatchInfo) { return }
  if ($null -eq $PatchInfo.changed -or -not [bool]$PatchInfo.changed) { return }

  if ($null -ne $PatchInfo.records) {
    foreach ($record in @($PatchInfo.records)) {
      if ($null -eq $record -or [string]::IsNullOrWhiteSpace([string]$record.destPath)) { continue }

      try {
        if ([bool]$record.existed -and -not [string]::IsNullOrWhiteSpace([string]$record.backupPath) -and (Test-Path -LiteralPath $record.backupPath)) {
          Copy-Item -LiteralPath $record.backupPath -Destination $record.destPath -Force
        } elseif (Test-Path -LiteralPath $record.destPath) {
          Remove-Item -LiteralPath $record.destPath -Force
          Remove-FileIfExists -Path ("{0}.meta" -f $record.destPath)
        }
      } catch {
        Die ("[ERROR] Failed to restore PureClient file: {0}" -f $record.destPath)
      }
    }
  }

  try {
    if ($null -ne $PatchInfo.destRootExisted -and -not [bool]$PatchInfo.destRootExisted -and
        -not [string]::IsNullOrWhiteSpace([string]$PatchInfo.destRoot) -and
        (Test-Path -LiteralPath $PatchInfo.destRoot)) {
      $remaining = Get-ChildItem -LiteralPath $PatchInfo.destRoot -Recurse -Force -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($null -eq $remaining) {
        Remove-Item -LiteralPath $PatchInfo.destRoot -Recurse -Force
      }
    }
  } catch {}

  try {
    if (-not [string]::IsNullOrWhiteSpace([string]$PatchInfo.backupRoot) -and (Test-Path -LiteralPath $PatchInfo.backupRoot)) {
      Remove-Item -LiteralPath $PatchInfo.backupRoot -Recurse -Force
    }
  } catch {}

  Write-Host ("[PURECLIENT] Restored: {0}" -f $PatchInfo.destRoot) -ForegroundColor DarkGray
}

# ===================== Banner & Config =====================
Write-Host "==== Cocos H5 Auto Build Tool ===="
Write-Host ("Config : ""{0}""" -f (Resolve-Path $ConfigPath))

Ensure-File $ConfigPath ("[ERROR] Config not found: {0}" -f $ConfigPath)

$existingCreators = Get-Process -Name "CocosCreator" -ErrorAction SilentlyContinue
if ($null -ne $existingCreators -and $existingCreators.Count -gt 0) {
  Write-Host ("[WARN] Existing CocosCreator processes detected: {0}. Close old Creator windows before batch build if builds hang or files are locked." -f $existingCreators.Count) -ForegroundColor Yellow
}

try {
  $cfg = (Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8) | ConvertFrom-Json
} catch {
  Die ("[ERROR] Failed to parse config json (UTF-8): {0}" -f $ConfigPath)
}

if ($null -eq $cfg.common -or [string]::IsNullOrWhiteSpace([string]$cfg.common.exportRoot)) {
  Die "[ERROR] common.exportRoot is missing in config."
}
if ([string]::IsNullOrWhiteSpace([string]$cfg.common.projectsPath)) {
  Die "[ERROR] common.projectsPath is missing in config."
}

if ([string]::IsNullOrWhiteSpace($ToolConfigPath)) {
  $ToolConfigPath = Join-Path (Split-Path -Parent $ConfigPath) "build_tool.json"
}
$toolCfg = $null
if (Test-Path -LiteralPath $ToolConfigPath) {
  try {
    $toolCfg = (Get-Content -LiteralPath $ToolConfigPath -Raw -Encoding UTF8) | ConvertFrom-Json
  } catch {
    Die ("[ERROR] Failed to parse tool config json (UTF-8): {0}" -f $ToolConfigPath)
  }
}
if ([string]::IsNullOrWhiteSpace($CreatorExe)) {
  if ($null -eq $toolCfg) {
    Die ("[ERROR] Tool config not found: {0}" -f $ToolConfigPath)
  }
  $CreatorExe = [string]$toolCfg.creatorExe
  if ([string]::IsNullOrWhiteSpace($CreatorExe24) -and $null -ne $toolCfg.creatorExe24) {
    $CreatorExe24 = [string]$toolCfg.creatorExe24
  }
}
if ([string]::IsNullOrWhiteSpace($CreatorExe)) {
  Die "[ERROR] CreatorExe is missing. Set creatorExe in build_tool.json or pass -CreatorExe."
}

$CreatorExe = $CreatorExe -replace '/', '\'
$CreatorExe = [IO.Path]::GetFullPath($CreatorExe)
if (-not [string]::IsNullOrWhiteSpace($CreatorExe24)) {
  $CreatorExe24 = $CreatorExe24 -replace '/', '\'
  $CreatorExe24 = [IO.Path]::GetFullPath($CreatorExe24)
}

Write-Host ("Creator: ""{0}""" -f $CreatorExe)
if (-not [string]::IsNullOrWhiteSpace($CreatorExe24)) {
  Write-Host ("Creator24: ""{0}""" -f $CreatorExe24)
}
Write-Host ""

Ensure-File $CreatorExe ("[ERROR] CocosCreator.exe not found: {0}" -f $CreatorExe)

$exportRoot = [string]$cfg.common.exportRoot
$exportRoot = $exportRoot -replace '/', '\'
$exportRoot = [IO.Path]::GetFullPath($exportRoot)

$projectsPath = [string]$cfg.common.projectsPath
$projectsPath = $projectsPath -replace '/', '\'
$projectsPath = [IO.Path]::GetFullPath($projectsPath)

Ensure-Dir $projectsPath ("[ERROR] common.projectsPath not found: {0}" -f $projectsPath)

$buildTimeoutMinutes = 30
if ($null -ne $cfg.common.buildTimeoutMinutes) {
  $buildTimeoutMinutes = [int]$cfg.common.buildTimeoutMinutes
}
if ($buildTimeoutMinutes -lt 0) { $buildTimeoutMinutes = 0 }
$buildTimeoutSeconds = $buildTimeoutMinutes * 60

$projects = $cfg.projects
if ($null -eq $projects -or $projects.Count -le 0) {
  Die "[ERROR] projects is empty."
}

$toolRoot = Split-Path -Parent $ToolConfigPath
$configSdkConfig = ""
$configBuildName = ""
if ($null -ne $toolCfg -and $null -ne $toolCfg.buildConfigs) {
  $configFullPath = [IO.Path]::GetFullPath($ConfigPath)
  foreach ($buildConfigItem in $toolCfg.buildConfigs) {
    if ($null -eq $buildConfigItem.path) { continue }
    $itemPath = [string]$buildConfigItem.path
    if ([string]::IsNullOrWhiteSpace($itemPath)) { continue }
    $itemFullPath = if ([IO.Path]::IsPathRooted($itemPath)) {
      [IO.Path]::GetFullPath($itemPath)
    } else {
      [IO.Path]::GetFullPath((Join-Path $toolRoot $itemPath))
    }
    if ($itemFullPath.Equals($configFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      if ($null -ne $buildConfigItem.name) {
        $configBuildName = [string]$buildConfigItem.name
      }
      if ($null -ne $buildConfigItem.sdkConfig) {
        $configSdkConfig = [string]$buildConfigItem.sdkConfig
      }
      break
    }
  }
}
$isSudBuild = $configBuildName.Equals("SUD", [System.StringComparison]::OrdinalIgnoreCase) -or
              ([IO.Path]::GetFileName($ConfigPath)).Equals("build-sud.json", [System.StringComparison]::OrdinalIgnoreCase)

$logsDir = Join-Path $exportRoot "logs"
New-Item -ItemType Directory -Force -Path $exportRoot | Out-Null
New-Item -ItemType Directory -Force -Path $logsDir   | Out-Null

Write-Host ("ExportRoot  : ""{0}""" -f $exportRoot)
Write-Host ("ProjectsPath: ""{0}""" -f $projectsPath)
Write-Host ("ProjectCount: {0}" -f $projects.Count)
Write-Host ("LogsDir     : ""{0}""" -f $logsDir)
if ($buildTimeoutMinutes -gt 0) {
  Write-Host ("BuildTimeout: {0} minutes" -f $buildTimeoutMinutes)
} else {
  Write-Host "BuildTimeout: disabled"
}
if (-not [string]::IsNullOrWhiteSpace($configSdkConfig)) {
  Write-Host ("[SDK-CONFIG] config={0}" -f $configSdkConfig)
}
if ($isSudBuild) {
  Write-Host "[SUD] enabled=true platform=wechatgame archive=.sp"
}
Write-Host ""

# ===================== Obfuscate Config =====================
$obfEnabled = $false
$obfIncludeAllBundles = $false
$obfLevel = 2
if ($null -ne $cfg.common.obfuscate) {
  $obfCfg = $cfg.common.obfuscate
  if ($null -ne $obfCfg.enabled) { $obfEnabled = [bool]$obfCfg.enabled }
  if ($null -ne $obfCfg.includeAllBundles) { $obfIncludeAllBundles = [bool]$obfCfg.includeAllBundles }
  if ($null -ne $obfCfg.level) { $obfLevel = [int]$obfCfg.level }
}
Write-Host ("[OBF] enabled={0} includeAllBundles={1} level={2}" -f $obfEnabled, $obfIncludeAllBundles, $obfLevel)
Write-Host ""

# ===================== Res Encrypt Config =====================
$resEncEnabled = $false
$resEncIncludeAllBundles = $false
$resEncKey = ""
$resEncSig = ""
$resEncExts = "png"

if ($null -ne $cfg.common.resEncrypt) {
  $r = $cfg.common.resEncrypt
  if ($null -ne $r.enabled) { $resEncEnabled = [bool]$r.enabled }
  if ($null -ne $r.includeAllBundles) { $resEncIncludeAllBundles = [bool]$r.includeAllBundles }
  if ($null -ne $r.key) { $resEncKey = [string]$r.key }
  if ($null -ne $r.sig) { $resEncSig = [string]$r.sig }
  if ($null -ne $r.exts -and $r.exts.Count -gt 0) { $resEncExts = ($r.exts -join ",") }
}
Write-Host ("[RES-ENC] enabled={0} includeAllBundles={1} sigLen={2} exts={3}" -f $resEncEnabled, $resEncIncludeAllBundles, ($resEncSig.Length), $resEncExts)
Write-Host ""

# ===================== Tool Paths =====================
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
$obfScript = Join-Path $PSScriptRoot "encryption\obfuscator.js"
$encScript = Join-Path $PSScriptRoot "encryption\encrypt.js"

if ($obfEnabled) {
  if ([string]::IsNullOrWhiteSpace($nodeExe)) { Die "[ERROR] Node not found in PATH (can't run obfuscator)." }
  Ensure-File $obfScript ("[ERROR] Obfuscator script not found: {0}" -f $obfScript)
}

if ($resEncEnabled) {
  if ([string]::IsNullOrWhiteSpace($nodeExe)) { Die "[ERROR] Node not found in PATH (can't run resEncrypt)." }
  Ensure-File $encScript ("[ERROR] Resource encrypt script not found: {0}" -f $encScript)
  if ([string]::IsNullOrWhiteSpace($resEncKey) -or [string]::IsNullOrWhiteSpace($resEncSig)) {
    Die "[ERROR] common.resEncrypt.key/sig is missing."
  }
}

# ===================== Select Projects (by packageName args) =====================
$selected = @()

# normalize $Packages
$pkgArgs = @()
if ($null -ne $Packages -and $Packages.Count -gt 0) {
  foreach ($p in $Packages) {
    if (-not [string]::IsNullOrWhiteSpace([string]$p)) { $pkgArgs += [string]$p }
  }
}

if ($pkgArgs.Count -eq 0) {
  # no args => build all
  $selected = @($projects)
} else {
  # build only specified packageNames, keep order as args
  foreach ($pkg in $pkgArgs) {
    $hit = $null
    foreach ($proj in $projects) {
      if ([string]$proj.packageName -eq $pkg) { $hit = $proj; break }
    }

    if ($null -eq $hit) {
      Write-Host ("[ERROR] packageName not found in config: {0}" -f $pkg) -ForegroundColor Red
      continue
    }
    $selected += $hit
  }

  if ($selected.Count -eq 0) {
    Write-Host "[ERROR] No valid packageName specified. Nothing to build." -ForegroundColor Red
    exit 1
  }
}

# ===================== Build Loop =====================
$total = $selected.Count
$failed = 0

for ($i = 0; $i -lt $total; $i++) {
  $proj = $selected[$i]

  $name = [string]$proj.name
  $packageName = [string]$proj.packageName
  $creatorVersion = [string]$proj.creatorVersion
  if ([string]::IsNullOrWhiteSpace($creatorVersion)) { $creatorVersion = "3.8.6" }
  $isCreator24 = ($creatorVersion -like "2.*")

  if ([string]::IsNullOrWhiteSpace($name)) { $name = "Project_$($i+1)" }
  if ([string]::IsNullOrWhiteSpace($packageName)) {
    Write-Host ("[ERROR] packageName missing for {0}" -f $name) -ForegroundColor Red
    $failed++
    continue
  }

  $currentCreatorExe = $CreatorExe
  if ($isCreator24) {
    if ([string]::IsNullOrWhiteSpace($CreatorExe24)) {
      Write-Host ("[ERROR] CreatorExe24 missing for {0}" -f $name) -ForegroundColor Red
      $failed++
      continue
    }
    if (-not (Test-Path -LiteralPath $CreatorExe24)) {
      Write-Host ("[ERROR] CocosCreator 2.x not found: {0}" -f $CreatorExe24) -ForegroundColor Red
      $failed++
      continue
    }
    $currentCreatorExe = $CreatorExe24
  }

  # Project path: projectsPath/packageName/packageName
  $projectPath = Join-Path (Join-Path $projectsPath $packageName) $packageName
  $projectPath = [IO.Path]::GetFullPath($projectPath)

  if (-not (Test-Path -LiteralPath $projectPath)) {
    Write-Host ("[ERROR] Project path not found: {0}" -f $projectPath) -ForegroundColor Red
    $failed++
    continue
  }

  $buildPlatformDir = if ($isSudBuild) {
    "wechatgame"
  } else {
    "web-mobile"
  }

  # Output: 3.x uses buildPath + outputName; 2.x writes platform dir under buildPath.
  if ($isCreator24) {
    $buildPath = Join-Path $exportRoot $packageName
    $outputName = $packageName
    $creatorOutput = Join-Path $buildPath $buildPlatformDir
    $realOutput = $buildPath
  } else {
    $buildPath = $exportRoot
    $outputName = $packageName
    $realOutput = Join-Path $exportRoot $outputName
    $creatorOutput = $realOutput
  }

  $safeName = Safe-FileName $name
  $ts = Get-Date -Format "yyyyMMdd_HHmmss"

  $outLog = Join-Path $logsDir ("{0}_{1}.out.log" -f $safeName, $ts)
  $errLog = Join-Path $logsDir ("{0}_{1}.err.log" -f $safeName, $ts)
  $logAll = Join-Path $logsDir ("{0}_{1}.log" -f $safeName, $ts)

  Write-Host ""
  Write-Host "=================================================="
  Write-Host ("[{0}/{1}] Building: " -f ($i+1), $total) -NoNewline
  Write-Host $name -ForegroundColor Red
  Write-Host ("Package: {0}" -f $packageName)
  Write-Host ("CreatorVersion: {0}" -f $creatorVersion)
  Write-Host ("CreatorExe: {0}" -f $currentCreatorExe)
  Write-Host ("Project: {0}" -f $projectPath)
  Write-Host ("Output : {0}" -f $realOutput)
  Write-Host ("Log    : {0}" -f $logAll)
  Write-Host "=================================================="
  Write-Host ""

  $loadingBgConfig = [string]$proj.cocosLoadingBg
  $loadingImagePath = $null
  if ($isCreator24) {
    if (-not [string]::IsNullOrWhiteSpace($loadingBgConfig)) {
      $loadingImagePath = Get-LoadingImagePath -ProjectPath $projectPath -LoadingBg $loadingBgConfig -WarnMissing:$false
    }
  } else {
    $loadingBgForLookup = if ([string]::IsNullOrWhiteSpace($loadingBgConfig)) { "loadingBg_seven.png" } else { $loadingBgConfig.Trim() }
    $loadingImagePath = Get-LoadingImagePath -ProjectPath $projectPath -LoadingBg $loadingBgForLookup -WarnMissing:$false
    $projectTemplatesDir = Join-Path $projectPath "build-templates"
    if (-not (Test-Path -LiteralPath $projectTemplatesDir)) {
      Write-Host ("[提示] {0}项目下没有build-templates文件夹: {1}" -f $name, $projectTemplatesDir) -ForegroundColor Red
    } elseif ([string]::IsNullOrWhiteSpace($loadingImagePath) -or -not (Test-Path -LiteralPath $loadingImagePath)) {
      Write-Host ("[提示] {0}build-templates中没有splash图:{1}" -f $name, $loadingBgForLookup) -ForegroundColor Red
    }
  }

  $sudSdkConfig = ""
  if ($isSudBuild) {
    $sudSdkConfig = Get-SudSdkConfigRelativePath -Project $proj -ToolRoot $toolRoot -ProjectName $name
    if ([string]::IsNullOrWhiteSpace($sudSdkConfig)) {
      $failed++
      continue
    }
  }

  Remove-OutputDirSafe -OutputDir $realOutput -ExportRoot $exportRoot -LogsDir $logsDir

  $projBuildCfg = $proj.build
  $optMap = Build-ArgsFromProjectConfig -ProjectPath $projectPath -ProjBuildCfg $projBuildCfg -CommonCfg $cfg.common -IsCreator24 $isCreator24

  $optMap["platform"] = $buildPlatformDir
  $optMap["buildPath"] = $buildPath.Replace('\', '/')
  if (-not $isCreator24) {
    $optMap["outputName"] = $outputName
    if (-not $isSudBuild) {
      $optMap["useSplashScreen"] = "false"
    }
  }

  $optStr = Format-BuildOptionString -Options $optMap

  $sdkConfigPatch = $null
  $pureClientPatch = $null
  $creator24TemplatePatch = $null
  if (-not [string]::IsNullOrWhiteSpace([string]$cfg.common.pureClientPath)) {
    $pureClientPatch = Apply-PureClientToProject -ProjectPath $projectPath -PureClientPath ([string]$cfg.common.pureClientPath) -IsCreator24 $isCreator24
  }
  $selectedSdkConfig = if ($isSudBuild) {
    $sudSdkConfig
  } elseif ($null -ne $proj.sdkConfig -and -not [string]::IsNullOrWhiteSpace([string]$proj.sdkConfig)) {
    [string]$proj.sdkConfig
  } else {
    $configSdkConfig
  }
  if (-not [string]::IsNullOrWhiteSpace($selectedSdkConfig)) {
    $sdkConfigPatch = Apply-SdkConfigToProject -ProjectPath $projectPath -ToolRoot $toolRoot -SdkConfig $selectedSdkConfig -ProjectName $name
  }
  if ($isCreator24 -and -not $isSudBuild) {
    $creator24TemplatePatch = Apply-Creator24BuildTemplatesToProject -ProjectPath $projectPath -ToolRoot $toolRoot -LoadingImagePath $loadingImagePath -LoadingBg $loadingBgConfig -ProjectName $name
  }

  $args = if ($isCreator24) {
    @(
      "--path", $projectPath,
      "--build", $optStr
    )
  } else {
    @(
      "--project", $projectPath,
      "--build", $optStr
    )
  }

  $p = $null
  try {
    $buildFailurePatterns = @(
      "Build Failed",
      "Error:\s+Build Failed",
      "Unexpected token",
      "Failed to build"
    )
    $buildSuccessPatterns = @(
      "build success",
      "Built to .+ successfully",
      "Built .+ successfully"
    )

    $buildResult = Start-ProcessWithTimeout -FilePath $currentCreatorExe `
                                           -ArgumentList $args `
                                           -StdOutPath $outLog `
                                           -StdErrPath $errLog `
                                           -TimeoutSeconds $buildTimeoutSeconds `
                                           -SuccessLogPath $outLog `
                                           -SuccessPatterns $buildSuccessPatterns `
                                           -FailurePatterns $buildFailurePatterns `
                                           -SuccessExitGraceSeconds 30 `
                                           -DisplayName ("Cocos build {0}" -f $name)
    $p = $buildResult.Process

    Merge-Logs -OutPath $outLog -ErrPath $errLog -AllPath $logAll

    $logFailurePattern = Test-LogPatterns -LogPath $logAll -Patterns $buildFailurePatterns -Tail 0
    $logSuccessPattern = Test-LogPatterns -LogPath $logAll -Patterns $buildSuccessPatterns -Tail 0

    if (Test-Path -LiteralPath $logAll) {
      $lines = Get-Content -LiteralPath $logAll -Encoding UTF8 -ErrorAction SilentlyContinue
      foreach ($ln in $lines) {
        if (Filter-CreatorLogLine $ln) { Write-Host $ln }
      }
    }

    Write-Host ("ExitCode: {0}" -f $buildResult.ExitCode)

    if ($buildResult.TimedOut) {
      Write-Host ("[BUILD TIMEOUT] {0}" -f $name) -ForegroundColor Red
      Write-Host ("Check log: {0}" -f $logAll) -ForegroundColor DarkGray
      $failed++
      continue
    }

    if ($buildResult.FailureDetected -or $null -ne $logFailurePattern) {
      $pattern = if ($buildResult.FailureDetected) { $buildResult.FailurePattern } else { $logFailurePattern }
      Write-Host ("[BUILD FAILED] {0}, failure marker: {1}" -f $name, $pattern) -ForegroundColor Red
      Write-Host ("Check log: {0}" -f $logAll) -ForegroundColor DarkGray
      $failed++
      continue
    }

    if ($buildResult.ExitCode -ne 0 -and $null -eq $logSuccessPattern) {
      Write-Host ("[BUILD FAILED] {0}, Cocos exit code: {1}" -f $name, $buildResult.ExitCode) -ForegroundColor Red
      Write-Host ("Check log: {0}" -f $logAll) -ForegroundColor DarkGray
      $failed++
      continue
    }
    if ($buildResult.ExitCode -ne 0 -and $null -ne $logSuccessPattern) {
      Write-Host ("[WARN] Cocos exit code is {0}, but success marker was found: {1}" -f $buildResult.ExitCode, $logSuccessPattern) -ForegroundColor Yellow
    }

    if (-not (Test-Path -LiteralPath $creatorOutput)) {
      Write-Host ("[BUILD FAILED] {0}" -f $name) -ForegroundColor Red
      Write-Host ("Check log: {0}" -f $logAll) -ForegroundColor DarkGray
      $failed++
      continue
    }
  } finally {
    Restore-Creator24BuildTemplates -PatchInfo $creator24TemplatePatch
    Restore-SdkConfigFile -PatchInfo $sdkConfigPatch
    Restore-PureClientFile -PatchInfo $pureClientPatch
  }

  if ($isCreator24) {
    Move-Creator24OutputToPackageRoot -WebMobileDir $creatorOutput -PackageRoot $realOutput
  }
  if ($isSudBuild) {
    Write-Host "[SUD] WeChat mini game output; skipped web loading patch." -ForegroundColor DarkGray
  } elseif ($isCreator24) {
    Write-Host "[提示] Cocos 2.x loading handled by build-templates." -ForegroundColor DarkGray
  } elseif (-not [string]::IsNullOrWhiteSpace($loadingImagePath)) {
    Disable-WebSplashScreen -OutputDir $realOutput -LoadingImagePath $loadingImagePath
  } else {
    Write-Host "[提示] Use Cocos default loading." -ForegroundColor DarkGray
  }

  Write-Host ("[BUILD SUCCESS]  {0}" -f $name) -ForegroundColor Green
  Write-Host ("OutputDir: {0}" -f $realOutput)
  Write-Host ""

  if ($isCreator24) {
    Write-Host "[OBF] Skipped (Cocos Creator 2.x)" -ForegroundColor DarkGray
    Write-Host "[RES-ENC] Skipped (Cocos Creator 2.x)" -ForegroundColor DarkGray
    $archiveExtension = if ($isSudBuild) { ".sp" } else { ".zip" }
    $includeRootFolder = -not $isSudBuild
    $zipPath = Compress-BuildOutput -OutputDir $realOutput -PackageName $packageName -ArchiveExtension $archiveExtension -IncludeRootFolder $includeRootFolder
    if ([string]::IsNullOrWhiteSpace($zipPath)) {
      $failed++
    }
    Write-Host ""
    continue
  }

  # ===================== OBFUSCATION =====================
  if ($obfEnabled) {
    Write-Host "[OBFUSCATION]" -ForegroundColor Cyan

    $targetDir = if ($obfIncludeAllBundles) {
      Join-Path $realOutput "assets"
    } else {
      Join-Path (Join-Path $realOutput "assets") "main"
    }

    if (-not (Test-Path -LiteralPath $targetDir)) {
      Die ("[ERROR] Obfuscation target path not found: {0}" -f $targetDir)
    }

    Write-Host ("Target: {0}" -f $targetDir)
    Write-Host ("Level : {0}" -f $obfLevel)

    $ts2 = Get-Date -Format "yyyyMMdd_HHmmss"
    $obfOut = Join-Path $logsDir ("obf_{0}_{1}.out.log" -f $safeName, $ts2)
    $obfErr = Join-Path $logsDir ("obf_{0}_{1}.err.log" -f $safeName, $ts2)
    $obfAll = Join-Path $logsDir ("obf_{0}_{1}.log" -f $safeName, $ts2)

    $obfArgs = @($obfScript, $targetDir, "--level", "$obfLevel")

    $obfProc = Start-Process -FilePath $nodeExe `
                             -ArgumentList $obfArgs `
                             -NoNewWindow `
                             -Wait `
                             -PassThru `
                             -RedirectStandardOutput $obfOut `
                             -RedirectStandardError  $obfErr

    Merge-Logs -OutPath $obfOut -ErrPath $obfErr -AllPath $obfAll

    if ($obfProc.ExitCode -eq 0) {
      Write-Host ("[OBF SUCCESS]  {0}" -f $name) -ForegroundColor Green
    } else {
      Write-Host ("[OBF FAILED]  {0}" -f $name) -ForegroundColor Red
      Write-Host ("Log: {0}" -f $obfAll) -ForegroundColor DarkGray
      $failed++
      continue
    }

    Write-Host ""
  } else {
    Write-Host "[OBF] Skipped (disabled in config)" -ForegroundColor DarkGray
    Write-Host ""
  }

  # ===================== RESOURCE ENCRYPT =====================
  if ($resEncEnabled) {
    Write-Host "[RES ENCRYPT]" -ForegroundColor Cyan

    $encArgs = @(
      $encScript,
      $realOutput,
      "--key", $resEncKey,
      "--sig", $resEncSig,
      "--includeAllBundles", ($resEncIncludeAllBundles.ToString().ToLower()),
      "--exts", $resEncExts
    )

    $ts3 = Get-Date -Format "yyyyMMdd_HHmmss"
    $encOut = Join-Path $logsDir ("resenc_{0}_{1}.out.log" -f $safeName, $ts3)
    $encErr = Join-Path $logsDir ("resenc_{0}_{1}.err.log" -f $safeName, $ts3)
    $encAll = Join-Path $logsDir ("resenc_{0}_{1}.log" -f $safeName, $ts3)

    $encProc = Start-Process -FilePath $nodeExe `
                             -ArgumentList $encArgs `
                             -NoNewWindow `
                             -Wait `
                             -PassThru `
                             -RedirectStandardOutput $encOut `
                             -RedirectStandardError  $encErr

    Merge-Logs -OutPath $encOut -ErrPath $encErr -AllPath $encAll

    if ($encProc.ExitCode -eq 0) {
      Write-Host ("[RES-ENC SUCCESS]  {0}" -f $name) -ForegroundColor Green
    } else {
      Write-Host ("[RES-ENC FAILED]  {0}" -f $name) -ForegroundColor Red
      Write-Host ("Log: {0}" -f $encAll) -ForegroundColor DarkGray
      $failed++
      continue
    }

    Write-Host ""
  } else {
    Write-Host "[RES-ENC] Skipped (disabled in config)" -ForegroundColor DarkGray
    Write-Host ""
  }

  $archiveExtension = if ($isSudBuild) { ".sp" } else { ".zip" }
  $includeRootFolder = -not $isSudBuild
  $zipPath = Compress-BuildOutput -OutputDir $realOutput -PackageName $packageName -ArchiveExtension $archiveExtension -IncludeRootFolder $includeRootFolder
  if ([string]::IsNullOrWhiteSpace($zipPath)) {
    $failed++
    continue
  }
}

# ===================== Summary =====================
Write-Host "================== BUILD SUMMARY ==================" -ForegroundColor Cyan
if ($failed -eq 0) {
  Write-Host "ALL PROJECTS SUCCESS" -ForegroundColor Green
} else {
  Write-Host ("FAILED Count: {0}" -f $failed) -ForegroundColor Red
}
Write-Host ("Output Root: {0}" -f $exportRoot)
Write-Host ("Logs Dir   : {0}" -f $logsDir)
Write-Host "===================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
exit 0


