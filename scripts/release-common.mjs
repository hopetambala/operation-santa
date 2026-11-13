// Shared steps for the release scripts (docs/RELEASE.md). Nothing here notarizes, uploads or publishes.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,rmSync,existsSync,mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gate} from './release-gate.mjs';

export const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
export const DESKTOP=join(ROOT,'apps','desktop');
export const TAURI_DIR=join(DESKTOP,'src-tauri');
export const DIST=join(DESKTOP,'dist');
export const TARGET=process.env.CARGO_TARGET_DIR||join(ROOT,'target');
export const OUT=join(ROOT,'release');
const win=process.platform==='win32';

export function fail(msg){console.error(`\n✗ ${msg}`);process.exit(1)}

/**
 * Node's `shell: true` joins argv with spaces and does not escape them (DEP0190).
 * `cmd /d /s /c` strips only the first and last quote of that whole line, so an
 * argument with a space or a cmd metacharacter has to arrive already quoted.
 * The release overlay is an absolute temp path (`C:\Users\First Last\...`);
 * without this, `--config` is split. The runner temp path has no spaces, so CI still passed.
 *
 * This is `cmd /c` from Node, not a batch file: `%%` does not escape `%`, and `%VAR%`
 * expands even inside quotes, so each `%` is written `"%"` and the C runtime strips those
 * quotes. Trailing backslashes are doubled so node.exe does not treat `\"` as an escaped
 * closer (`npx.cmd` forwards `%*`). `( ) , ; =` are quoted so they stay one argument:
 * `()` groups commands, and `,` `;` `=` are parameter delimiters.
 */
export function quoteCmdArg(arg){
  const s=String(arg);
  // A newline ends the cmd line even inside quotes, so quoting it would not make it one argument.
  if(/[\r\n]/.test(s))throw new Error('quoteCmdArg: a cmd argument cannot contain a newline');
  if(s==='')return '""';
  if(!/[\s"&|<>^%(),;=]/.test(s))return s;
  let body='';let bs=0;
  // Backslashes are literal unless they sit in front of a quote. `%` inserts quotes, so it counts.
  const flush=quote=>{body+='\\'.repeat(quote?bs*2:bs);bs=0};
  for(const c of s){
    if(c==='\\'){bs++;continue}
    if(c==='"'||c==='%'){flush(true);body+=c==='%'?'"%"':'""';continue}
    flush(false);body+=c;
  }
  flush(true);
  return `"${body}"`;
}

/** The line `cmd /s /c` will execute after Node wraps it in one pair of quotes and `/s` strips that pair. */
export function windowsShellCommand(cmd,args){return [cmd,...args].map(quoteCmdArg).join(' ')}

/**
 * spawnSync, through cmd on Windows (so npx.cmd is found) and with no shell elsewhere. On Windows, Node gets
 * the whole quoted line and no argv: nothing is left for it to join, so the line that runs is the one
 * windowsShellCommand returns, and Node 24 prints no DEP0190 warning.
 */
export function spawnCmd(cmd,args,opts={}){
  const shell=opts.shell??win;
  const [file,argv]=shell&&win?[windowsShellCommand(cmd,args),[]]:[cmd,args];
  return spawnSync(file,argv,{...opts,shell});
}

/** `redact` keeps arguments (credential ids, key paths) out of the failure message. */
export function run(cmd,args,{redact=false,...opts}={}){
  const r=spawnCmd(cmd,args,{stdio:'inherit',cwd:ROOT,...opts});
  if(r.status!==0)fail(`${redact?`${cmd} ${args[0]} ${args[1]??''}`:`${cmd} ${args.join(' ')}`} exited ${r.status??r.signal}`);
}

export function capture(cmd,args,opts={}){
  const r=spawnCmd(cmd,args,{encoding:'utf8',cwd:ROOT,...opts});
  return {ok:r.status===0,out:`${r.stdout??''}${r.stderr??''}`};
}

export function tauriConf(){return JSON.parse(readFileSync(join(TAURI_DIR,'tauri.conf.json'),'utf8'))}

/** True when apps/desktop/src-tauri/Cargo.toml declares `[features] name = ...`. */
export function hasCargoFeature(name,toml=readFileSync(join(TAURI_DIR,'Cargo.toml'),'utf8')){
  // CRLF too: Windows runners check the file out that way.
  const features=/^\[features\]\r?\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m.exec(toml)?.[1]??'';
  return new RegExp(`^${name}\\s*=`,'m').test(features);
}

/**
 * The environment every release build runs in. VITE_E2E is removed so the frontend cannot pick up the E2E
 * bridge. Tauri's own notarization and certificate-import variables are removed too, so `tauri build`
 * never sends anything to Apple by itself: notarizing and uploading are separate, explicit steps.
 */
export function releaseEnv(extra={}){
  const env={...process.env};
  for(const k of ['VITE_E2E','APPLE_API_KEY','APPLE_API_KEY_ID','APPLE_API_KEY_PATH','APPLE_API_ISSUER','APPLE_ID','APPLE_PASSWORD','APPLE_APP_SPECIFIC_PASSWORD','APPLE_KEYCHAIN_PROFILE','APPLE_CERTIFICATE','APPLE_CERTIFICATE_PASSWORD','APPLE_SIGNING_IDENTITY','TAURI_SIGNING_PRIVATE_KEY','TAURI_SIGNING_PRIVATE_KEY_PASSWORD'])delete env[k];
  return {...env,...extra};
}

export function hashDir(dir){
  const h=createHash('sha256');
  const walk=d=>readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).forEach(e=>{const p=join(d,e.name);if(e.isDirectory())walk(p);else{h.update(relative(dir,p));h.update(readFileSync(p))}});
  walk(dir);return h.digest('hex');
}

/** Clean frontend build without VITE_E2E, gated. Returns the dist hash so the caller can prove it did not change. */
export function buildFrontend(){
  rmSync(DIST,{recursive:true,force:true});
  run('npm',['run','build'],{env:releaseEnv()});
  gateOrFail({dist:DIST});
  return hashDir(DIST);
}

export function gateOrFail(what){
  const problems=gate(what);
  if(problems.length)fail('Release gate FAILED: this build contains the E2E test bridge.\n  '+problems.join('\n  '));
  console.log(`✓ Release gate: no E2E bridge in ${[what.dist,...(what.bins??[])].filter(Boolean).map(p=>relative(ROOT,p)).join(', ')}`);
}

/**
 * Updater wiring for the DMG and Windows builds (never the Mac App Store build). Active only once the app
 * registers tauri-plugin-updater behind a Cargo feature `updater` (docs/RELEASE.md § Updater). When active it
 * needs the updater signing key in the environment and a real public key in tauri.updater.conf.json.
 */
export function updaterSetup(){
  if(!hasCargoFeature('updater')){
    console.log('Updater: not wired into the app yet (no Cargo feature `updater`), so no update artifacts are built.');
    return {features:[],config:{},env:{}};
  }
  const conf=JSON.parse(readFileSync(join(TAURI_DIR,'tauri.updater.conf.json'),'utf8'));
  if(!conf.plugins?.updater?.pubkey||/REPLACE/.test(conf.plugins.updater.pubkey))fail('Updater: tauri.updater.conf.json still has no public key. See docs/RELEASE.md § Updater.');
  // CI passes the key in the environment; on Hope's Mac it lives in the login keychain (docs/RELEASE.md § Updater).
  const fromKeychain=s=>{if(process.platform!=='darwin')return undefined;const r=spawnSync('security',['find-generic-password','-s',s,'-w'],{encoding:'utf8'});return r.status===0?r.stdout.replace(/\n$/,''):undefined};
  const key=process.env.TAURI_SIGNING_PRIVATE_KEY||fromKeychain('Operation Santa updater private key');
  if(!key)fail('Updater: no TAURI_SIGNING_PRIVATE_KEY and no "Operation Santa updater private key" in the keychain, so update artifacts cannot be signed. See docs/RELEASE.md § Updater.');
  const env={TAURI_SIGNING_PRIVATE_KEY:key};
  const password=process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD??fromKeychain('Operation Santa updater key password');
  if(password!==undefined)env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD=password;
  console.log('Updater: on. Building signed update artifacts.');
  return {features:['updater'],config:conf,env};
}

/** Deep merge for config overlays (objects merge, everything else replaces). */
export function merge(a,b){
  if(!b||typeof b!=='object'||Array.isArray(b))return b;
  const out={...(a&&typeof a==='object'&&!Array.isArray(a)?a:{})};
  for(const [k,v] of Object.entries(b))out[k]=merge(out[k],v);
  return out;
}

/**
 * `tauri build` with the release environment. The frontend is already built and gated, so
 * beforeBuildCommand is switched off and dist must be byte-identical afterwards (another session's
 * `npm run e2e:build` writes the same folder).
 */
export function tauriBuild({args,config,features=[],env={},distHash}){
  const overlay=merge({build:{beforeBuildCommand:null}},config);
  // A file, not inline JSON: Windows' shell would mangle the quotes.
  const file=join(mkdtempSync(join(tmpdir(),'opsanta-release-')),'tauri.release.conf.json');
  writeFileSync(file,JSON.stringify(overlay));
  const full=['tauri','build',...args,'--config',file];
  if(features.length)full.push('--features',features.join(','));
  if(features.includes('e2e'))fail('The e2e feature is never allowed in a release build.');
  run('npx',full,{cwd:DESKTOP,env:releaseEnv(env)});
  if(!existsSync(DIST)||hashDir(DIST)!==distHash)fail('apps/desktop/dist changed during the build (did an E2E build run at the same time?). Run the release again.');
}
