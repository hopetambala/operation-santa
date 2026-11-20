import {describe,expect,it} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkBinary,checkIdentity,gate,BINARY_MARKERS,UPDATER_MARKERS,DEV_MARKERS,PRODUCTION_ID,PRODUCTION_NAME} from './release-gate.mjs';
// A stand-in .app whose executable holds the given text.
function app(text){const dir=join(mkdtempSync(join(tmpdir(),'opsanta-gate-')),'Operation Santa.app','Contents','MacOS');mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'opsanta'),Buffer.from(`\0\0${text}\0\0`));return join(dir,'..','..');}
describe('checkBinary',()=>{
 it('passes a binary with none of the markers',()=>{expect(checkBinary(app('plain release build'),UPDATER_MARKERS)).toEqual([]);});
 it('names each updater marker it finds (Mac App Store builds must have none)',()=>{const found=checkBinary(app(UPDATER_MARKERS.join('\0')),UPDATER_MARKERS);expect(found).toHaveLength(2);expect(found[0]).toMatch(/contains "Updater does not have any endpoints set\."/);});
 it('checks the E2E markers by default, not the updater ones',()=>{expect(checkBinary(app(UPDATER_MARKERS.join('\0')))).toEqual([]);expect(checkBinary(app(BINARY_MARKERS[0]))).toHaveLength(1);});
 it('fails when there is no executable to check',()=>{expect(checkBinary(join(tmpdir(),'missing.app'),UPDATER_MARKERS)[0]).toMatch(/no executable found/);});
});
describe('gate',()=>{
 // gate() maps over the binaries; a bare flatMap(checkBinary) handed the index to the markers parameter and crashed every
 // release at the binary gate ("markers.filter is not a function").
 it('checks each binary for the E2E markers',()=>{expect(gate({bins:[app('plain release build')]})).toEqual([]);expect(gate({bins:[app('plain'),app(BINARY_MARKERS[1])]})).toHaveLength(1);});
});
// A stand-in .app with an Info.plist carrying the given identity.
function appWith(id,name,text='plain release build'){const contents=join(app(text),'Contents');writeFileSync(join(contents,'Info.plist'),`<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key>\n\t<string>${id}</string><key>CFBundleName</key><string>${name}</string></dict></plist>`);return join(contents,'..');}
describe('identity (Dev builds never ship)',()=>{
 it('passes the production bundle ID and name',()=>{expect(checkIdentity(appWith(PRODUCTION_ID,PRODUCTION_NAME))).toEqual([]);expect(gate({bins:[appWith(PRODUCTION_ID,PRODUCTION_NAME)]})).toEqual([]);});
 it('fails a Dev build by its Info.plist',()=>{const found=checkIdentity(appWith('org.pasadenajaycees.opsanta.dev','Operation Santa Dev'));expect(found).toHaveLength(2);expect(found[0]).toMatch(/CFBundleIdentifier is "org\.pasadenajaycees\.opsanta\.dev"/);});
 it('fails a binary that embeds the Dev identity, even without an Info.plist (Windows)',()=>{expect(gate({bins:[app(DEV_MARKERS[0])]})).toHaveLength(1);});
 it('requires an Info.plist when asked (release-mac)',()=>{expect(checkIdentity(app('x'),{required:true})[0]).toMatch(/no Contents\/Info.plist/);expect(checkIdentity(app('x'))).toEqual([]);});
});
