// macOS release build (docs/RELEASE.md). Universal (Apple silicon + Intel).
//
//   npm run release:mac                    Developer ID .app + signed DMG in release/<version>/. Sends nothing to Apple.
//   npm run release:mac -- --notarize      ...then notarytool submit --wait, staple, validate, spctl. Sends the DMG to Apple.
//   npm run release:mas                    Mac App Store .app + signed .pkg. Sends nothing to Apple.
//   npm run release:mas -- --upload        ...then altool validate + upload to App Store Connect (TestFlight).
//
// Credentials come from the keychain and the environment only (docs/RELEASE.md § Secrets). Values are never printed.
import {cpSync,existsSync,mkdirSync,mkdtempSync,readdirSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,join} from 'node:path';
import {ROOT,TAURI_DIR,TARGET,OUT,fail,run,capture,tauriConf,buildFrontend,gateOrFail,updaterSetup,tauriBuild,hasCargoFeature} from './release-common.mjs';

const BUNDLE_ID='org.pasadenajaycees.opsanta';
const args=process.argv.slice(2);
const channel=args.includes('--channel')?args[args.indexOf('--channel')+1]:'dmg';
const notarize=args.includes('--notarize');
const upload=args.includes('--upload');
if(!['dmg','mas'].includes(channel))fail(`--channel must be dmg or mas, not ${channel}`);
if(notarize&&channel!=='dmg')fail('--notarize is for the DMG. Mac App Store builds are checked by App Store Connect on upload.');
if(upload&&channel!=='mas')fail('--upload is for the Mac App Store build. A DMG is attached to a GitHub Release instead.');
if(process.platform!=='darwin')fail('macOS release builds run on a Mac.');

const conf=tauriConf();
const version=conf.version;
const product=conf.productName;

// ---------- preflight: everything that would fail late is checked first ----------

function identity(pattern,policy=['-p','codesigning']){return pattern.exec(capture('security',['find-identity','-v',...policy]).out)?.[1]??null}
const teamOf=id=>/\(([A-Z0-9]{10})\)$/.exec(id??'')?.[1];

/** Which notarytool route the environment provides. Same variables as phos (workshop/scripts/apple-signing.mjs). */
function notarizeRoute(env=process.env){
  const {APPLE_API_KEY,APPLE_API_KEY_ID,APPLE_API_ISSUER,APPLE_KEYCHAIN_PROFILE}=env;
  if(APPLE_KEYCHAIN_PROFILE)return {ok:true,name:`keychain profile "${APPLE_KEYCHAIN_PROFILE}"`,args:['--keychain-profile',APPLE_KEYCHAIN_PROFILE]};
  if(APPLE_API_KEY&&APPLE_API_KEY_ID&&APPLE_API_ISSUER){
    if(!existsSync(APPLE_API_KEY))return {ok:false,why:'APPLE_API_KEY must be the path to an AuthKey_*.p8 file, and that file does not exist.'};
    return {ok:true,name:'App Store Connect API key',args:['--key',APPLE_API_KEY,'--key-id',APPLE_API_KEY_ID,'--issuer',APPLE_API_ISSUER]};
  }
  const set=['APPLE_API_KEY','APPLE_API_KEY_ID','APPLE_API_ISSUER'].filter(k=>env[k]);
  return {ok:false,why:set.length?`only ${set.join(', ')} set. Set APPLE_API_KEY (path to .p8) + APPLE_API_KEY_ID + APPLE_API_ISSUER, or APPLE_KEYCHAIN_PROFILE.`:'no credentials. Set APPLE_KEYCHAIN_PROFILE (notarytool store-credentials) or APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER.'};
}

/** Decodes a provisioning profile and checks it is a Mac App Store profile for this app and team. */
function checkProfile(path,team){
  const decoded=capture('security',['cms','-D','-i',path]);
  if(!decoded.ok)return [`${path} is not a readable provisioning profile`];
  const json=capture('plutil',['-convert','json','-o','-','-'],{input:decoded.out.slice(decoded.out.indexOf('<?xml'))});
  if(!json.ok)return [`${path} could not be decoded`];
  const p=JSON.parse(json.out);const problems=[];
  const appId=p.Entitlements?.['com.apple.application-identifier'];
  if(appId!==`${team}.${BUNDLE_ID}`)problems.push(`profile is for ${appId}, not ${team}.${BUNDLE_ID}`);
  if(p.ProvisionedDevices)problems.push('profile lists devices, so it is a development profile, not "Mac App Store Connect"');
  if(new Date(p.ExpirationDate)<=new Date())problems.push(`profile expired ${p.ExpirationDate}`);
  if(!(p.Platform??[]).includes('OSX'))problems.push('profile is not a macOS profile');
  return problems;
}

const problems=[];
const installed=capture('rustup',['target','list','--installed']).out;
for(const t of ['aarch64-apple-darwin','x86_64-apple-darwin'])if(!installed.includes(t))problems.push(`Rust target ${t} is missing: rustup target add ${t}`);

let signer,installer,profile,route,buildNumber;
if(channel==='dmg'){
  signer=identity(/"(Developer ID Application: [^"]+)"/);
  if(!signer)problems.push('no "Developer ID Application" certificate in the keychain');
  if(notarize){route=notarizeRoute();if(!route.ok)problems.push(`notarization: ${route.why}`)}
}else{
  signer=identity(/"((?:Apple Distribution|3rd Party Mac Developer Application): [^"]+)"/);
  installer=identity(/"((?:3rd Party Mac Developer Installer|Mac Installer Distribution): [^"]+)"/,[]);
  if(!signer)problems.push('no "Apple Distribution" certificate in the keychain');
  if(!installer)problems.push('no "Mac Installer Distribution" certificate in the keychain (it signs the .pkg App Store Connect accepts). Xcode ▸ Settings ▸ Accounts ▸ Manage Certificates ▸ + ▸ Mac Installer Distribution');
  profile=process.env.OPSANTA_MAS_PROFILE??join(TAURI_DIR,'profiles','Operation_Santa_Mac_App_Store.provisionprofile');
  if(!existsSync(profile))problems.push(`no provisioning profile at ${profile} (docs/RELEASE.md § Mac App Store)`);
  else if(signer)problems.push(...checkProfile(profile,teamOf(signer)));
  // CFBundleVersion must go up with every upload, from any machine; a UTC timestamp always does.
  buildNumber=process.env.OPSANTA_BUILD_NUMBER??new Date().toISOString().replace(/\D/g,'').slice(2,12);
  if(upload){
    const {APPLE_API_KEY,APPLE_API_KEY_ID,APPLE_API_ISSUER}=process.env;
    if(!(APPLE_API_KEY&&APPLE_API_KEY_ID&&APPLE_API_ISSUER))problems.push('upload: set APPLE_API_KEY (path to .p8) + APPLE_API_KEY_ID + APPLE_API_ISSUER');
    else if(!existsSync(APPLE_API_KEY))problems.push('upload: APPLE_API_KEY does not point at a file');
  }
}
if(problems.length)fail(`Cannot build the ${channel.toUpperCase()} release yet:\n  - ${problems.join('\n  - ')}`);
console.log(`Operation Santa ${version} · ${channel.toUpperCase()} · signing as ${signer}${installer?` · package signed as ${installer}`:''}${buildNumber?` · build ${buildNumber}`:''}`);

// ---------- build ----------

const distHash=buildFrontend();
// The sandbox behavior (season journal, lock and backups inside the container) sits behind Cargo feature `mas`.
const updater=channel==='dmg'?updaterSetup():{features:hasCargoFeature('mas')?['mas']:[],config:{},env:{}};
if(channel==='mas'&&!updater.features.includes('mas'))console.log('Warning: no Cargo feature `mas` yet, so this build keeps the season files the sandbox blocks (docs/RELEASE.md § Sandbox blockers).');
const macOS=channel==='dmg'
  ?{signingIdentity:signer,hardenedRuntime:true,entitlements:join(TAURI_DIR,'Entitlements.plist')}
  :{signingIdentity:signer,hardenedRuntime:true,entitlements:join(TAURI_DIR,'Entitlements.mas.plist'),files:{'embedded.provisionprofile':profile},bundleVersion:buildNumber};
tauriBuild({args:['--target','universal-apple-darwin','--bundles','app'],config:{...updater.config,bundle:{...updater.config.bundle,macOS}},features:updater.features,env:updater.env,distHash});

const bundleDir=join(TARGET,'universal-apple-darwin','release','bundle','macos');
const app=join(bundleDir,`${product}.app`);
if(!existsSync(app))fail(`${app} was not produced`);

// ---------- verify the .app ----------

gateOrFail({bins:[app]});
const exe=join(app,'Contents','MacOS',readdirSync(join(app,'Contents','MacOS'))[0]);
const archs=capture('lipo',['-archs',exe]).out.trim();
if(!(archs.includes('arm64')&&archs.includes('x86_64')))fail(`${exe} is not universal (archs: ${archs})`);
console.log(`✓ Universal binary: ${archs}`);
run('codesign',['--verify','--deep','--strict','--verbose=2',app]);
const details=capture('codesign',['-dvv',app]).out;
if(!details.includes(`Authority=${signer}`))fail(`${app} is not signed by ${signer}`);
if(channel==='dmg'&&!/flags=0x10000\(runtime\)/.test(details))fail('hardened runtime is not on');
const ents=capture('codesign',['-d','--entitlements','-','--xml',app]).out;
const sandboxed=ents.includes('com.apple.security.app-sandbox');
if(sandboxed!==(channel==='mas'))fail(channel==='mas'?'the Mac App Store build is not sandboxed':'the DMG build is unexpectedly sandboxed');
console.log(`✓ codesign --verify --deep --strict: signed by ${signer}, ${channel==='mas'?'sandboxed':'hardened runtime'}`);

const outDir=join(OUT,version);
mkdirSync(outDir,{recursive:true});

if(channel==='dmg'){
  // hdiutil, not Tauri's DMG bundler: that drives Finder over AppleScript, which fails on headless CI (phos does the same).
  const dmg=join(outDir,`Operation-Santa-${version}-universal.dmg`);
  const stage=mkdtempSync(join(tmpdir(),'opsanta-dmg-'));
  cpSync(app,join(stage,`${product}.app`),{recursive:true,verbatimSymlinks:true});
  symlinkSync('/Applications',join(stage,'Applications'));
  rmSync(dmg,{force:true});
  run('hdiutil',['create','-volname',product,'-srcfolder',stage,'-ov','-format','UDZO',dmg]);
  rmSync(stage,{recursive:true,force:true});
  run('codesign',['--force','--sign',signer,'--timestamp',dmg]);
  run('codesign',['--verify','--strict','--verbose=2',dmg]);
  console.log(`✓ DMG signed: ${dmg}`);

  for(const f of readdirSync(bundleDir).filter(f=>/\.app\.tar\.gz(\.sig)?$/.test(f)))
    cpSync(join(bundleDir,f),join(outDir,f.replace(/^.*\.app\.tar\.gz/,`Operation-Santa-${version}-universal.app.tar.gz`)));

  if(!notarize){
    // The DMG's verdict is the one a volunteer meets. The .app alone can read "accepted" on the Mac that built it.
    console.log(`spctl (DMG, before notarization; "rejected … Unnotarized Developer ID" is expected): ${capture('spctl',['--assess','--type','open','--context','context:primary-signature','--verbose=4',dmg]).out.trim()}`);
    console.log(`\nNot notarized. Gatekeeper will block this DMG on other Macs until it is.\nNotarize (sends the DMG to Apple): npm run release:mac -- --notarize`);
  }else{
    console.log(`\nNotarizing via ${route.name}. This uploads the DMG to Apple and waits.`);
    const sub=capture('xcrun',['notarytool','submit',dmg,'--wait',...route.args]);
    console.log(sub.out);
    if(!sub.ok||!/status:\s*Accepted/.test(sub.out))fail('Notarization was not accepted. Read the log: xcrun notarytool log <submission id> with the same credentials.');
    run('xcrun',['stapler','staple',dmg]);
    run('xcrun',['stapler','validate',dmg]);
    const assess=capture('spctl',['--assess','--type','open','--context','context:primary-signature','--verbose=4',dmg]);
    console.log(assess.out.trim());
    if(!assess.ok||!/accepted/.test(assess.out))fail('spctl does not accept the notarized DMG');
    console.log(`✓ Notarized, stapled and accepted by Gatekeeper: ${dmg}`);
  }
}else{
  const pkg=join(outDir,`Operation-Santa-${version}-${buildNumber}.pkg`);
  rmSync(pkg,{force:true});
  run('productbuild',['--component',app,'/Applications','--sign',installer,pkg]);
  run('pkgutil',['--check-signature',pkg]);
  console.log(`✓ Mac App Store package: ${pkg}`);
  if(!upload){
    console.log(`\nNot uploaded. Upload to App Store Connect / TestFlight: npm run release:mas -- --upload`);
  }else{
    const auth=['--api-key',process.env.APPLE_API_KEY_ID,'--api-issuer',process.env.APPLE_API_ISSUER,'--p8-file-path',process.env.APPLE_API_KEY];
    console.log('\nValidating with App Store Connect…');
    run('xcrun',['altool','--validate-app',pkg,...auth],{redact:true});
    console.log('Uploading to App Store Connect…');
    run('xcrun',['altool','--upload-package',pkg,'--wait',...auth],{redact:true});
    console.log(`✓ Uploaded ${basename(pkg)}. It appears in TestFlight after Apple finishes processing.`);
  }
}
