import { WindowsClipboard } from './windows.js';
import { MacClipboard } from './macos.js';
import { LinuxClipboard } from './linux.js';

export interface ClipboardContent {
  text: string;
  html?: string;
}

export interface ClipboardAdapter {
  readText(): Promise<string>;
  readHtml(): Promise<string | undefined>;
  writeText(text: string): Promise<void>;
}

export function getClipboardAdapter(): ClipboardAdapter {
  switch (process.platform) {
    case 'win32':
      return new WindowsClipboard();
    case 'darwin':
      return new MacClipboard();
    default:
      return new LinuxClipboard();
  }
}
