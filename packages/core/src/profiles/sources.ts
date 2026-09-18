import type { SourceFlavor, SourceProfile } from '../types.js';

/**
 * Source profiles describe input quirks. LLM chats all share a family of
 * artifacts: \( \) math delimiters, citations, headings starting at ###,
 * "Copy code" chrome. `generic` assumes none of them.
 */
export const SOURCE_PROFILES: Record<SourceFlavor, SourceProfile> = {
  chatgpt: {
    name: 'chatgpt',
    description: 'ChatGPT / GPT-5 / Codex style output',
    cleanup: {
      mathDelimiters: 'convert',
      citations: 'strip',
      headings: 'top-level',
      stripArtifacts: true,
      wrapLatexEnv: true,
    },
  },
  claude: {
    name: 'claude',
    description: 'Claude style output',
    cleanup: {
      mathDelimiters: 'convert',
      citations: 'keep',
      headings: 'top-level',
      stripArtifacts: true,
      wrapLatexEnv: true,
    },
  },
  gemini: {
    name: 'gemini',
    description: 'Gemini style output',
    cleanup: {
      mathDelimiters: 'convert',
      citations: 'strip',
      headings: 'top-level',
      stripArtifacts: true,
      wrapLatexEnv: true,
    },
  },
  generic: {
    name: 'generic',
    description: 'Unknown/neutral Markdown — only target styling applies',
    cleanup: {},
  },
  html: {
    name: 'html',
    description: 'Rich-text HTML from the clipboard (converted via Turndown first)',
    cleanup: {
      mathDelimiters: 'convert',
      stripArtifacts: true,
    },
  },
};
