export const CORE_VERSION = '0.1.0';

// Types & config
export type {
  SourceFlavor,
  TargetFlavor,
  RuleConfig,
  SourceProfile,
  TargetProfile,
  ConvertOptions,
  DetectionResult,
  ConvertResult,
} from './types.js';
export { BASE_RULES } from './types.js';

// Profiles
export {
  SOURCE_PROFILES,
  TARGET_PROFILES,
  listSourceNames,
  listTargetNames,
  resolveRules,
} from './profiles/index.js';

// Rule registries (for CLI introspection / docs)
export { PRE_RULES, type PreRule } from './pipeline/pre.js';
export { AST_RULES, type AstRule } from './pipeline/ast.js';

// Engine
export { convert, convertDetailed } from './convert.js';
export { detect } from './detect.js';
export { protectedTransform, walkSegments } from './pipeline/protected.js';
export { htmlToMarkdown } from './rules/html-input.js';
