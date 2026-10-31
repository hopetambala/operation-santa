// Split a LibreSSL `pkcs12 -nodes` PEM dump into cert/key pairs, by certificate common name.
// Usage: node scripts/release-split-identities.mjs <all.pem> <outdir> "<CN prefix>=<name>" ...  Writes <name>.cert.pem and <name>.key.pem.
import {readFileSync,writeFileSync} from 'node:fs';
const [pemPath,out,...wanted]=process.argv.slice(2);
const chunks=readFileSync(pemPath,'utf8').split('Bag Attributes').slice(1);
const certs=[],keys={};
for(const c of chunks){
  const id=/localKeyID:\s*([0-9A-F ]+)/.exec(c)?.[1]?.trim();
  const cert=/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/.exec(c)?.[0];
  const key=/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC )?PRIVATE KEY-----/.exec(c)?.[0];
  const cn=/friendlyName:\s*(.+)/.exec(c)?.[1]?.trim();
  if(cert)certs.push({id,cn,cert});else if(key&&id)keys[id]=key;
}
let missing=0;
for(const w of wanted){
  const [prefix,name]=w.split('=');
  const c=certs.find(c=>c.cn?.startsWith(prefix)&&keys[c.id]);
  if(!c){console.error(`no identity whose certificate starts with "${prefix}"`);missing++;continue}
  writeFileSync(`${out}/${name}.cert.pem`,c.cert+'\n',{mode:0o600});
  writeFileSync(`${out}/${name}.key.pem`,keys[c.id]+'\n',{mode:0o600});
  writeFileSync(`${out}/${name}.cn`,c.cn,{mode:0o600});
  console.log(`${name}: ${c.cn}`);
}
process.exit(missing?1:0);
