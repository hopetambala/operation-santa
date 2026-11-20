// Loaded only in E2E builds (VITE_E2E=1, see `npm run e2e:build`). Never part of a release bundle.
import '@wdio/tauri-plugin';
// Each spec file gets a fresh app, and it should start like a fresh install: WebKit keeps localStorage (recent seasons,
// "four steps seen") per bundle ID across runs, outside OPSANTA_DATA_DIR, so a test app empties it before first render.
try{localStorage.clear();}catch{/* storage blocked: nothing to clear */}
// The plugin cannot patch invoke on Tauri 2.12 (frozen globals); native.ts answers mocked commands from window.__wdio_mocks__.
