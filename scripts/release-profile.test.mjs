import {describe,expect,it} from 'vitest';
import {profileProblems} from './release-profile.mjs';
// Shaped like a decoded Mac App Store Connect profile: the <date> and <data> values are what `plutil -convert json` rejects.
const profile=({appId='95SV963967.org.pasadenajaycees.opsanta',expires='2027-08-01T01:54:24Z',platform='OSX',devices=false}={})=>`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Name</key><string>Operation Santa Mac App Store</string>
<key>CreationDate</key><date>2026-11-12T20:05:26Z</date>
<key>DeveloperCertificates</key><array><data>AAEC</data></array>
<key>Entitlements</key><dict><key>com.apple.application-identifier</key><string>${appId}</string><key>com.apple.developer.team-identifier</key><string>95SV963967</string></dict>
<key>ExpirationDate</key><date>${expires}</date>
<key>Platform</key><array><string>${platform}</string></array>
${devices?'<key>ProvisionedDevices</key><array><string>00008103-000000000000001E</string></array>':''}
</dict></plist>`;
const opts={team:'95SV963967',bundleId:'org.pasadenajaycees.opsanta',now:new Date('2026-11-12T12:00:00Z')};
describe('Mac App Store provisioning profile',()=>{
 it('accepts a Mac App Store profile for this app and team, dates and certificate data included',()=>{expect(profileProblems(profile(),opts)).toEqual([]);});
 it('rejects a profile for another app',()=>{expect(profileProblems(profile({appId:'95SV963967.org.example.phos'}),opts)).toEqual(['profile is for 95SV963967.org.example.phos, not 95SV963967.org.pasadenajaycees.opsanta']);});
 it('rejects a development profile',()=>{expect(profileProblems(profile({devices:true}),opts)[0]).toMatch(/development profile/);});
 it('rejects an expired profile',()=>{expect(profileProblems(profile({expires:'2026-11-01T00:00:00Z'}),opts)).toEqual(['profile expired 2026-11-01T00:00:00Z']);});
 it('rejects an iOS profile',()=>{expect(profileProblems(profile({platform:'iOS'}),opts)).toEqual(['profile is not a macOS profile']);});
 it('rejects something that is not a profile',()=>{expect(profileProblems('<?xml version="1.0"?><plist version="1.0"><dict/></plist>',opts)[0]).toMatch(/not a provisioning profile/);});
});
