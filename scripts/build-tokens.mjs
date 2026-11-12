import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(root, 'vendor/style-dictionary-dlite');
const brandSrc = path.join(root, 'apps/desktop/src/brand/opsanta.tokens.json');
const brandDest = path.join(vendor, 'tokens/brands/opsanta.tokens.json');
const out = path.join(root, 'apps/desktop/src/brand/generated');
const web = path.join(vendor, 'dist/web');

if (!fs.existsSync(brandSrc)) {
  console.error('Missing apps/desktop/src/brand/opsanta.tokens.json');
  process.exit(1);
}

if (!fs.existsSync(path.join(vendor, 'package.json'))) {
  console.error('Clone https://github.com/hopetambala/style-dictionary-dlite into vendor/style-dictionary-dlite first.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(brandDest), {recursive: true});
fs.copyFileSync(brandSrc, brandDest);

if (!fs.existsSync(path.join(vendor, 'node_modules/style-dictionary'))) {
  const install = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {cwd: vendor, stdio: 'inherit'});
  if (install.status) process.exit(install.status ?? 1);
}

const build = spawnSync('npm', ['run', 'build'], {cwd: vendor, stdio: 'inherit'});
if (build.status) process.exit(build.status ?? 1);

fs.mkdirSync(out, {recursive: true});
const copies = [
  ['opsanta/default/variables.css', 'variables.css'],
  ['opsanta/default/variables.dark.css', 'variables.dark.css'],
  ['custom-media.css', 'custom-media.css'],
  ['breakpoints.json', 'breakpoints.json'],
];
for (const [from, to] of copies) fs.copyFileSync(path.join(web, from), path.join(out, to));
console.log('Copied opsanta tokens to apps/desktop/src/brand/generated');
