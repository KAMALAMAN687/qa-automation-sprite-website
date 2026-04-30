import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const HOME_URL = 'https://sprite-joke-in-a-bottle.coke2home.com';

// ── Helper: scroll to the Joke Box section on homepage ───────────────────────
async function scrollToJokeBox(page: Page) {
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const heading = all.find(
      e => e.textContent?.trim() === 'JOKE BOX' && e.children.length === 0
    );
    if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1000);
}

// ── Helper: navigate to homepage and scroll to Joke Box ──────────────────────
async function gotoJokeBox(page: Page) {
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await scrollToJokeBox(page);
}

// ─────────────────────────────────────────────────────────────────────────────
// Each nested group has configure({ mode: 'serial' }) — failures within a
// group abort only that group, never another group.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Joke Box — Homepage Section (Authenticated)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 1 — Section Presence & Headings (TC_JB_01–04)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Section Presence & Headings', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoJokeBox(page);
    });

    // TC_JB_01 — Homepage loads with status 200
    test('TC_JB_01: homepage loads with status 200', async () => {
      const response = await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
      await scrollToJokeBox(page);
      await page.screenshot({ path: 'reports/screenshots/TC_JB_01-homepage.png', fullPage: false });
    });

    // TC_JB_02 — "JOKE BOX" heading is visible in body text
    test('TC_JB_02: JOKE BOX section heading is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/JOKE BOX/i);
      console.log('✅ JOKE BOX heading found in page');
    });

    // TC_JB_03 — "Jokes For you, Created By You" subtitle is visible
    test('TC_JB_03: subtitle "Jokes For you, Created By You" is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Jokes For you.*Created By You/i);
      console.log('✅ Joke Box subtitle found');
    });

    // TC_JB_04 — User is logged in (username or coin balance visible in nav)
    test('TC_JB_04: user is logged in — username or coin balance visible in nav', async () => {
      // Homepage nav shows username + Comic Coins balance (e.g. "Aman Kamal 2502")
      const bodyText = await page.locator('body').innerText();
      const isLoggedIn = /\d{3,}/.test(bodyText) && !/Sign In|Login|Log in/i.test(bodyText.substring(0, 200));
      expect(isLoggedIn).toBe(true);
      console.log('✅ User is logged in — coin balance and no login prompt found');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2 — Tabs: Latest & Trending (TC_JB_05–08)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Latest & Trending Tabs', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoJokeBox(page);
    });

    // TC_JB_05 — "Latest" tab is present in Joke Box section
    test('TC_JB_05: Latest tab is present in Joke Box section', async () => {
      const latestTab = page.locator('button').filter({ hasText: /^Latest$/ }).first();
      const count = await latestTab.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Latest tab found');
    });

    // TC_JB_06 — "Trending" tab is present in Joke Box section
    test('TC_JB_06: Trending tab is present in Joke Box section', async () => {
      const trendingTab = page.locator('button').filter({ hasText: /^Trending$/ }).first();
      const count = await trendingTab.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Trending tab found');
    });

    // TC_JB_07 — Clicking Trending tab loads jokes
    test('TC_JB_07: clicking Trending tab shows joke content', async () => {
      const trendingTab = page.locator('button').filter({ hasText: /^Trending$/ }).first();
      await trendingTab.click({ force: true });
      await page.waitForTimeout(1500);
      const bodyText = await page.locator('body').innerText();
      // Jokes should still be visible after switching tabs
      expect(bodyText).toMatch(/JOKE BOX/i);
      const reportBtns = await page.locator('button').filter({ hasText: /^Report$/ }).count();
      expect(reportBtns).toBeGreaterThan(0);
      console.log(`✅ Trending tab: ${reportBtns} joke cards visible`);
      await page.screenshot({ path: 'reports/screenshots/TC_JB_07-trending.png' });
    });

    // TC_JB_08 — Clicking Latest tab returns to latest jokes
    test('TC_JB_08: clicking Latest tab shows joke content', async () => {
      const latestTab = page.locator('button').filter({ hasText: /^Latest$/ }).first();
      await latestTab.click({ force: true });
      await page.waitForTimeout(1500);
      const reportBtns = await page.locator('button').filter({ hasText: /^Report$/ }).count();
      expect(reportBtns).toBeGreaterThan(0);
      console.log(`✅ Latest tab: ${reportBtns} joke cards visible`);
      await page.screenshot({ path: 'reports/screenshots/TC_JB_08-latest.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3 — Joke Card Content (TC_JB_09–13)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Joke Card Content', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoJokeBox(page);
    });

    // TC_JB_09 — At least 1 joke card is visible (Report button = one card)
    test('TC_JB_09: at least one joke card is visible in the Joke Box section', async () => {
      const reportBtns = await page.locator('button').filter({ hasText: /^Report$/ }).count();
      expect(reportBtns).toBeGreaterThan(0);
      console.log(`✅ ${reportBtns} joke cards found`);
    });

    // TC_JB_10 — Joke card shows text content (actual joke text)
    test('TC_JB_10: joke cards show actual joke text content', async () => {
      const bodyText = await page.locator('body').innerText();
      const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l);
      const jbStart = lines.findIndex(l => l === 'JOKE BOX');
      expect(jbStart).toBeGreaterThan(-1);
      const jokeBoxLines = lines.slice(jbStart, jbStart + 50).join(' ');
      // Jokes should have some text content beyond just the UI labels
      expect(jokeBoxLines.length).toBeGreaterThan(100);
      console.log(`✅ Joke text content found (${jokeBoxLines.length} chars in section)`);
    });

    // TC_JB_11 — Joke cards show language/category tag (e.g., English, Hindi)
    test('TC_JB_11: joke cards show language or category tag', async () => {
      const bodyText = await page.locator('body').innerText();
      const jbIdx = bodyText.indexOf('JOKE BOX');
      const jokeSection = bodyText.substring(jbIdx, jbIdx + 2000);
      expect(jokeSection).toMatch(/English|Hindi|Cricket|Animals|Food|College|Office/i);
      console.log('✅ Language/category tag found in Joke Box section');
    });

    // TC_JB_12 — Joke cards show Vote or Voted button
    test('TC_JB_12: joke cards show Vote or Voted button', async () => {
      // Vote/Voted may appear inside buttons with children elements
      const bodyText = await page.locator('body').innerText();
      const jbIdx = bodyText.indexOf('JOKE BOX');
      const jokeSection = bodyText.substring(jbIdx, jbIdx + 3000);
      expect(jokeSection).toMatch(/\bVote\b|\bVoted\b/);
      console.log('✅ Vote/Voted button text found in Joke Box section');
    });

    // TC_JB_13 — Joke cards show Comic Coins count (large number)
    test('TC_JB_13: joke cards show Comic Coins count', async () => {
      const bodyText = await page.locator('body').innerText();
      const jbIdx = bodyText.indexOf('JOKE BOX');
      const jokeSection = bodyText.substring(jbIdx, jbIdx + 3000);
      // Comic Coins appears as a 4-5+ digit number (e.g. 16251, 15346)
      expect(jokeSection).toMatch(/\d{4,}/);
      console.log('✅ Comic Coins count (4+ digit number) visible in Joke Box');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 4 — View All & Navigation (TC_JB_14–15)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('View All & Navigation', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoJokeBox(page);
    });

    // TC_JB_14 — "View All" button is present in the Joke Box section
    test('TC_JB_14: View All button is present in Joke Box section', async () => {
      const bodyText = await page.locator('body').innerText();
      const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l);
      const jbIdx = lines.findIndex(l => l === 'JOKE BOX');
      expect(jbIdx).toBeGreaterThan(-1);
      // "View All" should appear shortly after "JOKE BOX" heading
      const nearby = lines.slice(jbIdx, jbIdx + 5).join(' ');
      expect(nearby).toMatch(/View All/i);
      console.log('✅ View All button present near JOKE BOX heading');
    });

    // TC_JB_15 — Full flow: load homepage, scroll to Joke Box, verify all key elements
    test('TC_JB_15: full flow — homepage Joke Box section has all key elements', async () => {
      await gotoJokeBox(page);

      const bodyText = await page.locator('body').innerText();
      const jbIdx = bodyText.indexOf('JOKE BOX');
      expect(jbIdx).toBeGreaterThan(-1);
      const jokeSection = bodyText.substring(jbIdx, jbIdx + 3000);

      // Heading + subtitle
      expect(jokeSection).toMatch(/JOKE BOX/);
      console.log('Step 1 ✅ JOKE BOX heading present');

      expect(jokeSection).toMatch(/Jokes For you.*Created By You/i);
      console.log('Step 2 ✅ Subtitle present');

      // View All button
      expect(jokeSection).toMatch(/View All/i);
      console.log('Step 3 ✅ View All button present');

      // Latest and Trending tabs
      const latestTab = page.locator('button').filter({ hasText: /^Latest$/ });
      const trendingTab = page.locator('button').filter({ hasText: /^Trending$/ });
      expect(await latestTab.count()).toBeGreaterThan(0);
      expect(await trendingTab.count()).toBeGreaterThan(0);
      console.log('Step 4 ✅ Latest and Trending tabs present');

      // At least 1 joke card (proxy: Report button)
      const reportBtns = await page.locator('button').filter({ hasText: /^Report$/ }).count();
      expect(reportBtns).toBeGreaterThan(0);
      console.log(`Step 5 ✅ ${reportBtns} joke cards visible`);

      // Language tags
      expect(jokeSection).toMatch(/English|Hindi|Cricket|Animals|Food/i);
      console.log('Step 6 ✅ Language/category tags present');

      // Vote or Voted button
      expect(jokeSection).toMatch(/\bVote\b|\bVoted\b/);
      console.log('Step 7 ✅ Vote/Voted button present');

      // Comic Coins count
      expect(jokeSection).toMatch(/\d{4,}/);
      console.log('Step 8 ✅ Comic Coins count visible');

      await page.screenshot({ path: 'reports/screenshots/TC_JB_15-full-flow.png', fullPage: false });
    });
  });
});
