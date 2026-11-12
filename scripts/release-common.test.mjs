import {describe,expect,it} from 'vitest';
import {hasCargoFeature,quoteCmdArg,windowsShellCommand} from './release-common.mjs';
const toml='[package]\nname = "opsanta"\n\n[features]\ne2e = ["dep:a"]\nupdater = ["dep:tauri-plugin-updater"]\n\n[dependencies]\nserde = "1"\n';
describe('hasCargoFeature',()=>{
 it('finds a feature',()=>{expect(hasCargoFeature('updater',toml)).toBe(true);expect(hasCargoFeature('nope',toml)).toBe(false);});
 // Windows runners check files out with CRLF; the v0.1.0 Windows build shipped without its updater because of this.
 it('finds a feature in a CRLF checkout',()=>{expect(hasCargoFeature('updater',toml.replace(/\n/g,'\r\n'))).toBe(true);});
 it('ignores a same-named key outside [features]',()=>{expect(hasCargoFeature('serde',toml)).toBe(false);});
});

/** cmd.exe tokenization after `/s` has stripped Node's one outer pair of quotes. `%` is left doubled, which is what cmd then collapses. */
function cmdTokens(line){
 const tokens=[];let cur='';let q=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(q){if(c==='"'&&line[i+1]==='"'){cur+='"';i++;}else if(c==='"')q=false;else cur+=c;}
  else if(c==='"')q=true;
  else if(c===' '){if(cur)tokens.push(cur);cur='';}
  else cur+=c;
 }
 if(cur)tokens.push(cur);
 return tokens;
}
describe('Windows cmd quoting',()=>{
 const config='C:\\Users\\First Last\\AppData\\Local\\Temp\\opsanta-release-abc\\tauri.release.conf.json';
 const plain='C:\\Users\\runneradmin\\AppData\\Local\\Temp\\opsanta-release-abc\\tauri.release.conf.json';
 it('leaves a space-free command unchanged',()=>{expect(windowsShellCommand('npx',['tauri','build','--bundles','nsis'])).toBe('npx tauri build --bundles nsis');});
 it('keeps a profile path as one --config argument',()=>{
  const joined=windowsShellCommand('npx',['tauri','build','--bundles','nsis','--config',config]);
  expect(cmdTokens(joined)).toEqual(['npx','tauri','build','--bundles','nsis','--config',config]);
  // The bug: Node joins without quoting, so cmd splits the path at the space.
  expect(cmdTokens(['npx','tauri','build','--bundles','nsis','--config',config].join(' ')).length).toBeGreaterThan(6);
 });
 it('does not quote the runner temp path, which has no spaces',()=>{
  expect(cmdTokens(windowsShellCommand('npx',['tauri','build','--config',plain])).at(-1)).toBe(plain);
 });
 it('quotes an empty argument and escapes cmd metacharacters',()=>{
  expect(quoteCmdArg('')).toBe('""');
  expect(quoteCmdArg('100%')).toBe('"100%%"');
  expect(cmdTokens(quoteCmdArg('say "hi"'))).toEqual(['say "hi"']);
 });
});
