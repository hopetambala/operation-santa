// `node e2e/install/run.mjs`: the Move to Applications check against a real app bundle (macOS only).
// Builds the direct-download flavour of the Dev app (features e2e + updater, debug), copies it into Downloads inside a
// throwaway home folder, points "Applications" at a scratch folder, and runs e2e/install/move.e2e.ts. Nothing touches the
// real /Applications, Downloads or Trash. Needs no other E2E app on 127.0.0.1:4445.
import {spawnSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,mkdtempSync,readdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ROOT,DESKTOP,TARGET,fail} from '../../scripts/release-common.mjs';
if(process.platform!=='darwin')fail('The Move to Applications check runs on macOS.');
if(spawnSync('lsof',['-nP','-iTCP:4445','-sTCP:LISTEN']).status===0)fail('Another E2E app is listening on 127.0.0.1:4445.');
const tmp=mkdtempSync(join(tmpdir(),'opsanta-move-'));
// Updater artifacts need the signing key; this test only needs the updater feature compiled in.
const overlay=join(tmp,'no-updater-artifacts.json');writeFileSync(overlay,JSON.stringify({bundle:{createUpdaterArtifacts:false}}));
const env={...process.env,VITE_E2E:'1'};for(const k of Object.keys(env))if(/^APPLE_|^TAURI_SIGNING/.test(k))delete env[k];
// tauri.e2e.conf.json comes after the updater config so its capability list (with the WebDriver permissions) wins.
const b=spawnSync('npx',['tauri','build','--debug','--bundles','app','--features','e2e,updater','--config','src-tauri/tauri.dev.conf.json','--config','src-tauri/tauri.updater.conf.json','--config','src-tauri/tauri.e2e.conf.json','--config',overlay],{cwd:DESKTOP,stdio:'inherit',env});
if(b.status!==0)fail('The direct-download Dev build failed.');
const home=join(tmp,'home');const downloads=join(home,'Downloads');const apps=join(tmp,'Applications');
for(const d of [downloads,apps,join(home,'.Trash')])mkdirSync(d,{recursive:true});
const app=join(downloads,'Operation Santa Dev.app');
cpSync(join(TARGET,'debug','bundle','macos','Operation Santa Dev.app'),app,{recursive:true});
const exe=join(app,'Contents','MacOS','opsanta');
// Whatever signature the build has (ad-hoc in debug), the copy in Applications must keep it.
const signature=p=>spawnSync('codesign',['-dv',p],{encoding:'utf8'}).stderr.match(/^(CDHash|Identifier)=.*$/gm)?.join(' ')??'';
const signedBefore=signature(app);
const wdio=join(ROOT,'node_modules','.bin','wdio');
const t=spawnSync(wdio,['run','e2e/wdio.conf.ts','--spec','e2e/install/move.e2e.ts'],{cwd:ROOT,encoding:'utf8',env:{...process.env,HOME:home,OPSANTA_E2E_APP:exe,OPSANTA_APPLICATIONS_DIR:apps}});
process.stdout.write(t.stdout??'');process.stderr.write(t.stderr??'');
// The app quits on purpose after the move, so WebDriver's own session teardown fails and wdio exits 1 even when every
// assertion passed. The outcome is judged here, from what actually happened on disk and in the process list.
const moved=join(apps,'Operation Santa Dev.app');
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
let relaunched=false;for(let i=0;i<40&&!relaunched;i++){relaunched=spawnSync('pgrep',['-f',join(moved,'Contents','MacOS','opsanta')]).status===0;if(!relaunched)sleep(250);}
const checks=[
  ['the move was offered and Move and Restart was clicked',/MOVE-CLICKED/.test(t.stdout??'')],
  ['the app is in Applications',existsSync(join(moved,'Contents','MacOS','opsanta'))],
  ['the copy keeps the original signature',!!signedBefore&&signature(moved)===signedBefore],
  ['the original left Downloads',!existsSync(app)],
  ['the original is in the Trash',readdirSync(join(home,'.Trash')).some(n=>n.startsWith('Operation Santa Dev (moved to Applications'))],
  ['it reopened from Applications',relaunched],
];
for(const [what,ok] of checks)console.log(`${ok?'✓':'✗'} ${what}`);
// Stop the reopened copy and forget both copies in Launch Services.
spawnSync('pkill',['-f',moved]);
const ls='/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';
for(const p of [moved,app])spawnSync(ls,['-u',p]);
console.log(`\nMove check folder: ${tmp}`);
process.exit(checks.every(([,ok])=>ok)?0:1);
