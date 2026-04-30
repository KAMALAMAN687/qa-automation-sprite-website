import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const HOME_URL        = 'https://sprite-joke-in-a-bottle.coke2home.com';
const LEADERBOARD_URL = `${HOME_URL}/leaderboard`;

// ── Helper: navigate calendar to a target month/year ─────────────────────────
async function navigateToMonth(page: Page, targetMonth: string, targetYear: number) {
  for (let i = 0; i < 36; i++) {
    const mon = await page.locator('[role="dialog"] span')
      .filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ })
      .first().innerText({ timeout: 2000 }).catch(() => '');
    const yr  = await page.locator('[role="dialog"] span')
      .filter({ hasText: /20\d\d/ }).first().innerText({ timeout: 2000 }).catch(() => '');
    if (mon === targetMonth && parseInt(yr) === targetYear) break;
    await page.locator('button[name="previous-month"]').first().click({ force: true });
    await page.waitForTimeout(350);
  }
}

// ── Helper: open calendar → navigate → select day ────────────────────────────
async function selectDate(page: Page, day: number, month: string, year: number) {
  // Close any open dialog first
  const openDialog = page.locator('[role="dialog"][data-state="open"]');
  if (await openDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  const calendarBtn = page.locator('button:has(svg use[href*="calendar2"])').first();
  await calendarBtn.click({ force: true });
  await page.waitForTimeout(1000);

  await navigateToMonth(page, month, year);

  const dayBtn = page.locator('button[name="day"]')
    .filter({ hasText: new RegExp(`^${day}$`) }).first();
  const isVisible = await dayBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (isVisible) {
    await dayBtn.click();
  } else {
    await page.evaluate((d: number) => {
      const btns = Array.from(document.querySelectorAll('button[name="day"]'));
      const target = btns.find(b => b.textContent?.trim() === String(d) && !(b as HTMLButtonElement).disabled);
      if (target) (target as HTMLElement).click();
    }, day);
  }
  await page.waitForTimeout(2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Outer describe owns the shared page — no serial mode here so each nested
// group runs independently. A failure in one group never skips another.
// Each nested group has configure({ mode: 'serial' }) so within-group tests
// that share state still abort cleanly on failure without cascading outward.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Leaderboard Page — Smoke Tests (Authenticated)', () => {
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
  // GROUP 1 — Page Load & Basic Elements (TC_LB_01–07)
  // Each test navigates fresh — fully independent of other groups
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Page Load & Basic Elements', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    });

    // TC_LB_01 — Leaderboard page loads with status 200
    test('TC_LB_01: leaderboard page loads with status 200', async () => {
      const response = await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_01-loaded.png', fullPage: true });
    });

    // TC_LB_02 — Page title is correct
    test('TC_LB_02: page title contains Sprite', async () => {
      await expect(page).toHaveTitle(/Sprite Joke-In-A-Bottle/i);
    });

    // TC_LB_03 — User is logged in (Profile Image visible in nav)
    test('TC_LB_03: user is logged in — profile icon visible in nav', async () => {
      const profileImg = page.getByRole('img', { name: 'Profile Image' });
      await expect(profileImg).toBeVisible({ timeout: 8000 });
    });

    // TC_LB_04 — "Leaderboard" heading is visible
    test('TC_LB_04: Leaderboard heading is visible', async () => {
      const heading = page.locator('h1').filter({ hasText: /^Leaderboard$/ }).first();
      const text = await heading.innerText({ timeout: 8000 });
      expect(text).toMatch(/Leaderboard/i);
      console.log(`✅ Leaderboard heading: "${text}"`);
    });

    // TC_LB_05 — Sub-heading is visible
    test('TC_LB_05: sub-heading "Look who\'s on top of their game" is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Look who.*top.*game/i);
      console.log('✅ Sub-heading found');
    });

    // TC_LB_06 — "Daily Winners" section is visible
    test('TC_LB_06: Daily Winners section is visible', async () => {
      const dailyWinners = page.locator('text=Daily Winners').first();
      await expect(dailyWinners).toBeVisible({ timeout: 8000 });
      console.log('✅ Daily Winners section visible');
    });

    // TC_LB_07 — Calendar icon button is present
    test('TC_LB_07: calendar icon button is present', async () => {
      const calendarBtn = page.locator('button:has(svg use[href*="calendar2"])').first();
      const count = await calendarBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Calendar button found');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2 — Calendar Interaction (TC_LB_08–14)
  // TC_LB_08 opens the dialog; TC_LB_09–13 rely on it being open; TC_LB_14 closes it.
  // Serial within this group only — failure here does NOT skip other groups.
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Calendar Interaction', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    });

    // TC_LB_08 — Clicking calendar icon opens date picker dialog
    test('TC_LB_08: clicking calendar icon opens date picker dialog', async () => {
      const calendarBtn = page.locator('button:has(svg use[href*="calendar2"])').first();
      await calendarBtn.click({ force: true });
      await page.waitForTimeout(1000);
      const dialog = page.locator('[role="dialog"][data-state="open"]').first();
      await expect(dialog).toBeVisible({ timeout: 8000 });
      console.log('✅ Date picker dialog opened');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_08-calendar-open.png' });
    });

    // TC_LB_09 — Calendar shows month and year header
    test('TC_LB_09: calendar displays month and year header', async () => {
      const month = await page.locator('[role="dialog"] span')
        .filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ })
        .first().innerText({ timeout: 5000 });
      const year  = await page.locator('[role="dialog"] span')
        .filter({ hasText: /20\d\d/ }).first().innerText({ timeout: 5000 });
      expect(month).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      expect(year).toMatch(/20\d\d/);
      console.log(`✅ Calendar showing: ${month} ${year}`);
    });

    // TC_LB_10 — Calendar shows day-of-week headers
    test('TC_LB_10: calendar shows day-of-week column headers (Su Mo ... Sa)', async () => {
      const dialogText = await page.locator('[role="dialog"]').innerText({ timeout: 5000 });
      expect(dialogText).toMatch(/Su/);
      expect(dialogText).toMatch(/Mo/);
      expect(dialogText).toMatch(/Sa/);
      console.log('✅ Day-of-week headers present');
    });

    // TC_LB_11 — Previous month navigation button is present
    test('TC_LB_11: previous month navigation button is present', async () => {
      const prevBtn = page.locator('button[name="previous-month"]').first();
      const count = await prevBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Previous month button present');
    });

    // TC_LB_12 — Next month button is disabled (no future dates allowed)
    test('TC_LB_12: next month button is disabled (future dates not allowed)', async () => {
      const nextBtn = page.locator('button[name="next-month"]').first();
      // Check disabled via HTML attribute, aria-disabled, or nested disabled child
      const isDisabled = await nextBtn.evaluate((el: HTMLElement) => {
        if ((el as HTMLButtonElement).disabled) return true;
        if (el.getAttribute('aria-disabled') === 'true') return true;
        return !!el.querySelector('[disabled], [aria-disabled="true"]');
      }).catch(() => false);
      expect(isDisabled).toBe(true);
      console.log(`✅ Next month button is disabled (no future dates): ${isDisabled}`);
    });

    // TC_LB_13 — Navigate to previous month
    test('TC_LB_13: clicking previous month navigates to prior month', async () => {
      const monthBefore = await page.locator('[role="dialog"] span')
        .filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ })
        .first().innerText({ timeout: 3000 });
      await page.locator('button[name="previous-month"]').first().click({ force: true });
      await page.waitForTimeout(500);
      const monthAfter = await page.locator('[role="dialog"] span')
        .filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ })
        .first().innerText({ timeout: 3000 });
      expect(monthAfter).not.toBe(monthBefore);
      console.log(`✅ Month changed: ${monthBefore} → ${monthAfter}`);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_13-prev-month.png' });
    });

    // TC_LB_14 — Close calendar with Escape
    test('TC_LB_14: pressing Escape closes the calendar dialog', async () => {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const dialog = page.locator('[role="dialog"][data-state="open"]');
      const isOpen = await dialog.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isOpen).toBe(false);
      console.log('✅ Calendar closed after Escape');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3 — No Date Selected — Default State (TC_LB_15–16)
  // Fresh navigation — independent of calendar group results
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('No Date Selected — Default State', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    });

    // TC_LB_15 — Page loads correctly with no date selected
    test('TC_LB_15: page loads correctly with no date selected — shows default state', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Daily Winners/i);
      expect(bodyText).toMatch(/YOUR RANK/i);
      console.log('✅ Page loads correctly with no date selected');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_15-no-date.png', fullPage: true });
    });

    // TC_LB_16 — YOUR RANK row shows masked mobile + coin balance
    test('TC_LB_16: YOUR RANK row is visible and shows masked mobile + coins (no date)', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/YOUR RANK/i);
      expect(bodyText).toMatch(/x+\d{4}/);   // masked mobile e.g. xxxxxx5395
      expect(bodyText).toMatch(/\d{3,}/);    // coin balance e.g. 2502
      console.log('✅ YOUR RANK section showing masked mobile and coins');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 4 — Date: 17 May 2024 (TC_LB_17–20)
  // beforeAll selects the date; all 4 tests share that page state.
  // If beforeAll or TC_LB_17 fails, TC_LB_18–20 are skipped (serial).
  // 24 May and 10 May groups are NOT affected.
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Date: 17 May 2024', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await selectDate(page, 17, 'May', 2024);
      console.log('📅 Setup: 17 May 2024 selected');
    });

    // TC_LB_17 — Leaderboard data loads for 17 May 2024
    test('TC_LB_17: select 17 May 2024 — leaderboard data loads correctly', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/YOUR RANK/i);
      expect(bodyText).not.toMatch(/No data found/i);
      console.log('✅ Data present for 17 May 2024');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_17-17may2024.png', fullPage: true });
    });

    // TC_LB_18 — Avatar images are visible for 17 May 2024
    test('TC_LB_18: 17 May 2024 — avatar images are visible in leaderboard rows', async () => {
      const avatarImgs = page.locator('img[alt="avatar"]');
      const count = await avatarImgs.count();
      expect(count).toBeGreaterThan(0);
      const src = await avatarImgs.first().getAttribute('src');
      expect(src).toBeTruthy();
      console.log(`✅ ${count} avatars found. First src: ${src?.substring(0, 60)}...`);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_18-17may-avatars.png' });
    });

    // TC_LB_19 — Comic Coins column and values visible for 17 May 2024
    test('TC_LB_19: 17 May 2024 — Comic Coins values are displayed in leaderboard', async () => {
      const tableText = await page.locator('table').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Comic Coins/i);
      expect(tableText).toMatch(/\d{2,}/);  // at least 2-digit coin values
      console.log('✅ Comic Coins column and values visible');
      console.log(`Table preview: ${tableText.substring(0, 200)}`);
    });

    // TC_LB_20 — Prize column is present for 17 May 2024
    test('TC_LB_20: 17 May 2024 — Prize column is present in leaderboard table', async () => {
      const tableHTML = await page.locator('table').first().innerHTML({ timeout: 5000 });
      expect(tableHTML.toLowerCase()).toContain('prize');
      console.log('✅ Prize column present in table HTML');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_20-17may-prize.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 5 — Date: 24 May 2024 (TC_LB_21–24)
  // Fresh navigation + date selection — completely independent of Group 4
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Date: 24 May 2024', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await selectDate(page, 24, 'May', 2024);
      console.log('📅 Setup: 24 May 2024 selected');
    });

    // TC_LB_21 — Leaderboard data loads for 24 May 2024
    test('TC_LB_21: select 24 May 2024 — leaderboard data loads correctly', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/YOUR RANK/i);
      expect(bodyText).not.toMatch(/No data found/i);
      console.log('✅ Data present for 24 May 2024');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_21-24may2024.png', fullPage: true });
    });

    // TC_LB_22 — Avatar images are visible for 24 May 2024
    test('TC_LB_22: 24 May 2024 — avatar images are visible', async () => {
      const avatarImgs = page.locator('img[alt="avatar"]');
      const count = await avatarImgs.count();
      expect(count).toBeGreaterThan(0);
      const src = await avatarImgs.first().getAttribute('src');
      expect(src).toBeTruthy();
      console.log(`✅ ${count} avatars found: ${src?.substring(0, 60)}...`);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_22-24may-avatars.png' });
    });

    // TC_LB_23 — Comic Coins values visible for 24 May 2024
    test('TC_LB_23: 24 May 2024 — Comic Coins values visible in table', async () => {
      const tableText = await page.locator('table').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Comic Coins/i);
      expect(tableText).toMatch(/\d{2,}/);
      console.log('✅ Coin values verified for 24 May 2024');
      console.log(`Table preview: ${tableText.substring(0, 150)}`);
    });

    // TC_LB_24 — Prize column present for 24 May 2024
    test('TC_LB_24: 24 May 2024 — Prize column present in table', async () => {
      const tableHTML = await page.locator('table').first().innerHTML({ timeout: 5000 });
      expect(tableHTML.toLowerCase()).toContain('prize');
      console.log('✅ Prize column present for 24 May 2024');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_24-24may-prize.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 6 — Date: 10 May 2024 (TC_LB_25–28)
  // Fresh navigation + date selection — completely independent of Groups 4 & 5
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Date: 10 May 2024', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await selectDate(page, 10, 'May', 2024);
      console.log('📅 Setup: 10 May 2024 selected');
    });

    // TC_LB_25 — Leaderboard data loads for 10 May 2024
    test('TC_LB_25: select 10 May 2024 — leaderboard data loads correctly', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/YOUR RANK/i);
      expect(bodyText).not.toMatch(/No data found/i);
      console.log('✅ Data present for 10 May 2024');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_25-10may2024.png', fullPage: true });
    });

    // TC_LB_26 — Avatar images are visible for 10 May 2024
    test('TC_LB_26: 10 May 2024 — avatar images are visible', async () => {
      const avatarImgs = page.locator('img[alt="avatar"]');
      const count = await avatarImgs.count();
      expect(count).toBeGreaterThan(0);
      const src = await avatarImgs.first().getAttribute('src');
      expect(src).toBeTruthy();
      console.log(`✅ ${count} avatars found: ${src?.substring(0, 60)}...`);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_26-10may-avatars.png' });
    });

    // TC_LB_27 — Comic Coins values visible for 10 May 2024
    test('TC_LB_27: 10 May 2024 — Comic Coins values visible', async () => {
      const tableText = await page.locator('table').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Comic Coins/i);
      expect(tableText).toMatch(/\d{2,}/);
      console.log('✅ Coin values verified for 10 May 2024');
      console.log(`Table preview: ${tableText.substring(0, 150)}`);
    });

    // TC_LB_28 — Prize column present for 10 May 2024
    test('TC_LB_28: 10 May 2024 — Prize column present in table', async () => {
      const tableHTML = await page.locator('table').first().innerHTML({ timeout: 5000 });
      expect(tableHTML.toLowerCase()).toContain('prize');
      console.log('✅ Prize column present for 10 May 2024');
      await page.screenshot({ path: 'reports/screenshots/TC_LB_28-10may-prize.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 7 — Static Elements, API & Full Flow (TC_LB_29–35)
  // Fresh navigation — independent of all date groups above
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Static Elements, API & Full Flow', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    });

    // TC_LB_29 — YOUR RANK section always shows user avatar, masked mobile and coins
    test('TC_LB_29: YOUR RANK row always shows user avatar, masked mobile and coins', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/YOUR RANK/i);
      expect(bodyText).toMatch(/x+\d{4}/);   // masked mobile e.g. xxxxxx5395
      expect(bodyText).toMatch(/\d{3,}/);    // coin balance e.g. 2502
      const avatarCount = await page.locator('img[alt="avatar"]').count();
      expect(avatarCount).toBeGreaterThan(0);
      console.log(`✅ YOUR RANK row verified — avatars: ${avatarCount}`);
    });

    // TC_LB_30 — Back arrow button is present
    test('TC_LB_30: back arrow button is present on mobile header', async () => {
      const backBtn = page.locator('button:has(svg use[href*="long-arrow"])').first();
      const count = await backBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Back arrow present');
    });

    // TC_LB_31 — BUY NOW button is visible
    test('TC_LB_31: BUY NOW button is visible', async () => {
      await expect(page.locator('text=BUY NOW').first()).toBeVisible({ timeout: 8000 });
      console.log('✅ BUY NOW visible');
    });

    // TC_LB_32 — Footer T&C and Privacy Policy links present
    test('TC_LB_32: footer has T&C and Privacy Policy links', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const tc      = await page.locator('text=T&C').first().innerText({ timeout: 5000 }).catch(() => null);
      const privacy = await page.locator('text=/Privacy Policy/i').first().innerText({ timeout: 5000 }).catch(() => null);
      expect(tc || privacy).toBeTruthy();
      console.log(`✅ Footer — T&C: ${tc}, Privacy: ${privacy}`);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_32-footer.png' });
    });

    // TC_LB_33 — Page URL is correct
    test('TC_LB_33: leaderboard page URL is correct', async () => {
      expect(page.url()).toContain('/leaderboard');
      console.log(`✅ URL: ${page.url()}`);
    });

    // TC_LB_34 — API returns 200 on page reload
    test('TC_LB_34: leaderboard API returns 200 on page reload', async () => {
      const responsePromise = page.waitForResponse(
        res => res.url().includes('/leaderboard') || res.url().includes('/leader') || res.url().includes('/ranking'),
        { timeout: 10000 }
      ).catch(() => null);

      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      const apiResp = await responsePromise;
      expect(apiResp).not.toBeNull();  // an API call must be captured
      const status = apiResp!.status();
      expect(status).toBe(200);
      console.log(`✅ API status: ${status}`);
      await page.screenshot({ path: 'reports/screenshots/TC_LB_34-api.png', fullPage: true });
    });

    // TC_LB_35 — Full flow: select 17 May 2024, verify all elements
    test('TC_LB_35: full flow — select 17 May 2024, verify avatar + coins + prize + YOUR RANK', async () => {
      await page.goto(LEADERBOARD_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Step 1: Select 17 May 2024
      await selectDate(page, 17, 'May', 2024);
      console.log('Step 1 ✅ 17 May 2024 selected');

      const bodyText = await page.locator('body').innerText();

      // Step 2: YOUR RANK always visible
      expect(bodyText).toMatch(/YOUR RANK/i);
      console.log('Step 2 ✅ YOUR RANK section visible');

      // Step 3: Avatar images must exist
      const avatarCount = await page.locator('img[alt="avatar"]').count();
      expect(avatarCount).toBeGreaterThan(0);
      console.log(`Step 3 ✅ Avatar images: ${avatarCount}`);

      // Step 4: Comic Coins column + numeric values
      const tableText = await page.locator('table').first().innerText({ timeout: 5000 });
      expect(tableText).toMatch(/Comic Coins/i);
      expect(tableText).toMatch(/\d{2,}/);
      console.log('Step 4 ✅ Comic Coins values in table');

      // Step 5: Prize column in table HTML
      const tableHTML = await page.locator('table').first().innerHTML({ timeout: 5000 });
      expect(tableHTML.toLowerCase()).toContain('prize');
      console.log('Step 5 ✅ Prize column present');

      // Step 6: Masked mobile visible in YOUR RANK
      expect(bodyText).toMatch(/x+\d{4}/);
      console.log('Step 6 ✅ Masked mobile visible');

      // Step 7: No "No data found" message
      expect(bodyText).not.toMatch(/No data found/i);
      console.log('Step 7 ✅ Data present (no "No data found" message)');

      await page.screenshot({ path: 'reports/screenshots/TC_LB_35-full-flow.png', fullPage: true });
    });
  });
});
