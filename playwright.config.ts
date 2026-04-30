import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,       // run tests in order, not in parallel
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                 // one browser at a time
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://sprite-joke-in-a-bottle.coke2home.com',
    screenshot: 'on',           // capture screenshot after every test (pass or fail)
    video: 'on',                // record video for every test
    trace: 'on',                // record trace for every test (viewable in trace viewer)
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1 — No login required
    // Runs: page load, homepage, navigation, footer, assets, PWA
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'phase1-no-login',
      testMatch: [
        '**/smoke/01-page-load.spec.ts',
        '**/smoke/02-homepage-sections.spec.ts',
        '**/smoke/03-navigation.spec.ts',
        '**/smoke/04-footer.spec.ts',
        '**/smoke/12-static-assets.spec.ts',
        '**/smoke/13-pwa.spec.ts',
        '**/smoke/14-responsive.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        headless: false,
        storageState: undefined,  // no login state
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2 — Login / Auth setup
    // Runs: OTP login flow, saves session to playwright/.auth/user.json
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'phase2-auth-setup',
      testMatch: [
        '**/auth/auth.setup.ts',
        '**/smoke/05-auth-modal.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        headless: false,
        storageState: undefined,  // intentionally no pre-auth — we ARE testing login
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3 — Authenticated flows
    // Runs AFTER login — reuses saved session, no OTP needed again
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'phase3-authenticated',
      testMatch: [
        // smoke
        '**/smoke/06-mood-selection.spec.ts',
        '**/smoke/07-language-switcher.spec.ts',
        '**/smoke/08-joke-box.spec.ts',
        '**/smoke/09-submit-joke.spec.ts',
        '**/smoke/10-privacy-policy.spec.ts',
        '**/smoke/11-terms-conditions.spec.ts',
        '**/smoke/15-error-cases.spec.ts',
        // pages
        '**/pages/homepage.spec.ts',
        '**/pages/scroll-and-lol.spec.ts',
        '**/pages/submit-joke.spec.ts',
        '**/pages/privacy-policy.spec.ts',
        '**/pages/terms-conditions.spec.ts',
        '**/pages/profile.spec.ts',
        '**/pages/leaderboard.spec.ts',
        '**/pages/refer-a-friend.spec.ts',
        '**/pages/joke-box.spec.ts',
        '**/pages/hall-of-lame.spec.ts',
        '**/pages/tadka-hub.spec.ts',
        '**/pages/contest.spec.ts',
        // features
        '**/features/header.spec.ts',
        '**/features/footer.spec.ts',
        '**/features/language-switcher.spec.ts',
        '**/features/mood-selection.spec.ts',
        '**/features/joke-box.spec.ts',
      ],
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome',
        headless: !!process.env.CI,
        storageState: 'playwright/.auth/user.json',  // reuse saved login session
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE — Run Phase 1 tests on mobile viewport
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'mobile-smoke',
      testMatch: [
        '**/smoke/01-page-load.spec.ts',
        '**/smoke/02-homepage-sections.spec.ts',
        '**/smoke/03-navigation.spec.ts',
      ],
      use: {
        ...devices['Pixel 5'],
        channel: 'chrome',
        headless: false,
      },
    },

    // API tests
    {
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',
      use: {
        baseURL: process.env.API_URL || 'https://sprite-joke-in-a-bottle.coke2home.com/api',
      },
    },
  ],

  outputDir: 'reports/test-results',
});