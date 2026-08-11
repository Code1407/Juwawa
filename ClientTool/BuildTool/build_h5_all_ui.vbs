Set shell = CreateObject("WScript.Shell")
Set app = CreateObject("Shell.Application")
root = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
ps = shell.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\WindowsPowerShell\v1.0\powershell.exe"
args = "-NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File " & Chr(34) & root & "\build-ui.ps1" & Chr(34) & _
       " -ConfigPath " & Chr(34) & root & "\build-config.json" & Chr(34) & _
       " -ToolConfigPath " & Chr(34) & root & "\build_tool.json" & Chr(34) & _
       " -AutoBuildPath " & Chr(34) & root & "\autobuild.ps1" & Chr(34)
app.ShellExecute ps, args, root, "open", 0
