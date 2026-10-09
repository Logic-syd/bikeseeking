import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir:'./tests', timeout:30000, fullyParallel:false, workers:1, reporter:'list',
  use:{baseURL:'http://127.0.0.1:5173',channel:process.env.PW_CHANNEL || (existsSync('/Applications/Google Chrome.app')?'chrome':undefined),headless:true,locale:'en-GB',viewport:{width:390,height:844},hasTouch:true,screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI},
});
