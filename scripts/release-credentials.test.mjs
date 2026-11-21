import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {appleCredentials,ISSUER_SERVICE,ISSUER_ACCOUNT} from './release-credentials.mjs';
// The release scripts fill the App Store Connect credentials from this Mac instead of asking for them every release.
const UUID='00000000-1111-2222-3333-444444444444';
const deps=(o={})=>({keys:()=>o.keys??['/k/AuthKey_ABC123.p8'],issuer:service=>{expect(service).toBe(ISSUER_SERVICE);return o.issuer??UUID;}});
describe('appleCredentials',()=>{
 it('fills the key path, key ID and issuer from the one .p8 and the keychain',()=>{expect(appleCredentials({},deps())).toEqual({APPLE_API_KEY:'/k/AuthKey_ABC123.p8',APPLE_API_KEY_ID:'ABC123',APPLE_API_ISSUER:UUID});});
 it('keeps anything already set in the environment',()=>{expect(appleCredentials({APPLE_API_ISSUER:'from-env',APPLE_API_KEY:'/x/AuthKey_ZZZ.p8',APPLE_API_KEY_ID:'ZZZ'},deps({issuer:'unused'}))).toEqual({});});
 it('fills nothing when there is no single .p8 to choose',()=>{expect(appleCredentials({},deps({keys:[]}))).toEqual({APPLE_API_ISSUER:UUID});expect(appleCredentials({},deps({keys:['/k/AuthKey_A.p8','/k/AuthKey_B.p8']}))).toEqual({APPLE_API_ISSUER:UUID});});
 it('leaves the issuer unset when the keychain has none or it is not a UUID',()=>{expect(appleCredentials({},deps({issuer:''}))).not.toHaveProperty('APPLE_API_ISSUER');expect(appleCredentials({},deps({issuer:'not a uuid'}))).not.toHaveProperty('APPLE_API_ISSUER');});
 it('does not pair the .p8 with a key ID it did not come from',()=>{expect(appleCredentials({APPLE_API_KEY_ID:'OTHER'},deps())).toEqual({APPLE_API_ISSUER:UUID});});
 it('reads the same keychain item the setup script saves',()=>{const sh=readFileSync(new URL('./release-setup-secrets.sh',import.meta.url),'utf8');expect(sh).toContain(`-s "${ISSUER_SERVICE}" -a ${ISSUER_ACCOUNT} `);expect(sh).toMatch(/read -r -s -p "Issuer ID/);});
});
