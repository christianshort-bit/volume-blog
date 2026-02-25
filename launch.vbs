Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c cd ""C:\Users\crs\.antigravity\volume-blog"" & npx electron .", 0, False
