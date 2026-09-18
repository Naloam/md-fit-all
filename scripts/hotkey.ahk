; md-fit-all global hotkey script (AutoHotkey v2)
;
; Install:
;   1. Install AutoHotkey v2: https://www.autohotkey.com/
;   2. Make sure `mdfit` is on PATH (npm install -g mdfit, or pnpm link).
;   3. Double-click this file (or put a shortcut into shell:startup).
;
; Usage:
;   Ctrl+Alt+V  → convert clipboard for Obsidian
;   Ctrl+Alt+T  → convert clipboard for Typora
;
; Then just: copy from ChatGPT → press the hotkey → paste into your editor.

#Requires AutoHotkey v2.0
#SingleInstance Force

; Ctrl+Alt+V → Obsidian
^!v:: {
    RunWait('cmd /c mdfit clip --to obsidian -y',, 'Hide')
}

; Ctrl+Alt+T → Typora
^!t:: {
    RunWait('cmd /c mdfit clip --to typora -y',, 'Hide')
}
