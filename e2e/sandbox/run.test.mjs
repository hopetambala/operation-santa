import {describe,expect,it} from 'vitest';
import {entitlementDrift} from './run.mjs';
const store={'com.apple.security.app-sandbox':true,'com.apple.application-identifier':'95SV963967.org.pasadenajaycees.opsanta','com.apple.developer.team-identifier':'95SV963967','com.apple.security.network.client':true,'com.apple.security.files.user-selected.read-write':true};
const test={'com.apple.security.app-sandbox':true,'com.apple.security.network.client':true,'com.apple.security.files.user-selected.read-write':true,'com.apple.security.network.server':true};
describe('the sandbox proof uses the store build\'s sandbox',()=>{
 it('accepts the store entitlements minus the profile-only keys, plus the WebDriver port',()=>{expect(entitlementDrift(store,test)).toEqual([]);});
 it('fails when the store build gains an entitlement the proof lacks',()=>{expect(entitlementDrift({...store,'com.apple.security.files.bookmarks.app-scope':true},test)[0]).toMatch(/bookmarks\.app-scope is true in Entitlements\.mas\.plist/);});
 it('fails when the proof grants more than the store build',()=>{expect(entitlementDrift(store,{...test,'com.apple.security.files.downloads.read-write':true})[0]).toMatch(/only in the test entitlements/);});
 it('fails when the proof claims a key that needs a provisioning profile',()=>{expect(entitlementDrift(store,{...test,'com.apple.developer.team-identifier':'95SV963967'})).toContainEqual(expect.stringMatching(/needs a provisioning profile/));});
});
