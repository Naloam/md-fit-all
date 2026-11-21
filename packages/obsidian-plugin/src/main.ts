import { Notice, Plugin, type Editor, type MarkdownFileInfo } from 'obsidian';
import { DEFAULT_SETTINGS, mergeSettings, transformPaste, type PasteSettings } from './paste-transform.js';

/**
 * mdfit for Obsidian — intercepts editor paste and runs the clipboard through
 * the mdfit-core pipeline (math delimiters, headings, citations, tables, …)
 * before it lands in the note. The heavy lifting lives in paste-transform.ts.
 */
export default class MdfitPlugin extends Plugin {
  settings: PasteSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: 'toggle-enabled',
      name: 'Toggle paste conversion on/off',
      callback: () => {
        this.settings.enabled = !this.settings.enabled;
        // Persistence must not block the toggle UI; failures land in the console.
        this.saveSettings().catch((err) => {
          console.error('mdfit: failed to persist settings', err);
        });
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

  /** Load from Obsidian's data.json; a missing or corrupt file falls back to defaults. */
  private async loadSettings(): Promise<void> {
    this.settings = mergeSettings(await this.loadData());
  }

  private async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
