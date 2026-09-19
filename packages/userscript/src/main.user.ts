import { convert } from 'mdfit-core';
import { rescueImages } from './rescue.js';

/**
 * mdfit userscript — select any part of a chat answer, then use the
 * Tampermonkey menu command to copy it as clean Markdown for your editor.
 * Selection-based (not DOM-button-based) so it survives chat UI redesigns.
 */

type Target = 'obsidian' | 'typora' | 'github';

function selectionHtml(): string | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
    alert('mdfit: first select the text you want to copy.');
    return null;
  }
  const fragment = sel.getRangeAt(0).cloneContents();
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

async function copySelectionAs(target: Target): Promise<void> {
  try {
    const html = selectionHtml();
    if (html === null) return;

    const rescued = await rescueImages(html);
    const markdown = convert(rescued, { from: 'html', to: target });
    GM_setClipboard(markdown);

    console.log(`mdfit: copied selection as ${target} markdown (${markdown.length} chars)`);
  } catch (err) {
    alert(`mdfit: copy failed — ${err instanceof Error ? err.message : String(err)}`);
  }
}

GM_registerMenuCommand('📋 Copy selection as Obsidian', () => void copySelectionAs('obsidian'));
GM_registerMenuCommand('📄 Copy selection as Typora', () => void copySelectionAs('typora'));
GM_registerMenuCommand('🐙 Copy selection as GitHub', () => void copySelectionAs('github'));
