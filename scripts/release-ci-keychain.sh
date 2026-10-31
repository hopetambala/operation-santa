#!/usr/bin/env bash
# CI only: import signing certificates into a throwaway keychain and write the App Store Connect key file.
# Each argument names a pair of environment variables, <NAME>_P12 (base64 .p12) and <NAME>_PASSWORD.
#   scripts/release-ci-keychain.sh APPLE_DEVELOPER_ID
#   scripts/release-ci-keychain.sh APPLE_DISTRIBUTION APPLE_INSTALLER
# APPLE_API_KEY_BODY (the .p8 text) is written to $RUNNER_TEMP and APPLE_API_KEY is exported as its path.
# Nothing is echoed; a missing secret fails the job by name only.
set -euo pipefail
: "${RUNNER_TEMP:?CI only}" "${GITHUB_ENV:?CI only}"

KEYCHAIN="$RUNNER_TEMP/opsanta-signing.keychain-db"
PW="$(openssl rand -base64 24)"
security create-keychain -p "$PW" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security unlock-keychain -p "$PW" "$KEYCHAIN"

for name in "$@"; do
  p12_var="${name}_P12"; pw_var="${name}_PASSWORD"
  if [ -z "${!p12_var:-}" ]; then echo "Secret $p12_var is not set (docs/RELEASE.md § Secrets)."; exit 1; fi
  printf '%s' "${!p12_var}" | base64 --decode > "$RUNNER_TEMP/$name.p12"
  security import "$RUNNER_TEMP/$name.p12" -P "${!pw_var:-}" -A -t cert -f pkcs12 -k "$KEYCHAIN" >/dev/null
  rm -f "$RUNNER_TEMP/$name.p12"
done
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$PW" "$KEYCHAIN" >/dev/null
security list-keychains -d user -s "$KEYCHAIN" login.keychain

if [ -n "${APPLE_API_KEY_BODY:-}" ]; then
  : "${APPLE_API_KEY_ID:?Secret APPLE_API_KEY_ID is not set}" "${APPLE_API_ISSUER:?Secret APPLE_API_ISSUER is not set}"
  mkdir -p "$RUNNER_TEMP/private_keys"
  P8="$RUNNER_TEMP/private_keys/AuthKey_${APPLE_API_KEY_ID}.p8"
  printf '%s' "$APPLE_API_KEY_BODY" > "$P8"
  echo "APPLE_API_KEY=$P8" >> "$GITHUB_ENV"
fi
security find-identity -v | sed -E 's/[0-9A-F]{40}/<hash>/'
