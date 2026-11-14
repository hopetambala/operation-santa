/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {dliteBreakpoints} from './apps/desktop/dlite-breakpoints.ts';
export default defineConfig({root:'apps/desktop',plugins:[react()],css:{postcss:{plugins:[dliteBreakpoints()]}},server:{strictPort:true},build:{outDir:'dist',emptyOutDir:true},
 // Tests live next to the app, the release scripts and the sandbox proof's runner.
 test:{dir:'.',include:['apps/desktop/src/**/*.test.{ts,tsx}','scripts/**/*.test.mjs','e2e/sandbox/*.test.mjs'],
  // saving.test.ts forces garbage collection to prove old season copies are released.
  poolOptions:{forks:{execArgv:['--expose-gc']}}}});
