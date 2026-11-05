import {describe,expect,it} from 'vitest';
import {hasCargoFeature} from './release-common.mjs';
const toml='[package]\nname = "opsanta"\n\n[features]\ne2e = ["dep:a"]\nupdater = ["dep:tauri-plugin-updater"]\n\n[dependencies]\nserde = "1"\n';
describe('hasCargoFeature',()=>{
 it('finds a feature',()=>{expect(hasCargoFeature('updater',toml)).toBe(true);expect(hasCargoFeature('nope',toml)).toBe(false);});
 // Windows runners check files out with CRLF; the v0.1.0 Windows build shipped without its updater because of this.
 it('finds a feature in a CRLF checkout',()=>{expect(hasCargoFeature('updater',toml.replace(/\n/g,'\r\n'))).toBe(true);});
 it('ignores a same-named key outside [features]',()=>{expect(hasCargoFeature('serde',toml)).toBe(false);});
});
