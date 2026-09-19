import { BASE_RULES } from '../types.js';
import type { RuleConfig, SourceFlavor, TargetFlavor } from '../types.js';
import { SOURCE_PROFILES } from './sources.js';
import { TARGET_PROFILES } from './targets.js';

export { SOURCE_PROFILES } from './sources.js';
export { TARGET_PROFILES } from './targets.js';

export function listSourceNames(): SourceFlavor[] {
  return Object.keys(SOURCE_PROFILES) as SourceFlavor[];
}

export function listTargetNames(): TargetFlavor[] {
  return Object.keys(TARGET_PROFILES) as TargetFlavor[];
}

/**
 * Layered rule resolution: base ← source cleanup ← target style ← custom
 * profile ← user overrides. Later layers win key by key.
 */
export function resolveRules(
  source: SourceFlavor,
  target: TargetFlavor,
  overrides?: Partial<RuleConfig>,
  customProfile?: Partial<RuleConfig>,
): RuleConfig {
  return {
    ...BASE_RULES,
    ...SOURCE_PROFILES[source].cleanup,
    ...TARGET_PROFILES[target].style,
    ...customProfile,
    ...overrides,
  };
}
