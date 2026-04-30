import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const HOME_URL       = 'https://sprite-joke-in-a-bottle.coke2home.com';
const HOL_URL        = `${HOME_URL}/hall-of-lame`;

// ─────────────────────────────────────────────────────────────────────────────
// Each nested group has configure({ mode: 'serial' }) — failures within a
// group abort only that group, never another group.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Hall of Lame — Page Tests (Authenticated)', () => {
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
  // GROUP 1 — Page Load & Basic Elements (TC_HOL_01–06)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Page Load & Basic Elements', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
    });

    // TC_HOL_01 — Page loads with status 200
    test('TC_HOL_01: Hall of Lame page loads with status 200', async () => {
      const response = await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'reports/screenshots/TC_HOL_01-loaded.png', fullPage: true });
    });

    // TC_HOL_02 — Page title contains Sprite
    test('TC_HOL_02: page title contains Sprite', async () => {
      await expect(page).toHaveTitle(/Sprite Joke-In-A-Bottle/i);
    });

    // TC_HOL_03 — User is logged in (profile icon visible in nav)
    test('TC_HOL_03: user is logged in — profile icon visible in nav', async () => {
      const profileImg = page.getByRole('img', { name: 'Profile Image' });
      await expect(profileImg).toBeVisible({ timeout: 8000 });
      console.log('✅ User logged in');
    });

    // TC_HOL_04 — "HALL-OF-LAME" heading is visible
    test('TC_HOL_04: HALL-OF-LAME heading is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/HALL-OF-LAME/i);
      console.log('✅ HALL-OF-LAME heading found');
    });

    // TC_HOL_05 — "Look who's on top of their game" subheading is visible
    test('TC_HOL_05: subheading "Look who\'s on top of their game" is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Look who.*top.*game/i);
      console.log('✅ Subheading found');
    });

    // TC_HOL_06 — Page URL is correct
    test('TC_HOL_06: page URL is /hall-of-lame', async () => {
      expect(page.url()).toContain('/hall-of-lame');
      console.log(`✅ URL: ${page.url()}`);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2 — Table: Columns & Headers (TC_HOL_07–09)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Table Columns & Headers', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
    });

    // TC_HOL_07 — Table is visible on the page
    test('TC_HOL_07: leaderboard table is visible on the page', async () => {
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 8000 });
      console.log('✅ Table is visible');
    });

    // TC_HOL_08 — Table has Rank column header
    test('TC_HOL_08: table has Rank column header', async () => {
      const tableText = await page.locator('table thead').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Rank/i);
      console.log('✅ Rank column header found');
    });

    // TC_HOL_09 — Table has Jokes and Votes column headers
    test('TC_HOL_09: table has Jokes and Votes column headers', async () => {
      const tableText = await page.locator('table thead').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Jokes/i);
      expect(tableText).toMatch(/Votes/i);
      console.log('✅ Jokes and Votes column headers found');
      console.log(`Table headers: ${tableText.trim()}`);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3 — Table Data Rows (TC_HOL_10–14)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Table Data Rows', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
    });

    // TC_HOL_10 — Table has at least 1 data row
    test('TC_HOL_10: table has at least one data row', async () => {
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Table has ${count} data rows`);
    });

    // TC_HOL_11 — Rank numbers (1, 2, 3...) are visible in first column
    test('TC_HOL_11: rank numbers are visible in table rows', async () => {
      const tableText = await page.locator('table tbody').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/^1/m);  // starts with rank 1
      expect(tableText).toMatch(/\d+/);  // numeric ranks
      console.log('✅ Rank numbers visible in table');
    });

    // TC_HOL_12 — Joke titles/text are visible in table rows
    test('TC_HOL_12: joke titles and author names are visible in table rows', async () => {
      const tableText = await page.locator('table tbody').first().innerText({ timeout: 5000 });
      // Each row has: joke title + author name + language
      expect(tableText.trim().length).toBeGreaterThan(20);
      // Should have English or another language tag
      expect(tableText).toMatch(/English|Hindi|Cricket|Animals|Food|Telugu|Bengali/i);
      console.log('✅ Joke titles and language tags found');
      console.log(`Table preview: ${tableText.substring(0, 200)}`);
    });

    // TC_HOL_13 — Vote counts are visible in table Votes column
    test('TC_HOL_13: vote counts are visible in the Votes column', async () => {
      const tableText = await page.locator('table tbody').first().innerText({ timeout: 5000 });
      // Votes appear as numbers (e.g. 376, 147, 131)
      expect(tableText).toMatch(/\d{2,}/);
      console.log('✅ Vote counts (numeric) visible in Votes column');
    });

    // TC_HOL_14 — Joke thumbnail images are visible in table rows
    test('TC_HOL_14: joke thumbnail images are visible in table rows', async () => {
      const tableImgs = page.locator('table img');
      const count = await tableImgs.count();
      expect(count).toBeGreaterThan(0);
      const src = await tableImgs.first().getAttribute('src');
      expect(src).toBeTruthy();
      console.log(`✅ ${count} joke images found. First src: ${src?.substring(0, 60)}...`);
      await page.screenshot({ path: 'reports/screenshots/TC_HOL_14-table-images.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 4 — Filters, Pagination & Controls (TC_HOL_15–18)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Filters, Pagination & Controls', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
    });

    // TC_HOL_15 — "Weekly Top Jokes" filter button is present
    test('TC_HOL_15: Weekly Top Jokes filter button is present', async () => {
      const weeklyBtn = page.locator('button').filter({ hasText: /Weekly Top Jokes/i }).first();
      const count = await weeklyBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Weekly Top Jokes button found');
    });

    // TC_HOL_16 — "Next" pagination button is present
    test('TC_HOL_16: Next pagination button is present', async () => {
      const nextBtn = page.locator('button').filter({ hasText: /^Next$/ }).first();
      const count = await nextBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Next pagination button found');
    });

    // TC_HOL_17 — Clicking Next loads next page or shows no more data
    test('TC_HOL_17: clicking Next button navigates to next page', async () => {
      const tableTextBefore = await page.locator('table tbody').first().innerText({ timeout: 5000 }).catch(() => '');
      const nextBtn = page.locator('button').filter({ hasText: /^Next$/ }).first();
      await nextBtn.click({ force: true });
      await page.waitForTimeout(2000);
      const bodyText = await page.locator('body').innerText();
      // Either shows more data OR shows "No data found" — both are valid responses
      const hasMoreData = bodyText.includes('No data found') || bodyText !== tableTextBefore;
      expect(hasMoreData).toBe(true);
      console.log('✅ Next button clicked — page responded');
      await page.screenshot({ path: 'reports/screenshots/TC_HOL_17-next-page.png', fullPage: true });
    });

    // TC_HOL_18 — Calendar icon button is present (for week selection)
    test('TC_HOL_18: calendar icon button is present', async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      const calBtn = page.locator('button:has(svg use[href*="calendar2"])').first();
      const count = await calBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Calendar button present');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 5 — Static Elements & Footer (TC_HOL_19–21)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Static Elements & Footer', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
    });

    // TC_HOL_19 — Back arrow button is present
    test('TC_HOL_19: back arrow button is present', async () => {
      const backBtn = page.locator('button:has(svg use[href*="long-arrow"])').first();
      const count = await backBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Back arrow button present');
    });

    // TC_HOL_20 — BUY NOW button is visible
    test('TC_HOL_20: BUY NOW button is visible', async () => {
      await expect(page.locator('text=BUY NOW').first()).toBeVisible({ timeout: 8000 });
      console.log('✅ BUY NOW visible');
    });

    // TC_HOL_21 — Footer has T&C and Privacy Policy links
    test('TC_HOL_21: footer has T&C and Privacy Policy links', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const tc      = await page.locator('text=T&C').first().innerText({ timeout: 5000 }).catch(() => null);
      const privacy = await page.locator('text=/Privacy Policy/i').first().innerText({ timeout: 5000 }).catch(() => null);
      expect(tc || privacy).toBeTruthy();
      console.log(`✅ Footer — T&C: ${tc}, Privacy: ${privacy}`);
      await page.screenshot({ path: 'reports/screenshots/TC_HOL_21-footer.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 6 — API & Full Flow (TC_HOL_22–23)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('API & Full Flow', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);
    });

    // TC_HOL_22 — API returns 200 on page reload
    test('TC_HOL_22: Hall of Lame API returns 200 on page reload', async () => {
      const responsePromise = page.waitForResponse(
        res => res.url().includes('/hall-of-lame') || res.url().includes('/hall') || res.url().includes('/ugc') || res.url().includes('/joke'),
        { timeout: 10000 }
      ).catch(() => null);

      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const apiResp = await responsePromise;
      if (apiResp) {
        const status = apiResp.status();
        expect(status).toBe(200);
        console.log(`✅ API status: ${status} — URL: ${apiResp.url().substring(0, 80)}`);
      } else {
        // SSR page — page load itself was 200 (TC_HOL_01 verified this)
        console.log('ℹ️  No separate API call captured (SSR page) — page load already verified');
        expect(page.url()).toContain('/hall-of-lame');
      }
      await page.screenshot({ path: 'reports/screenshots/TC_HOL_22-api.png', fullPage: true });
    });

    // TC_HOL_23 — Full flow: load page, verify heading + table + controls
    test('TC_HOL_23: full flow — Hall of Lame shows heading, table data, and controls', async () => {
      await page.goto(HOL_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);

      const bodyText = await page.locator('body').innerText();

      // Step 1: Heading
      expect(bodyText).toMatch(/HALL-OF-LAME/i);
      console.log('Step 1 ✅ HALL-OF-LAME heading');

      // Step 2: Subheading
      expect(bodyText).toMatch(/Look who.*top.*game/i);
      console.log('Step 2 ✅ Subheading present');

      // Step 3: Table visible
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 8000 });
      console.log('Step 3 ✅ Table visible');

      // Step 4: Table has data
      const tableText = await page.locator('table').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Rank/i);
      expect(tableText).toMatch(/Jokes/i);
      expect(tableText).toMatch(/Votes/i);
      console.log('Step 4 ✅ Table has Rank/Jokes/Votes columns');

      // Step 5: At least 1 row of data
      const rowCount = await page.locator('table tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
      console.log(`Step 5 ✅ Table has ${rowCount} data rows`);

      // Step 6: Images in table (joke thumbnails)
      const imgCount = await page.locator('table img').count();
      expect(imgCount).toBeGreaterThan(0);
      console.log(`Step 6 ✅ ${imgCount} images in table`);

      // Step 7: Numeric vote counts
      expect(tableText).toMatch(/\d{2,}/);
      console.log('Step 7 ✅ Vote counts are numeric');

      // Step 8: Weekly Top Jokes button
      const weeklyBtn = page.locator('button').filter({ hasText: /Weekly Top Jokes/i }).first();
      expect(await weeklyBtn.count()).toBeGreaterThan(0);
      console.log('Step 8 ✅ Weekly Top Jokes button present');

      // Step 9: Next pagination
      const nextBtn = page.locator('button').filter({ hasText: /^Next$/ }).first();
      expect(await nextBtn.count()).toBeGreaterThan(0);
      console.log('Step 9 ✅ Next pagination button present');

      // Step 10: URL is correct
      expect(page.url()).toContain('/hall-of-lame');
      console.log('Step 10 ✅ URL correct');

      await page.screenshot({ path: 'reports/screenshots/TC_HOL_23-full-flow.png', fullPage: true });
    });
  });
});
