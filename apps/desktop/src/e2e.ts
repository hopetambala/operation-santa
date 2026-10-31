// Loaded only in E2E builds (VITE_E2E=1, see `npm run e2e:build`). Never part of a release bundle.
import '@wdio/tauri-plugin';
// The plugin cannot patch invoke on Tauri 2.12 (frozen globals); native.ts answers mocked commands from window.__wdio_mocks__.
