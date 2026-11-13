import {describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {capture,hasCargoFeature,quoteCmdArg,windowsShellCommand} from './release-common.mjs';
const toml='[package]\nname = "opsanta"\n\n[features]\ne2e = ["dep:a"]\nupdater = ["dep:tauri-plugin-updater"]\n\n[dependencies]\nserde = "1"\n';
describe('hasCargoFeature',()=>{
 it('finds a feature',()=>{expect(hasCargoFeature('updater',toml)).toBe(true);expect(hasCargoFeature('nope',toml)).toBe(false);});
 // Windows runners check files out with CRLF; the v0.1.0 Windows build shipped without its updater because of this.
 it('finds a feature in a CRLF checkout',()=>{expect(hasCargoFeature('updater',toml.replace(/\n/g,'\r\n'))).toBe(true);});
 it('ignores a same-named key outside [features]',()=>{expect(hasCargoFeature('serde',toml)).toBe(false);});
});

/**
 * Argv as node.exe's C runtime reads the line `npx.cmd` forwards with `%*`.
 * A quote toggles, `""` inside quotes is one literal quote, and backslashes are
 * literal unless they immediately precede a quote (an odd run escapes it).
 */
function crtArgv(line){
 const args=[];let cur='';let q=false;let started=false;let i=0;
 const push=()=>{args.push(cur);cur='';started=false};
 while(i<line.length){
  const c=line[i];
  if(!q&&(c===' '||c==='\t')){if(started)push();i++;continue}
  started=true;
  if(c==='\\'){
   let bs=0;while(i<line.length&&line[i]==='\\'){bs++;i++}
   if(i<line.length&&line[i]==='"'){
    cur+='\\'.repeat(bs>>1);
    if(bs&1){cur+='"';i++}
    else if(q&&line[i+1]==='"'){cur+='"';i+=2}
    else{q=!q;i++}
   }else cur+='\\'.repeat(bs);
   continue;
  }
  if(c==='"'){
   if(q&&line[i+1]==='"'){cur+='"';i+=2}
   else{q=!q;i++}
   continue;
  }
  cur+=c;i++;
 }
 if(started)args.push(cur);
 return args;
}
describe('Windows cmd quoting',()=>{
 const config='C:\\Users\\First Last\\AppData\\Local\\Temp\\opsanta-release-abc\\tauri.release.conf.json';
 const plain='C:\\Users\\runneradmin\\AppData\\Local\\Temp\\opsanta-release-abc\\tauri.release.conf.json';
 it('parses the C runtime cases the quoter is judged against',()=>{
  expect(crtArgv('npx tauri')).toEqual(['npx','tauri']);
  expect(crtArgv('"say ""hi"""')).toEqual(['say "hi"']);
  expect(crtArgv('npx "" tauri')).toEqual(['npx','','tauri']);
  // Two trailing backslashes plus a closer yield one backslash. One escapes the closer instead.
  expect(crtArgv('"C:\\Users\\First Last\\\\"')).toEqual(['C:\\Users\\First Last\\']);
  expect(crtArgv('"C:\\Users\\First Last\\"')).toEqual(['C:\\Users\\First Last"']);
 });
 it('leaves a space-free command unchanged',()=>{expect(windowsShellCommand('npx',['tauri','build','--bundles','nsis'])).toBe('npx tauri build --bundles nsis');});
 it('keeps a profile path as one --config argument',()=>{
  const joined=windowsShellCommand('npx',['tauri','build','--bundles','nsis','--config',config]);
  expect(joined).toBe(`npx tauri build --bundles nsis --config "${config}"`);
  expect(crtArgv(joined)).toEqual(['npx','tauri','build','--bundles','nsis','--config',config]);
  // The bug: Node joins without quoting, so the runtime splits the path at the space.
  expect(crtArgv(['npx','tauri','build','--bundles','nsis','--config',config].join(' ')).length).toBeGreaterThan(6);
 });
 it('does not quote the runner temp path, which has no spaces',()=>{
  expect(windowsShellCommand('npx',['tauri','build','--config',plain])).toBe(`npx tauri build --config ${plain}`);
 });
 it('keeps an empty argument',()=>{
  expect(quoteCmdArg('')).toBe('""');
  expect(windowsShellCommand('npx',['tauri','','build'])).toBe('npx tauri "" build');
  expect(crtArgv(windowsShellCommand('npx',['tauri','','build']))).toEqual(['npx','tauri','','build']);
 });
 it('keeps percent signs literal, because %% is not an escape on cmd /c',()=>{
  expect(quoteCmdArg('100%')).toBe('"100"%""');
  expect(crtArgv(quoteCmdArg('100%'))).toEqual(['100%']);
  expect(quoteCmdArg('%TEMP%')).toBe('""%"TEMP"%""');
  expect(quoteCmdArg('%TEMP%')).not.toMatch(/%TEMP%/);
  expect(crtArgv(quoteCmdArg('%TEMP%'))).toEqual(['%TEMP%']);
  expect(crtArgv(quoteCmdArg('%%'))).toEqual(['%%']);
 });
 it('keeps quotes inside a path, including a backslash before the quote',()=>{
  expect(crtArgv(quoteCmdArg('say "hi"'))).toEqual(['say "hi"']);
  expect(crtArgv(quoteCmdArg('"'))).toEqual(['"']);
  expect(crtArgv(quoteCmdArg('C:\\foo\\"bar'))).toEqual(['C:\\foo\\"bar']);
 });
 it('doubles trailing backslashes so the closing quote survives node.exe',()=>{
  const one='C:\\Users\\First Last\\';
  expect(quoteCmdArg(one)).toBe('"C:\\Users\\First Last\\\\"');
  expect(crtArgv(quoteCmdArg(one))).toEqual([one]);
  const two='C:\\Users\\First Last\\\\';
  expect(crtArgv(quoteCmdArg(two))).toEqual([two]);
 });
 it('quotes cmd metacharacters and .cmd parameter separators',()=>{
  for(const arg of ['a&b','a|b','a<b','a>b','a^b','a(b)','a,b','a;b','a=b','a\tb']){
   expect(quoteCmdArg(arg)).toBe(`"${arg}"`);
   expect(crtArgv(quoteCmdArg(arg))).toEqual([arg]);
  }
  expect(crtArgv(quoteCmdArg('C:\\Users\\First(Last)\\file.json'))).toEqual(['C:\\Users\\First(Last)\\file.json']);
 });
 it('round-trips a path with a space, a percent, and a trailing backslash',()=>{
  const path='C:\\Users\\First Last%\\';
  expect(quoteCmdArg(path)).not.toMatch(/%[A-Za-z0-9_]+%/);
  expect(crtArgv(quoteCmdArg(path))).toEqual([path]);
 });
 it('rejects a newline, which would split the cmd line inside quotes',()=>{
  expect(()=>quoteCmdArg('a\nb')).toThrow(/newline/);
  expect(()=>quoteCmdArg('a\rb')).toThrow(/newline/);
 });
});

// The cases above are judged against a model of the C runtime. This one runs the real chain on the Windows
// CI runner: Node's `cmd /d /s /c`, then a .cmd shim that forwards `%*` to node.exe, the way npx.cmd does.
describe.runIf(process.platform==='win32')('Windows cmd quoting through the real cmd.exe',()=>{
 it('delivers every argument unchanged, without the DEP0190 warning',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'opsanta-quote-'));
  writeFileSync(join(dir,'argv.cjs'),'process.stdout.write(JSON.stringify(process.argv.slice(2)))');
  writeFileSync(join(dir,'echo-args.cmd'),`@"${process.execPath}" "%~dp0argv.cjs" %*\r\n`);
  const args=['tauri','build','--config','C:\\Users\\First Last\\AppData\\Local\\Temp\\opsanta-release-abc\\tauri.release.conf.json',
   '','100%','%TEMP%','%%','say "hi"','C:\\Users\\First Last\\','C:\\foo\\"bar','C:\\Users\\First Last%\\',
   'a&b','a|b','a<b','a>b','a^b','a(b)','a,b','a;b','a=b','a\tb'];
  const warnings=[];const onWarning=w=>warnings.push(w.code);
  process.on('warning',onWarning);
  try{
   const r=capture(join(dir,'echo-args.cmd'),args);
   expect(r.ok,r.out).toBe(true);
   expect(JSON.parse(r.out)).toEqual(args);
   // Node emits warnings on a later tick, so wait one before stopping listening.
   await new Promise(resolve=>setImmediate(resolve));
  }finally{process.off('warning',onWarning);rmSync(dir,{recursive:true,force:true})}
  expect(warnings).not.toContain('DEP0190');
 });
});
