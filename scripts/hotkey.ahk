; md-fit-all global hotkey script (AutoHotkey v2)
;
; Install:
;   1. Install AutoHotkey v2: https://www.autohotkey.com/
;   2. Make sure `mdfit` is on PATH (npm install -g @naloam/mdfit).
;   3. Double-click this file (or put a shortcut into shell:startup).
;
; Usage:
;   Ctrl+Alt+V  → convert clipboard for Obsidian
;   Ctrl+Alt+T  → convert clipboard for Typora
;
; Speed: if you keep `mdfit serve` running (resident daemon), the hotkey
; hits it via curl (~100 ms). curl.exe ships with Windows 10+. Without the
; daemon it falls back to a direct `mdfit clip` run (~1.4 s).

#Requires AutoHotkey v2.0
#SingleInstance Force

ClipFor(target) {
    code := RunWait('curl.exe -s --fail -X POST "http://127.0.0.1:7317/clip" -H "Content-Type: application/json" -d "{""to"":""' target'""}"',, 'Hide')
    if (code != 0)
        RunWait('cmd /c mdfit clip --to ' target ' -y',, 'Hide')
}

; Ctrl+Alt+V → Obsidian
^!v:: ClipFor('obsidian')

; Ctrl+Alt+T → Typora
^!t:: ClipFor('typora')
