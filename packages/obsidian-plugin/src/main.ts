import { Notice, Plugin, type Editor, type MarkdownFileInfo } from 'obsidian';
import { DEFAULT_SETTINGS, transformPaste, type PasteSettings } from './paste-transform.js';

/**
 * mdfit for Obsidian — intercepts editor paste and runs the clipboard through
 * the mdfit-core pipeline (math delimiters, headings, citations, tables, …)
 * before it lands in the note. The heavy lifting lives in paste-transform.ts.
 */
export default class MdfitPlugin extends Plugin {
  settings: PasteSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    this.addCommand({
      id: 'toggle-enabled',
      name: 'Toggle paste conversion on/off',
      callback: () => {
        this.settings.enabled = !this.settings.enabled;
        new Notice(`mdfit: paste conversion ${this.settings.enabled ? 'enabled' : 'disabled'}`);
      },
    });

    this.registerEvent(
      this.app.workspace.on(
        'editor-paste',
        (evt: ClipboardEvent, editor: Editor, _info: MarkdownFileInfo) => {
          try {
            const text = evt.clipboardData?.getData('text/plain') ?? '';
            const html = evt.clipboardData?.getData('text/html') ?? '';
            const out = transformPaste({ markdown: null, text, html }, this.settings);
            if (out === null) return;
            evt.preventDefault();
            editor.replaceSelection(out);
          } catch (err) {
            new Notice(
              `mdfit: conversion failed — ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        },
      ),
    );
  }
}
