// Mac App Store provisioning profile check for `npm run release:mas` (docs/RELEASE.md § Mac App Store).
// A profile is a signed plist that holds <date> and <data> values, which `plutil -convert json` refuses
// ("Invalid object in plist for JSON format"), so each field is extracted on its own.
import {spawnSync} from 'node:child_process';

/** One value from plist XML, or undefined when the key is absent. */
function extract(xml,key,format){
  const r=spawnSync('plutil',['-extract',key,format,'-o','-','-'],{input:xml,encoding:'utf8'});
  return r.status===0?r.stdout.trim():undefined;
}

/** Problems with a decoded profile (plist XML) for this app and team; empty when it is a usable Mac App Store profile. */
export function profileProblems(xml,{team,bundleId,now=new Date()}){
  const json=k=>{const v=extract(xml,k,'json');return v===undefined?undefined:JSON.parse(v)};
  const entitlements=json('Entitlements');
  if(!entitlements)return ['the profile has no entitlements, so it is not a provisioning profile'];
  const problems=[];
  const appId=entitlements['com.apple.application-identifier'];
  if(appId!==`${team}.${bundleId}`)problems.push(`profile is for ${appId}, not ${team}.${bundleId}`);
  if(json('ProvisionedDevices'))problems.push('profile lists devices, so it is a development profile, not "Mac App Store Connect"');
  const expires=extract(xml,'ExpirationDate','raw');
  if(!expires||new Date(expires)<=now)problems.push(`profile expired ${expires??'(no date)'}`);
  if(!(json('Platform')??[]).includes('OSX'))problems.push('profile is not a macOS profile');
  return problems;
}

/** Decodes the CMS-signed profile at `path` and checks it. */
export function checkProfile(path,opts){
  const decoded=spawnSync('security',['cms','-D','-i',path],{encoding:'utf8'});
  if(decoded.status!==0||!decoded.stdout.includes('<?xml'))return [`${path} is not a readable provisioning profile`];
  return profileProblems(decoded.stdout.slice(decoded.stdout.indexOf('<?xml')),opts);
}
