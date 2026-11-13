// Mac App Store provisioning profile check for `npm run release:mas` (docs/RELEASE.md § Mac App Store).
// A decoded profile is plist XML holding <date> and <data> values. `plutil -convert json` refuses those ("Invalid object
// in plist for JSON format"), and `plutil -extract … json` differs between macOS versions, so the XML is read here.
import {spawnSync} from 'node:child_process';

const ENTITIES={lt:'<',gt:'>',amp:'&',quot:'"',apos:"'"};
const text=s=>s.replace(/&(lt|gt|amp|quot|apos|#x[0-9a-f]+|#\d+);/gi,(_,e)=>e[0]==='#'?String.fromCodePoint(e[1]==='x'||e[1]==='X'?parseInt(e.slice(2),16):Number(e.slice(1))):ENTITIES[e.toLowerCase()]);

/**
 * Parses Apple plist XML into plain values: dict → object, array → array, string/date/data → string (dates stay
 * ISO text, data stays base64), integer/real → number, true/false → boolean. Throws on anything else.
 */
export function parsePlist(xml){
  const tokens=[...xml.replace(/<\?xml[^>]*\?>|<!DOCTYPE[^>]*>|<!--[\s\S]*?-->/g,'').matchAll(/<(\/?)([a-z]+)\b[^>]*?(\/?)>|([^<]+)/gi)];
  let i=0;
  const next=()=>{while(i<tokens.length&&tokens[i][4]!==undefined&&!tokens[i][4].trim())i++;return tokens[i++]};
  const leaf=tag=>{let body='';while(i<tokens.length&&tokens[i][4]!==undefined)body+=tokens[i++][4];const close=tokens[i++];if(!close||close[1]!=='/'||close[2]!==tag)throw Error(`plist: <${tag}> is not closed`);return text(body)};
  function value(t){
    if(!t)throw Error('plist: ended early');
    const [,closing,tag,selfClosing]=t;
    if(closing||!tag)throw Error(`plist: unexpected ${t[0].trim()}`);
    if(selfClosing){if(tag==='true')return true;if(tag==='false')return false;if(tag==='dict')return {};if(tag==='array')return [];if(tag==='string'||tag==='data')return '';throw Error(`plist: unexpected <${tag}/>`)}
    switch(tag){
      case 'dict':{const o={};for(;;){const k=next();if(k&&k[1]==='/'&&k[2]==='dict')return o;if(!k||k[2]!=='key')throw Error('plist: a dict entry has no <key>');const key=leaf('key');o[key]=value(next());}}
      case 'array':{const a=[];for(;;){const t=next();if(t&&t[1]==='/'&&t[2]==='array')return a;a.push(value(t));}}
      case 'string':return leaf(tag);
      case 'date':return leaf(tag).trim();
      case 'data':return leaf(tag).replace(/\s+/g,'');
      case 'integer':case 'real':return Number(leaf(tag).trim());
      case 'true':case 'false':{leaf(tag);return tag==='true'}
      default:throw Error(`plist: unexpected <${tag}>`);
    }
  }
  const root=next();
  if(!root||root[2]!=='plist')throw Error('plist: no <plist> element');
  return value(next());
}

/** Problems with a decoded profile (plist XML) for this app and team; empty when it is a usable Mac App Store profile. */
export function profileProblems(xml,{team,bundleId,now=new Date()}){
  let p;
  try{p=parsePlist(xml)}catch(e){return [`the profile could not be read: ${e.message}`]}
  const entitlements=p&&typeof p==='object'?p.Entitlements:undefined;
  if(!entitlements||typeof entitlements!=='object')return ['the profile has no entitlements, so it is not a provisioning profile'];
  const problems=[];
  const appId=entitlements['com.apple.application-identifier'];
  if(appId!==`${team}.${bundleId}`)problems.push(`profile is for ${appId}, not ${team}.${bundleId}`);
  if(Array.isArray(p.ProvisionedDevices)&&p.ProvisionedDevices.length)problems.push('profile lists devices, so it is a development profile, not "Mac App Store Connect"');
  const expires=typeof p.ExpirationDate==='string'?new Date(p.ExpirationDate):null;
  if(!expires||Number.isNaN(expires.getTime())||expires<=now)problems.push(`profile expired ${p.ExpirationDate??'(no date)'}`);
  if(!(Array.isArray(p.Platform)?p.Platform:[]).includes('OSX'))problems.push('profile is not a macOS profile');
  return problems;
}

/** Decodes the CMS-signed profile at `path` (macOS `security`) and checks it. */
export function checkProfile(path,opts){
  const decoded=spawnSync('security',['cms','-D','-i',path],{encoding:'utf8'});
  if(decoded.status!==0||!decoded.stdout.includes('<?xml'))return [`${path} is not a readable provisioning profile`];
  return profileProblems(decoded.stdout.slice(decoded.stdout.indexOf('<?xml')),opts);
}
