// GitHub Release notes and SHA256SUMS.txt for release/<version>/ (docs/RELEASE.md § Installing).
// The notes are what a volunteer sees on the download page, so they lead with how to install.
//
//   npm run release:notes [-- --dir release/0.1.0]     writes NOTES.md and SHA256SUMS.txt in that folder
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {OUT,fail,tauriConf} from './release-common.mjs';

const REPO='hopetambala/operation-santa';
const {version}=tauriConf();
const args=process.argv.slice(2);
const dir=args.includes('--dir')?args[args.indexOf('--dir')+1]:join(OUT,version);
if(!existsSync(dir))fail(`${dir} does not exist`);

const files=readdirSync(dir).sort();
const dmg=`Operation-Santa-${version}-universal.dmg`;
const exe=`Operation-Santa-${version}-x64-setup.exe`;
const hasDmg=files.includes(dmg),hasExe=files.includes(exe);
if(!hasDmg&&!hasExe)fail(`neither ${dmg} nor ${exe} is in ${dir}`);

const sums=files.filter(f=>/\.(dmg|exe|tar\.gz)$/.test(f)).map(f=>`${createHash('sha256').update(readFileSync(join(dir,f))).digest('hex')}  ${f}`);
writeFileSync(join(dir,'SHA256SUMS.txt'),sums.join('\n')+'\n');

const download=f=>`[${f}](https://github.com/${REPO}/releases/download/v${version}/${f})`;
const notes=[`Operation Santa ${version}, the Pasadena Jaycees' planner for letter sign-ups, delivery routes and team packets.`,''];
if(hasDmg)notes.push(
  '## Install on a Mac',
  '',
  `1. Download ${download(dmg)}. It runs on Apple silicon and Intel Macs.`,
  '2. Open the downloaded file. A window shows **Operation Santa** and an **Applications** folder.',
  '3. Drag **Operation Santa** onto **Applications**.',
  '4. Eject the Operation Santa disk: click the eject button next to it in the Finder sidebar.',
  '5. Open Operation Santa from Applications (or Launchpad). The first time, macOS asks whether to open an app downloaded from the internet. Click **Open**. That question is normal. The app is signed by the developer and checked by Apple.',
  '',
  "Updates: when a new version is out, Operation Santa offers it when it starts, or from Settings ▸ Check for updates. It installs only when you click **Install and restart**. Installing into Applications needs an administrator account on that Mac.",
  '');
if(hasExe)notes.push(
  '## Install on Windows',
  '',
  `1. Download ${download(exe)}.`,
  '2. Open it. This first Windows build is not code-signed yet, so Windows may show "Windows protected your PC". Click **More info**, then **Run anyway**.',
  '3. The installer sets up Operation Santa for your Windows account only (no administrator needed) and adds it to the Start menu.',
  '');
notes.push(
  '## Check the download (optional)',
  '',
  'On a Mac: open Terminal and run `shasum -a 256 ~/Downloads/' + (hasDmg?dmg:exe) + '`. The result should match the line for that file:',
  '',
  '```',...sums,'```','');
writeFileSync(join(dir,'NOTES.md'),notes.join('\n'));
console.log(`✓ ${join(dir,'NOTES.md')} and SHA256SUMS.txt (${sums.length} files)`);
