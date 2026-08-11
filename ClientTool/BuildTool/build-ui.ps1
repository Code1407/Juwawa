param(
  [Parameter(Mandatory=$true)][string]$ConfigPath,
  [string]$ToolConfigPath = "",
  [string]$CreatorExe = "",
  [string]$CreatorExe24 = "",
  [Parameter(Mandatory=$true)][string]$AutoBuildPath
)

try {
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
} catch {}

function Show-ErrorMessage {
  param([string]$Message)
  [System.Windows.Forms.MessageBox]::Show(
    $Message,
    "Build Tool",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
}

function Quote-CmdArg {
  param([string]$Value)

  if ($null -eq $Value) { return '""' }
  return '"' + ($Value -replace '"', '""') + '"'
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

if (-not (Test-Path -LiteralPath $AutoBuildPath)) {
  Show-ErrorMessage ("autobuild.ps1 not found: {0}" -f $AutoBuildPath)
  exit 1
}

$configDir = Split-Path -Parent $ConfigPath
if ([string]::IsNullOrWhiteSpace($ToolConfigPath)) {
  $ToolConfigPath = Join-Path $configDir "build_tool.json"
}

function Resolve-BuildToolPath {
  param(
    [string]$BaseDir,
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) { return "" }
  if ([IO.Path]::IsPathRooted($Path)) { return [IO.Path]::GetFullPath($Path) }
  return [IO.Path]::GetFullPath((Join-Path $BaseDir $Path))
}

function Get-DefaultBuildConfigEntries {
  return @(
    [PSCustomObject]@{ Name = "Test";    Path = (Join-Path $configDir "build-config.json");   Default = $false },
    [PSCustomObject]@{ Name = "Develop"; Path = (Join-Path $configDir "build-develop.json");  Default = $false },
    [PSCustomObject]@{ Name = "Release"; Path = (Join-Path $configDir "build-release.json");  Default = $true  }
  )
}

function Read-ToolConfigJson {
  if ($null -ne $script:toolCfg) { return $script:toolCfg }
  if (-not (Test-Path -LiteralPath $ToolConfigPath)) { return $null }

  try {
    $script:toolCfg = Get-Content -LiteralPath $ToolConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
    return $script:toolCfg
  } catch {
    Show-ErrorMessage ("Failed to parse tool config: {0}`r`n{1}" -f $ToolConfigPath, $_.Exception.Message)
    return $null
  }
}

function Load-BuildConfigEntries {
  $toolCfg = Read-ToolConfigJson
  $entries = @()

  if ($null -ne $toolCfg -and $null -ne $toolCfg.buildConfigs) {
    foreach ($item in $toolCfg.buildConfigs) {
      $name = [string]$item.name
      $path = [string]$item.path
      if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($path)) { continue }
      $entries += [PSCustomObject]@{
        Name    = $name
        Path    = Resolve-BuildToolPath -BaseDir $configDir -Path $path
        Default = ($null -ne $item.default -and [bool]$item.default)
      }
    }
  }

  if ($entries.Count -le 0) {
    $entries = Get-DefaultBuildConfigEntries
  }

  $default = $entries | Where-Object { $_.Default } | Select-Object -First 1
  if ($null -eq $default) {
    $default = $entries | Where-Object { $_.Name -eq "Release" } | Select-Object -First 1
  }
  if ($null -eq $default) { $default = $entries[0] }

  $script:buildConfigEntries = @($entries)
  $script:currentConfigPath = [string]$default.Path
}
$script:toolCfg = $null
$script:buildConfigEntries = @()
$script:currentConfigPath = ""
$script:projects = @()
$script:creatorExe = ""
$script:creatorExe24 = ""

function Load-ToolConfig {
  if (-not [string]::IsNullOrWhiteSpace($CreatorExe)) {
    $script:creatorExe = $CreatorExe
    $script:creatorExe24 = $CreatorExe24
    return $true
  }

  if (-not (Test-Path -LiteralPath $ToolConfigPath)) {
    Show-ErrorMessage ("Tool config not found: {0}" -f $ToolConfigPath)
    return $false
  }

  $toolCfg = Read-ToolConfigJson
  if ($null -eq $toolCfg) { return $false }

  $script:creatorExe = [string]$toolCfg.creatorExe
  $script:creatorExe24 = [string]$toolCfg.creatorExe24
  if ([string]::IsNullOrWhiteSpace($script:creatorExe)) {
    Show-ErrorMessage ("creatorExe is missing in tool config: {0}" -f $ToolConfigPath)
    return $false
  }
  return $true
}

$selected = New-Object 'System.Collections.Generic.HashSet[string]'
$buttons = @{}

$form = New-Object System.Windows.Forms.Form
$form.Text = "Cocos H5 Build Tool"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(960, 720)
$form.MinimumSize = New-Object System.Drawing.Size(760, 520)
$form.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 10)
$form.BackColor = [System.Drawing.Color]::FromArgb(245, 247, 250)

$title = New-Object System.Windows.Forms.Label
$title.Text = "Select Games"
$title.AutoSize = $true
$title.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 16, [System.Drawing.FontStyle]::Bold)
$title.Location = New-Object System.Drawing.Point(24, 20)
$title.ForeColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$form.Controls.Add($title)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = "Click a game to select or unselect. Multiple games are allowed."
$hint.AutoSize = $true
$hint.Location = New-Object System.Drawing.Point(28, 58)
$hint.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($hint)

$configLabel = New-Object System.Windows.Forms.Label
$configLabel.Text = "Config:"
$configLabel.AutoSize = $true
$configLabel.Location = New-Object System.Drawing.Point(28, 92)
$configLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($configLabel)

$configRadioPanel = New-Object System.Windows.Forms.FlowLayoutPanel
$configRadioPanel.Location = New-Object System.Drawing.Point(92, 86)
$configRadioPanel.Size = New-Object System.Drawing.Size(828, 32)
$configRadioPanel.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$configRadioPanel.FlowDirection = [System.Windows.Forms.FlowDirection]::LeftToRight
$configRadioPanel.WrapContents = $false
$configRadioPanel.AutoScroll = $true
$configRadioPanel.BackColor = $form.BackColor
$form.Controls.Add($configRadioPanel)

$status = New-Object System.Windows.Forms.Label
$status.Text = "Selected: 0"
$status.AutoSize = $true
$status.Anchor = [System.Windows.Forms.AnchorStyles]::Bottom -bor [System.Windows.Forms.AnchorStyles]::Left
$status.Location = New-Object System.Drawing.Point(28, 632)
$status.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($status)

$panel = New-Object System.Windows.Forms.Panel
$panel.Location = New-Object System.Drawing.Point(24, 124)
$panel.Size = New-Object System.Drawing.Size(896, 478)
$panel.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor [System.Windows.Forms.AnchorStyles]::Bottom -bor [System.Windows.Forms.AnchorStyles]::Left -bor [System.Windows.Forms.AnchorStyles]::Right
$panel.AutoScroll = $true
$panel.HorizontalScroll.Enabled = $false
$panel.HorizontalScroll.Visible = $false
$panel.BackColor = [System.Drawing.Color]::White
$panel.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
$form.Controls.Add($panel)

$startButton = New-Object System.Windows.Forms.Button
$startButton.Text = "Start Build"
$startButton.Size = New-Object System.Drawing.Size(128, 40)
$startButton.Anchor = [System.Windows.Forms.AnchorStyles]::Bottom -bor [System.Windows.Forms.AnchorStyles]::Right
$startButton.Location = New-Object System.Drawing.Point(792, 622)
$startButton.Enabled = $false
$startButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$startButton.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$startButton.ForeColor = [System.Drawing.Color]::White
$form.Controls.Add($startButton)

$clearButton = New-Object System.Windows.Forms.Button
$clearButton.Text = "Clear"
$clearButton.Size = New-Object System.Drawing.Size(112, 40)
$clearButton.Anchor = [System.Windows.Forms.AnchorStyles]::Bottom -bor [System.Windows.Forms.AnchorStyles]::Right
$clearButton.Location = New-Object System.Drawing.Point(668, 622)
$clearButton.Enabled = $false
$clearButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$clearButton.BackColor = [System.Drawing.Color]::FromArgb(229, 231, 235)
$clearButton.ForeColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$form.Controls.Add($clearButton)

$selectAllButton = New-Object System.Windows.Forms.Button
$selectAllButton.Text = "Select All"
$selectAllButton.Size = New-Object System.Drawing.Size(112, 40)
$selectAllButton.Anchor = [System.Windows.Forms.AnchorStyles]::Bottom -bor [System.Windows.Forms.AnchorStyles]::Right
$selectAllButton.Location = New-Object System.Drawing.Point(544, 622)
$selectAllButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$selectAllButton.BackColor = [System.Drawing.Color]::FromArgb(229, 231, 235)
$selectAllButton.ForeColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
$form.Controls.Add($selectAllButton)

function Update-ButtonState {
  param(
    [System.Windows.Forms.Button]$Button,
    [bool]$IsSelected
  )

  if ($IsSelected) {
    $Button.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
    $Button.ForeColor = [System.Drawing.Color]::White
    $Button.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(29, 78, 216)
  } else {
    $Button.BackColor = [System.Drawing.Color]::FromArgb(249, 250, 251)
    $Button.ForeColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
    $Button.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(209, 213, 219)
  }
}

function Update-SelectionStatus {
  $count = $selected.Count
  $status.Text = ("Selected: {0}    Config: {1}" -f $count, ([IO.Path]::GetFileName($script:currentConfigPath)))
  $startButton.Enabled = ($count -gt 0)
  $clearButton.Enabled = ($count -gt 0)
}

function Load-ProjectConfig {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    Show-ErrorMessage ("Config not found: {0}" -f $Path)
    return $false
  }

  try {
    $cfg = Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    Show-ErrorMessage ("Failed to parse config json: {0}`r`n{1}" -f $Path, $_.Exception.Message)
    return $false
  }

  $items = @()
  if ($null -ne $cfg.projects) {
    foreach ($project in $cfg.projects) {
      if ([string]::IsNullOrWhiteSpace([string]$project.packageName)) { continue }
      $items += $project
    }
  }

  if ($items.Count -le 0) {
    Show-ErrorMessage ("No projects found in config: {0}" -f $Path)
    return $false
  }

  $script:currentConfigPath = $Path
  $script:projects = $items
  return $true
}

function Get-SelectedPackagesInConfigOrder {
  $ordered = @()
  foreach ($project in $script:projects) {
    $pkg = [string]$project.packageName
    if (-not [string]::IsNullOrWhiteSpace($pkg) -and $selected.Contains($pkg)) {
      $ordered += $pkg
    }
  }
  return $ordered
}

function Test-CreatorPathsForSelection {
  if ([string]::IsNullOrWhiteSpace($script:creatorExe) -or -not (Test-Path -LiteralPath $script:creatorExe)) {
    Show-ErrorMessage ("Cocos Creator 3.x not found:`r`n{0}" -f $script:creatorExe)
    return $false
  }

  $needsCreator24 = $false
  foreach ($project in $script:projects) {
    $pkg = [string]$project.packageName
    if ([string]::IsNullOrWhiteSpace($pkg) -or -not $selected.Contains($pkg)) { continue }
    $creatorVersion = [string]$project.creatorVersion
    if ($creatorVersion -like "2.*") {
      $needsCreator24 = $true
      break
    }
  }

  if ($needsCreator24 -and ([string]::IsNullOrWhiteSpace($script:creatorExe24) -or -not (Test-Path -LiteralPath $script:creatorExe24))) {
    Show-ErrorMessage ("Cocos Creator 2.x not found:`r`n{0}" -f $script:creatorExe24)
    return $false
  }

  return $true
}

function Switch-ProjectConfig {
  param([string]$Path)

  if (-not (Load-ProjectConfig -Path $Path)) { return }
  $selected.Clear()
  Render-ProjectButtons
  Update-SelectionStatus
}

function Render-BuildConfigRadios {
  $configRadioPanel.Controls.Clear()

  foreach ($entry in $script:buildConfigEntries) {
    $radio = New-Object System.Windows.Forms.RadioButton
    $radio.Text = [string]$entry.Name
    $radio.Tag = [string]$entry.Path
    $radio.AutoSize = $true
    $radio.Margin = New-Object System.Windows.Forms.Padding(0, 4, 18, 0)
    $radio.ForeColor = [System.Drawing.Color]::FromArgb(31, 41, 55)
    $radio.Add_CheckedChanged({
      if ($this.Checked) {
        Switch-ProjectConfig -Path ([string]$this.Tag)
      }
    })
    $configRadioPanel.Controls.Add($radio)

    if ([string]$entry.Path -eq $script:currentConfigPath) {
      $radio.Checked = $true
    }
  }
}

function Render-ProjectButtons {
  $panel.Controls.Clear()
  $buttons.Clear()

  $columns = 5
  $buttonWidth = 158
  $buttonHeight = 64
  $gapX = 16
  $gapY = 16
  $startX = 18
  $startY = 18
  $rows = [Math]::Ceiling($script:projects.Count / $columns)
  $contentHeight = $startY + ($rows * ($buttonHeight + $gapY)) + $startY
  $panel.AutoScrollMinSize = New-Object System.Drawing.Size(0, $contentHeight)

  for ($i = 0; $i -lt $script:projects.Count; $i++) {
    $project = $script:projects[$i]
    $packageName = [string]$project.packageName
    $displayName = [string]$project.name
    if ([string]::IsNullOrWhiteSpace($displayName)) { $displayName = $packageName }

    $row = [Math]::Floor($i / $columns)
    $col = $i % $columns

    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $displayName
    $btn.Tag = $packageName
    $btn.Size = New-Object System.Drawing.Size($buttonWidth, $buttonHeight)
    $btn.Location = New-Object System.Drawing.Point(($startX + $col * ($buttonWidth + $gapX)), ($startY + $row * ($buttonHeight + $gapY)))
    $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $btn.FlatAppearance.BorderSize = 1
    $btn.TextAlign = [System.Drawing.ContentAlignment]::MiddleCenter
    $btn.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 10, [System.Drawing.FontStyle]::Bold)
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    Update-ButtonState -Button $btn -IsSelected $false

    $btn.Add_Click({
      $pkg = [string]$this.Tag
      if ($selected.Contains($pkg)) {
        [void]$selected.Remove($pkg)
        Update-ButtonState -Button $this -IsSelected $false
      } else {
        [void]$selected.Add($pkg)
        Update-ButtonState -Button $this -IsSelected $true
      }
      Update-SelectionStatus
    })

    $buttons[$packageName] = $btn
    $panel.Controls.Add($btn)
  }
}

$clearButton.Add_Click({
  foreach ($pkg in @($selected)) {
    [void]$selected.Remove($pkg)
    if ($buttons.ContainsKey($pkg)) {
      Update-ButtonState -Button $buttons[$pkg] -IsSelected $false
    }
  }
  Update-SelectionStatus
})

$selectAllButton.Add_Click({
  foreach ($project in $script:projects) {
    $pkg = [string]$project.packageName
    if ([string]::IsNullOrWhiteSpace($pkg)) { continue }
    [void]$selected.Add($pkg)
    if ($buttons.ContainsKey($pkg)) {
      Update-ButtonState -Button $buttons[$pkg] -IsSelected $true
    }
  }
  Update-SelectionStatus
})

$startButton.Add_Click({
  if ($selected.Count -le 0) { return }

  if (-not (Test-CreatorPathsForSelection)) { return }

  $packages = Get-SelectedPackagesInConfigOrder
  $packageText = $packages -join ", "
  $answer = [System.Windows.Forms.MessageBox]::Show(
    ("Start building these games?`r`n{0}" -f $packageText),
    "Confirm Build",
    [System.Windows.Forms.MessageBoxButtons]::OKCancel,
    [System.Windows.Forms.MessageBoxIcon]::Question
  )
  if ($answer -ne [System.Windows.Forms.DialogResult]::OK) { return }

  $form.Hide()
  Write-Host ("Selected packages: {0}" -f $packageText)
  $runnerPath = Join-Path $env:TEMP ("cocos-build-{0}.bat" -f ([guid]::NewGuid().ToString("N")))
  $buildArgs = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $AutoBuildPath,
    "-ConfigPath", $script:currentConfigPath,
    "-ToolConfigPath", $ToolConfigPath,
    "-CreatorExe", $script:creatorExe,
    "-CreatorExe24", $script:creatorExe24
  ) + $packages
  $buildCommand = "powershell " + (($buildArgs | ForEach-Object { Quote-CmdArg ([string]$_) }) -join " ")
  $runnerLines = @(
    "@echo off",
    "chcp 65001 >nul",
    ("cd /d {0}" -f (Quote-CmdArg (Split-Path -Parent $AutoBuildPath))),
    $buildCommand,
    "set ""EC=%ERRORLEVEL%""",
    "echo.",
    "echo Build finished with exit code %EC%.",
    "exit /b %EC%"
  )
  Set-Content -LiteralPath $runnerPath -Value $runnerLines -Encoding ASCII
  Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", (Quote-CmdArg $runnerPath)) -WindowStyle Normal | Out-Null
  $script:buildExitCode = 0
  $form.Close()
})

$script:buildExitCode = 0
if (-not (Load-ToolConfig)) {
  [Environment]::Exit(1)
}
Load-BuildConfigEntries
if (-not (Load-ProjectConfig -Path $script:currentConfigPath)) {
  [Environment]::Exit(1)
}
Render-BuildConfigRadios
Render-ProjectButtons
Update-SelectionStatus
[void]$form.ShowDialog()
$form.Dispose()
[System.Windows.Forms.Application]::ExitThread()
[Environment]::Exit($script:buildExitCode)
