import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

const opts = { from: 'generic', to: 'github' } as const;

describe('codeFence rule', () => {
  it('drops text/plaintext language tags', () => {
    expect(convert('```text\nhello\n```', opts)).not.toContain('```text');
    expect(convert('```plaintext\nhello\n```', opts)).not.toContain('plaintext');
  });

  it('canonicalizes common aliases', () => {
    expect(convert('```sh\necho hi\n```', opts)).toContain('```bash');
    expect(convert('```py\nprint(1)\n```', opts)).toContain('```python');
    expect(convert('```YML\nk: v\n```', opts)).toContain('```yaml');
  });

  it('keeps clean language tags as-is', () => {
    expect(convert('```typescript\nconst a = 1;\n```', opts)).toContain('```typescript');
  });

  it('is idempotent', () => {
    const once = convert('```JS\ncode\n```', opts);
    expect(convert(once, opts)).toBe(once);
  });
});
