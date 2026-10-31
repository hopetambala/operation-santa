// Windows release build (docs/RELEASE.md): NSIS installer for the current user, unsigned this season.
// SmartScreen warns on first run ("More info" ▸ "Run anyway") until a code-signing certificate is added.
//
//   npm run release:windows      release/<version>/Operation-Santa-<version>-x64-setup.exe (+ .sig with the updater)
import {cpSync,existsSync,mkdirSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {TARGET,OUT,fail,tauriConf,buildFrontend,gateOrFail,updaterSetup,tauriBuild} from './release-common.mjs';

if(process.platform!=='win32')fail('The Windows installer is built on Windows (the release workflow uses windows-latest).');
const {version}=tauriConf();

const distHash=buildFrontend();
const updater=updaterSetup();
tauriBuild({args:['--bundles','nsis'],config:updater.config,features:updater.features,env:updater.env,distHash});

const exe=join(TARGET,'release','opsanta.exe');
if(!existsSync(exe))fail(`${exe} was not produced`);
gateOrFail({bins:[exe]});

const nsis=join(TARGET,'release','bundle','nsis');
const setups=readdirSync(nsis).filter(f=>/-setup\.exe(\.sig)?$/.test(f)&&f.includes(version));
if(!setups.some(f=>f.endsWith('.exe')))fail(`no NSIS installer for ${version} in ${nsis}`);
const outDir=join(OUT,version);
mkdirSync(outDir,{recursive:true});
for(const f of setups)cpSync(join(nsis,f),join(outDir,f.replace(/^.*-setup\.exe/,`Operation-Santa-${version}-x64-setup.exe`)));
console.log(`✓ Windows installer (unsigned): ${join(outDir,`Operation-Santa-${version}-x64-setup.exe`)}`);
