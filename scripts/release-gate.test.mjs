import {describe,expect,it} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkBinary,BINARY_MARKERS,UPDATER_MARKERS} from './release-gate.mjs';
// A stand-in .app whose executable holds the given text.
function app(text){const dir=join(mkdtempSync(join(tmpdir(),'opsanta-gate-')),'Operation Santa.app','Contents','MacOS');mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'opsanta'),Buffer.from(`\0\0${text}\0\0`));return join(dir,'..','..');}
describe('checkBinary',()=>{
 it('passes a binary with none of the markers',()=>{expect(checkBinary(app('plain release build'),UPDATER_MARKERS)).toEqual([]);});
 it('names each updater marker it finds (Mac App Store builds must have none)',()=>{const found=checkBinary(app(UPDATER_MARKERS.join('\0')),UPDATER_MARKERS);expect(found).toHaveLength(2);expect(found[0]).toMatch(/contains "Updater does not have any endpoints set\."/);});
 it('checks the E2E markers by default, not the updater ones',()=>{expect(checkBinary(app(UPDATER_MARKERS.join('\0')))).toEqual([]);expect(checkBinary(app(BINARY_MARKERS[0]))).toHaveLength(1);});
 it('fails when there is no executable to check',()=>{expect(checkBinary(join(tmpdir(),'missing.app'),UPDATER_MARKERS)[0]).toMatch(/no executable found/);});
});
