// Tauri updater manifest (latest.json) for a GitHub Release, from the signed update artifacts in release/<version>/.
// The installed app reads https://github.com/hopetambala/operation-santa/releases/latest/download/latest.json,
// so an update reaches volunteers only when that Release is published (the workflow leaves it a draft).
//
//   npm run release:manifest [-- --dir release/0.1.0]
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {OUT,fail,tauriConf} from './release-common.mjs';

const REPO='hopetambala/operation-santa';
const {version}=tauriConf();
const args=process.argv.slice(2);
const dir=args.includes('--dir')?args[args.indexOf('--dir')+1]:join(OUT,version);
if(!existsSync(dir))fail(`${dir} does not exist`);
const files=readdirSync(dir);
const url=f=>`https://github.com/${REPO}/releases/download/v${version}/${f}`;
const entry=f=>files.includes(`${f}.sig`)?{signature:readFileSync(join(dir,`${f}.sig`),'utf8').trim(),url:url(f)}:null;

const platforms={};
const mac=entry(`Operation-Santa-${version}-universal.app.tar.gz`);
if(mac){platforms['darwin-aarch64']=mac;platforms['darwin-x86_64']=mac}
const windows=entry(`Operation-Santa-${version}-x64-setup.exe`);
if(windows)platforms['windows-x86_64']=windows;
if(!Object.keys(platforms).length)fail(`no signed update artifacts (*.sig) in ${dir}; was the updater wired in and TAURI_SIGNING_PRIVATE_KEY set?`);

const manifest={version,notes:`Operation Santa ${version}`,pub_date:new Date().toISOString(),platforms};
writeFileSync(join(dir,'latest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`✓ ${join(dir,'latest.json')}: ${Object.keys(platforms).join(', ')}`);
