// `npm run tokens`: regenerate apps/desktop/src/brand/generated from apps/desktop/src/brand/opsanta.tokens.json.
//
// The generator is style-dictionary-dlite, fetched at one pinned commit. It runs on this repo's own
// exact-pinned style-dictionary and tsx (package.json), not on dLite's lockfile, so a clean clone, CI and
// any volunteer get the same output. The generated files are committed and the app never needs this
// script to build. CI runs it and fails if the result differs from what is committed.
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// v0.4.0 is the first release with the breakpoint, focus ring and target size tokens. Pin by commit:
// a tag can be moved. To upgrade, change both, run `npm run tokens`, and review the diff in generated/.
const DLITE = {
  repo: 'https://github.com/hopetambala/style-dictionary-dlite.git',
  tag: 'v0.4.0',
  commit: '90def0b18ff15bb48c36358a826a4de1791cfbc4',
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Under node_modules so it is ignored by git, and so dLite's `import 'style-dictionary'` resolves up to
// this repo's pinned copy. dLite's own node_modules is never installed.
const checkout = path.join(root, 'node_modules/.cache/style-dictionary-dlite');
const brandSrc = path.join(root, 'apps/desktop/src/brand/opsanta.tokens.json');
const out = path.join(root, 'apps/desktop/src/brand/generated');
const web = path.join(checkout, 'dist/web');

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'});
  if (r.error || r.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed${r.error ? `: ${r.error.message}` : ''}`);
    process.exit(r.status || 1);
  }
  return r.stdout.trim();
}

if (!fs.existsSync(brandSrc)) {
  console.error('Missing apps/desktop/src/brand/opsanta.tokens.json');
  process.exit(1);
}

// Fetch only the pinned commit. `git checkout --force` resets anything a previous run left in the tree.
if (!fs.existsSync(path.join(checkout, '.git'))) {
  fs.mkdirSync(checkout, {recursive: true});
  run('git', ['init', '--quiet'], checkout);
}
const have = spawnSync('git', ['cat-file', '-e', `${DLITE.commit}^{commit}`], {cwd: checkout}).status === 0;
if (!have) run('git', ['fetch', '--quiet', '--depth', '1', DLITE.repo, DLITE.commit], checkout);
run('git', ['checkout', '--quiet', '--force', '--detach', DLITE.commit], checkout);
run('git', ['clean', '--quiet', '-fdx'], checkout);
const head = run('git', ['rev-parse', 'HEAD'], checkout);
if (head !== DLITE.commit) {
  console.error(`style-dictionary-dlite is at ${head}, expected ${DLITE.commit} (${DLITE.tag})`);
  process.exit(1);
}

fs.copyFileSync(brandSrc, path.join(checkout, 'tokens/brands/opsanta.tokens.json'));

const tsx = createRequire(import.meta.url).resolve('tsx/cli');
const build = spawnSync(process.execPath, [tsx, 'build/index.ts'], {cwd: checkout, stdio: 'inherit'});
if (build.error || build.status !== 0) process.exit(build.status || 1);

fs.mkdirSync(out, {recursive: true});
const copies = [
  ['opsanta/default/variables.css', 'variables.css'],
  ['opsanta/default/variables.dark.css', 'variables.dark.css'],
  ['custom-media.css', 'custom-media.css'],
  ['breakpoints.json', 'breakpoints.json'],
];
for (const [from, to] of copies) fs.copyFileSync(path.join(web, from), path.join(out, to));
console.log(`Built opsanta tokens with style-dictionary-dlite ${DLITE.tag} (${DLITE.commit.slice(0, 7)}) into apps/desktop/src/brand/generated`);
