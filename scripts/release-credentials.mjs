// App Store Connect credentials for notarizing and TestFlight uploads, filled from this Mac so nobody pastes the issuer
// ID every release (docs/RELEASE.md § One-time setup). Anything already in the environment wins. Values are never printed.
//
//   key path + key ID   the one AuthKey_<ID>.p8 in ~/.appstoreconnect/private_keys
//   issuer ID           the login-keychain item that `scripts/release-setup-secrets.sh notary` saves
import {existsSync,readdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

export const ISSUER_SERVICE='Operation Santa App Store Connect issuer';
export const ISSUER_ACCOUNT='opsanta';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEYS=join(homedir(),'.appstoreconnect','private_keys');

const machine={
  keys:()=>existsSync(KEYS)?readdirSync(KEYS).filter(f=>/^AuthKey_[A-Z0-9]+\.p8$/.test(f)).map(f=>join(KEYS,f)):[],
  // `security` prints the password only to the captured stdout; nothing reaches the terminal or the logs.
  issuer:service=>{const r=spawnSync('security',['find-generic-password','-s',service,'-a',ISSUER_ACCOUNT,'-w'],{encoding:'utf8'});return r.status===0?r.stdout.trim():''},
};

/** The credential variables this Mac can supply that the environment doesn't already set. */
export function appleCredentials(env=process.env,{keys,issuer}=machine){
  const out={};
  // Only fill the key when neither half is set, so a key ID from the environment is never paired with a different .p8.
  if(!env.APPLE_API_KEY&&!env.APPLE_API_KEY_ID){
    const found=keys();
    if(found.length===1){out.APPLE_API_KEY=found[0];out.APPLE_API_KEY_ID=/AuthKey_([A-Z0-9]+)\.p8$/.exec(found[0])[1];}
  }
  if(!env.APPLE_API_ISSUER){const id=issuer(ISSUER_SERVICE);if(UUID.test(id))out.APPLE_API_ISSUER=id;}
  return out;
}
