import type { RuleConfig } from 'mdfit-core';

const VALID_KEYS = new Set<string>([
  'mathDelimiters',
  'citations',
  'headings',
  'codeFence',
  'bullet',
  'emphasis',
  'emphasisFix',
  'cjkSpacing',
  'callouts',
  'wikilinks',
  'wikiLinkify',
  'calloutize',
  'stripArtifacts',
  'wrapLatexEnv',
]);

/**
 * Parse `--rule k=v` CLI arguments into a partial RuleConfig.
 * Values: true/false, numbers, or raw strings (validated by the core types
 * at conversion time).
 */
export function parseRuleOverrides(pairs: string[]): Partial<RuleConfig> {
  const overrides: Record<string, unknown> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    if (eq === -1) throw new Error(`Invalid --rule "${pair}" — expected key=value`);
    const key = pair.slice(0, eq);
    if (!VALID_KEYS.has(key)) {
      throw new Error(`Unknown rule key "${key}". Run \`mdfit rules list\` for valid keys.`);
    }
    const raw = pair.slice(eq + 1);
    overrides[key] = parseValue(raw);
  }
  return overrides as Partial<RuleConfig>;
}

function parseValue(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}
