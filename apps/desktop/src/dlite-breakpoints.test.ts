import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {dliteBreakpoints} from '../dlite-breakpoints';

function expand(params: {media?: string; container?: string}) {
  const plugin = dliteBreakpoints();
  const media = {params: params.media ?? ''};
  const container = {params: params.container ?? ''};
  plugin.Once({
    walkAtRules(name, cb) {
      if (name === 'media' && params.media !== undefined) cb(media);
      if (name === 'container' && params.container !== undefined) cb(container);
    },
  });
  return {media: media.params, container: container.params};
}

describe('dLite breakpoint expansion', () => {
  it('expands the phone, tablet, and desktop bands without an overlap', () => {
    const out = expand({
      media: '(--tk-dlite-bp-md-up) and (--tk-dlite-bp-lg-down)',
      container: '(--tk-dlite-bp-md-down)',
    });
    expect(out.media).toBe('(min-width: 768px) and (max-width: 1023.98px)');
    expect(out.container).toBe('(max-width: 767.98px)');
    expect(expand({media: '(--tk-dlite-bp-lg-up)'}).media).toBe('(min-width: 1024px)');
  });
  it('follows breakpoints.json, with -down at breakpoint minus 0.02px', () => {
    const raw = JSON.parse(readFileSync(new URL('./brand/generated/breakpoints.json', import.meta.url), 'utf8')) as Record<string, number>;
    for (const [name, px] of Object.entries(raw)) {
      const down = Math.round((Number(px) - 0.02) * 100) / 100;
      expect(expand({media: `(--tk-dlite-bp-${name}-up)`}).media).toBe(`(min-width: ${px}px)`);
      expect(expand({container: `(--tk-dlite-bp-${name}-down)`}).container).toBe(`(max-width: ${down}px)`);
    }
  });
  it('rejects a breakpoint the brand file does not define', () => {
    expect(() => expand({media: '(--tk-dlite-bp-xx-up)'})).toThrow(/Unknown dLite breakpoint \(--tk-dlite-bp-xx-up\)/);
  });
});
