/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({root:'apps/desktop',plugins:[react()],server:{strictPort:true},build:{outDir:'dist',emptyOutDir:true},
 // Tests live next to the app and next to the release scripts.
 test:{dir:'.',include:['apps/desktop/src/**/*.test.{ts,tsx}','scripts/**/*.test.mjs'],
  // saving.test.ts forces garbage collection to prove old season copies are released.
  poolOptions:{forks:{execArgv:['--expose-gc']}}}});
