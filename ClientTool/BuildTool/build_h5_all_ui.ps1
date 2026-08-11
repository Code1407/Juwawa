$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildUi = Join-Path $root "build-ui.ps1"
$config = Join-Path $root "build-config.json"
$toolConfig = Join-Path $root "build_tool.json"
$autoBuild = Join-Path $root "autobuild.ps1"

& $buildUi `
  -ConfigPath $config `
  -ToolConfigPath $toolConfig `
  -AutoBuildPath $autoBuild
