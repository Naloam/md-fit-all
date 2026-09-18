import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import type { RuleConfig, SourceFlavor, TargetFlavor } from 'mdfit-core';

export interface MdfitConfig {
  defaultFrom?: SourceFlavor | 'auto';
  defaultTo?: TargetFlavor;
  rules?: Partial<RuleConfig>;
}

export function configPath(): string {
  return join(homedir(), '.mdfit', 'config.json');
}

export function loadConfig(): MdfitConfig {
  const path = configPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MdfitConfig;
  } catch {
    return {}; // corrupted config — treat as empty rather than crash
  }
}

export function saveConfig(config: MdfitConfig): void {
  const path = configPath();
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
