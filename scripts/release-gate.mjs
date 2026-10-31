// Release gate: fail if a build carries the E2E test bridge (docs/RELEASE.md § The e2e gate).
// The bridge is the Cargo feature `e2e` (an unauthenticated WebDriver server on 127.0.0.1:4445) plus a
// VITE_E2E=1 frontend. Tauri compresses the frontend inside the binary, so the frontend is checked on disk.
//
//   node scripts/release-gate.mjs --dist apps/desktop/dist --bin "path/to/Operation Santa.app" [--bin x.exe ...]
import {readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import {join,basename} from 'node:path';
import {pathToFileURL} from 'node:url';

export const BINARY_MARKERS=['WDIO WebDriver plugin initialized','WebdriverIO E2E harness','wdio-webdriver:default'];
export const DIST_MARKERS=['WDIO Tauri Plugin','__wdio_mocks__'];

function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=join(dir,e.name);return e.isDirectory()?walk(p):[p]})}

/** Executables to scan: a .app's Contents/MacOS/*, otherwise the file itself. */
export function binariesOf(path){
  if(path.endsWith('.app')){const macos=join(path,'Contents','MacOS');return existsSync(macos)?readdirSync(macos).map(f=>join(macos,f)):[]}
  return existsSync(path)&&statSync(path).isFile()?[path]:[];
}

export function checkBinary(path){
  const bins=binariesOf(path);
  if(bins.length===0)return [`${path}: no executable found to check`];
  return bins.flatMap(b=>{const buf=readFileSync(b);return BINARY_MARKERS.filter(m=>buf.includes(m)).map(m=>`${b}: contains "${m}"`)});
}

export function checkDist(dir){
  if(!existsSync(join(dir,'index.html')))return [`${dir}: no index.html, so there is no frontend to check`];
  const problems=[];
  for(const f of walk(dir)){
    if(/^e2e-.*\.js$/.test(basename(f)))problems.push(`${f}: E2E bridge chunk (built with VITE_E2E=1)`);
    const buf=readFileSync(f);
    for(const m of DIST_MARKERS)if(buf.includes(m))problems.push(`${f}: contains "${m}"`);
  }
  return problems;
}

/** Returns the list of problems; empty means the gate passes. */
export function gate({dist,bins=[]}){
  return [...(dist?checkDist(dist):[]),...bins.flatMap(checkBinary)];
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const args=process.argv.slice(2);let dist;const bins=[];
  for(let i=0;i<args.length;i++){if(args[i]==='--dist')dist=args[++i];else if(args[i]==='--bin')bins.push(args[++i]);else{console.error(`Unknown argument ${args[i]}`);process.exit(2)}}
  if(!dist&&bins.length===0){console.error('Usage: release-gate.mjs --dist <dir> --bin <app|exe> ...');process.exit(2)}
  const problems=gate({dist,bins});
  if(problems.length){console.error('✗ Release gate FAILED: this build contains the E2E test bridge.\n  '+problems.join('\n  '));process.exit(1)}
  console.log(`✓ Release gate passed: no E2E bridge in ${[dist,...bins].filter(Boolean).join(', ')}`);
}
