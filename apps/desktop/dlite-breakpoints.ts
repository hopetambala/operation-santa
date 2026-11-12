import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * Expands `--tk-dlite-bp-{sm|md|lg|xl}-{up|down}` inside `@media` and `@container`.
 *
 * style-dictionary-dlite writes those names to dist/web/custom-media.css. Vite
 * runs PostCSS once per file, so an `@import` of that file is not visible to
 * the file that uses the query. This reads the same build's breakpoints.json
 * (copied to src/brand/generated) and applies the dictionary's rule: `-down`
 * is `max-width: <bp - 0.02px>` so `-up` and `-down` never overlap.
 * Call sites write `@media (--tk-dlite-bp-md-up)`. The replacement is that whole
 * parenthesized name; replacing the name alone would leave `((min-width: …))`.
 */
const breakpointsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src/brand/generated/breakpoints.json');

type AtRule = { params: string };
type Root = { walkAtRules: (name: string, cb: (rule: AtRule) => void) => void };

export function dliteBreakpoints() {
  if (!fs.existsSync(breakpointsPath)) {
    throw new Error(`Missing ${breakpointsPath}. Run npm run tokens.`);
  }
  const raw = JSON.parse(fs.readFileSync(breakpointsPath, 'utf8')) as Record<string, number>;
  const query: Record<string, string> = {};
  for (const [name, px] of Object.entries(raw)) {
    const down = Math.round((Number(px) - 0.02) * 100) / 100;
    query[`${name}-up`] = `(min-width: ${px}px)`;
    query[`${name}-down`] = `(max-width: ${down}px)`;
  }
  const expand = (params: string) => params.replace(/\(--tk-dlite-bp-([a-z]+)-(up|down)\)/g, (full, name: string, dir: string) => {
    const next = query[`${name}-${dir}`];
    if (!next) throw new Error(`Unknown dLite breakpoint ${full}. Check semantic.breakpoint and run npm run tokens.`);
    return next;
  });
  return {
    postcssPlugin: 'dlite-breakpoints',
    Once(root: Root) {
      root.walkAtRules('media', (rule) => { rule.params = expand(rule.params); });
      root.walkAtRules('container', (rule) => { rule.params = expand(rule.params); });
    },
  };
}
dliteBreakpoints.postcss = true;
