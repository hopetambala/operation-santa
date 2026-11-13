import {describe,expect,it} from 'vitest';
import {parsePlist,profileProblems} from './release-profile.mjs';
// Synthetic, shaped like a decoded Mac App Store Connect profile. Parsed in JavaScript, so it runs the same on every OS
// (CI runs these on Windows too, which has no plutil). The <date> and <data> values are what `plutil -convert json` rejects.
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
describe('parsePlist',()=>{
 it('reads dicts, arrays, strings, dates, data, numbers and booleans',()=>{expect(parsePlist(`<?xml version="1.0"?>\n<!DOCTYPE plist>\n<plist version="1.0">\n<dict>\n\t<key>a</key>\n\t<array><string>x</string><integer>3</integer><real>1.5</real><true/><false/></array>\n\t<key>when</key><date>2027-08-01T01:54:24Z</date>\n\t<key>blob</key><data>\n\tAAEC\n\tAwQ=\n\t</data>\n\t<key>empty</key><dict/>\n\t<key>none</key><array/>\n\t<key>blank</key><string></string>\n</dict>\n</plist>`)).toEqual({a:['x',3,1.5,true,false],when:'2027-08-01T01:54:24Z',blob:'AAECAwQ=',empty:{},none:[],blank:''});});
 it('decodes escaped characters',()=>{expect(parsePlist('<plist><dict><key>n</key><string>Tambala &amp; Co &lt;team&gt; &#233;&#x2603;</string></dict></plist>')).toEqual({n:'Tambala & Co <team> é☃'});});
 it('throws on malformed input instead of guessing',()=>{for(const bad of ['<plist><dict><key>a</key></dict></plist>','<plist><dict><string>no key</string></dict></plist>','<plist><dict><key>a</key><string>open</dict></plist>','<dict/>','<plist><dict><key>a</key><foo>1</foo></dict></plist>'])expect(()=>parsePlist(bad),bad).toThrow(/plist:/);});
 it('reports an unreadable profile as a problem, not a crash',()=>{expect(profileProblems('<plist><dict><key>Entitlements</key>',opts)[0]).toMatch(/could not be read: plist:/);});
});
