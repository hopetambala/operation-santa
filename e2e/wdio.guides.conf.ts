import {config as base} from './wdio.conf';
// Screenshots for the volunteer guides, taken from the demo season. Not part of the E2E suite or CI:
// npm run e2e:build && npm run guides:screenshots
export const config:WebdriverIO.Config={...base,specs:['./guides/*.e2e.ts']};
