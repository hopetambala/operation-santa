#!/usr/bin/env bash
# One-time release setup that only Hope runs, in Hope's own terminal (docs/RELEASE.md § One-time setup).
# Prints no secret values.
#   scripts/release-setup-secrets.sh notary   notarytool keychain profile "opsanta-notary" + GitHub secret APPLE_API_ISSUER
#   scripts/release-setup-secrets.sh certs    Developer ID, Apple Distribution and Mac Installer identities → GitHub secrets
#                                             (macOS asks to allow exporting each private key)
set -euo pipefail
REPO=hopetambala/operation-santa
OSSL=/usr/bin/openssl   # LibreSSL: its .p12 files import cleanly with `security import` (CI does that)
HERE="$(cd "$(dirname "$0")" && pwd)"

notary(){
  P8=$(ls ~/.appstoreconnect/private_keys/AuthKey_*.p8)
  [ "$(printf '%s\n' "$P8" | wc -l)" -eq 1 ] || { echo "Expected exactly one AuthKey_*.p8 in ~/.appstoreconnect/private_keys"; exit 1; }
  KID=$(basename "$P8" .p8); KID=${KID#AuthKey_}
  read -r -p "Issuer ID (App Store Connect ▸ Users and Access ▸ Integrations ▸ App Store Connect API): " ISSUER
  xcrun notarytool store-credentials opsanta-notary --key "$P8" --key-id "$KID" --issuer "$ISSUER"
  printf '%s' "$ISSUER" | gh secret set APPLE_API_ISSUER --repo "$REPO"
  echo "Done: keychain profile opsanta-notary, GitHub secret APPLE_API_ISSUER."
}

certs(){
  D=$(mktemp -d); chmod 700 "$D"; VK="$D/verify.keychain-db"
  trap 'security delete-keychain "$VK" 2>/dev/null || true; rm -rf "$D"' EXIT
  export PW_ALL; PW_ALL=$($OSSL rand -base64 24)
  echo "Exporting identities from the login keychain. Click Allow for each key macOS asks about."
  security export -k "$HOME/Library/Keychains/login.keychain-db" -t identities -f pkcs12 -P "$PW_ALL" -o "$D/all.p12"
  $OSSL pkcs12 -in "$D/all.p12" -passin env:PW_ALL -nodes -out "$D/all.pem" 2>/dev/null; chmod 600 "$D/all.pem"
  node "$HERE/release-split-identities.mjs" "$D/all.pem" "$D" \
    "Developer ID Application=APPLE_DEVELOPER_ID" "Apple Distribution=APPLE_DISTRIBUTION" "3rd Party Mac Developer Installer=APPLE_INSTALLER"
  rm -f "$D/all.pem" "$D/all.p12"
  VPW=$($OSSL rand -base64 24); security create-keychain -p "$VPW" "$VK" >/dev/null; security unlock-keychain -p "$VPW" "$VK"
  for NAME in APPLE_DEVELOPER_ID APPLE_DISTRIBUTION APPLE_INSTALLER; do
    export PW; PW=$($OSSL rand -base64 24)
    $OSSL pkcs12 -export -inkey "$D/$NAME.key.pem" -in "$D/$NAME.cert.pem" -name "$(cat "$D/$NAME.cn")" -passout env:PW -out "$D/$NAME.p12"
    rm -f "$D/$NAME.key.pem"
    security import "$D/$NAME.p12" -P "$PW" -k "$VK" -t cert -f pkcs12 -A >/dev/null   # proves CI can import it
    base64 -i "$D/$NAME.p12" | tr -d '\n' | gh secret set "${NAME}_P12" --repo "$REPO"
    printf '%s' "$PW" | gh secret set "${NAME}_PASSWORD" --repo "$REPO"
    rm -f "$D/$NAME.p12"; unset PW
    echo "Set ${NAME}_P12 and ${NAME}_PASSWORD."
  done
  echo "These imported cleanly into a throwaway keychain, as CI will do:"
  security find-identity -v "$VK" | sed -E 's/[0-9A-F]{40}/<hash>/'
}

case "${1:-}" in notary) notary;; certs) certs;; *) echo "Usage: $0 notary|certs"; exit 2;; esac
