import { convert } from 'mdfit-core';

/**
 * Pure paste-transformation logic, kept free of Obsidian imports so it can
 * be unit tested in plain Node. The plugin shell (main.ts) stays thin.
 */

export interface PasteSettings {
  enabled: boolean;
  /** 'auto' uses the HTML flavor when it carries structure plain text loses (KaTeX, tables). */
  preferHtml: 'auto' | 'never';
}

export const DEFAULT_SETTINGS: PasteSettings = { enabled: true, preferHtml: 'auto' };

export interface PastePayload {
  /** Obsidian's own markdown interpretation of the rich clipboard (may be null). */
  markdown: string | null;
  /** Plain-text flavor of the clipboard. */
  text: string;
  /** HTML flavor of the clipboard ('' when absent). */
  html: string;
}

/** Heuristic: does the HTML flavor carry structure that plain text would lose? */
export function htmlCarriesStructure(html: string): boolean {
  return /class="katex"|<table[\s>]|<semantics>/i.test(html);
}

export function choosePasteInput(
  payload: PastePayload,
  settings: PasteSettings,
): { input: string; from: 'html' | 'auto' } | null {
  const { markdown, text, html } = payload;
  if (settings.preferHtml === 'auto' && html.length > 0 && htmlCarriesStructure(html)) {
    return { input: html, from: 'html' };
  }
  const candidate = (markdown ?? '').length > 0 ? markdown : text;
  if (!candidate || candidate.trim().length === 0) return null;
  return { input: candidate, from: 'auto' };
}

/**
 * Transform clipboard content for an Obsidian paste.
 * Returns null when there is nothing worth converting (let Obsidian behave).
 */
export function transformPaste(payload: PastePayload, settings: PasteSettings): string | null {
  if (!settings.enabled) return null;
  const chosen = choosePasteInput(payload, settings);
  if (!chosen) return null;
  return convert(chosen.input, { from: chosen.from, to: 'obsidian' });
}

/**
 * Merge persisted settings (Obsidian's data.json — possibly written by an
 * older plugin version or hand-edited) over the defaults. Values are
 * validated per key so a malformed data.json can never break paste
 * handling; unknown keys are ignored and forward-incompatible gaps fall
 * back to the defaults.
 */
export function mergeSettings(stored: unknown): PasteSettings {
  const fallback = { ...DEFAULT_SETTINGS };
  if (stored === null || typeof stored !== 'object') return fallback;
  const s = stored as Record<string, unknown>;
  return {
    enabled: typeof s.enabled === 'boolean' ? s.enabled : fallback.enabled,
    preferHtml:
      s.preferHtml === 'auto' || s.preferHtml === 'never' ? s.preferHtml : fallback.preferHtml,
  };
}
