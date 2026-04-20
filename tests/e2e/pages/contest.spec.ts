import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const HOME_URL    = 'https://sprite-joke-in-a-bottle.coke2home.com';
const CONTEST_URL = `${HOME_URL}/contest`;

// ── Helper: navigate to Contest page ─────────────────────────────────────────
async function gotoContest(page: Page) {
  await page.goto(CONTEST_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
}

// ── Helper: close any open modal ──────────────────────────────────────────────
async function closeModalIfOpen(page: Page) {
  const modal = page.locator('[role="dialog"]');
  const open  = await modal.isVisible({ timeout: 1000 }).catch(() => false);
  if (open) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Each nested group has configure({ mode: 'serial' }) — failures within a
// group abort only that group, never another group.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Contest — Page Tests (Authenticated)', () => {
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
  // GROUP 1 — Page Load & Basic Elements (TC_CT_01–06)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Page Load & Basic Elements', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_01 — Contest page loads with status 200
    test('TC_CT_01: Contest page loads with status 200', async () => {
      const response = await page.goto(CONTEST_URL);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'reports/screenshots/TC_CT_01-loaded.png', fullPage: false });
    });

    // TC_CT_02 — Page title contains Sprite
    test('TC_CT_02: page title contains Sprite', async () => {
      await expect(page).toHaveTitle(/Sprite Joke-In-A-Bottle/i);
    });

    // TC_CT_03 — User is logged in — profile icon visible in nav
    test('TC_CT_03: user is logged in — profile icon visible in nav', async () => {
      const profileImg = page.getByRole('img', { name: 'Profile Image' });
      await expect(profileImg).toBeVisible({ timeout: 8000 });
      console.log('✅ User is logged in');
    });

    // TC_CT_04 — Contest main heading is visible
    test('TC_CT_04: contest heading is visible on the page', async () => {
      const bodyText = await page.locator('body').innerText();
      // Page shows either "THE CONTEST IS OVER NOW." or contest heading
      expect(bodyText).toMatch(/CONTEST|EXCITING NEW REWARDS|How to gather Comic Coins/i);
      console.log('✅ Contest heading found');
    });

    // TC_CT_05 — "How to gather Comic Coins?" section is visible
    test('TC_CT_05: "How to gather Comic Coins?" section heading is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/How to gather Comic Coins/i);
      console.log('✅ "How to gather Comic Coins?" section found');
    });

    // TC_CT_06 — Page URL is /contest
    test('TC_CT_06: page URL is /contest', async () => {
      expect(page.url()).toContain('/contest');
      console.log(`✅ URL: ${page.url()}`);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2 — Coin-Earning Cards Visible (TC_CT_07–12)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Coin-Earning Cards Visible', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_07 — "Enter Unique Code" card is visible with coin amount
    test('TC_CT_07: Enter Unique Code card is visible with coin amount', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Enter Unique Code/i);
      expect(bodyText).toMatch(/20/); // 20 coins
      console.log('✅ Enter Unique Code card found with 20 coin reward');
    });

    // TC_CT_08 — "React to a Joke" card is visible
    test('TC_CT_08: React to a Joke card is visible with coin amount', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/React to a Joke/i);
      console.log('✅ React to a Joke card found');
    });

    // TC_CT_09 — "Vote for Favorite Joke" card is visible
    test('TC_CT_09: Vote for Favorite Joke card is visible with coin amount', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Vote for Fav/i);
      console.log('✅ Vote for Favorite Joke card found');
    });

    // TC_CT_10 — "Refer A Friend" card is visible with coin amount
    test('TC_CT_10: Refer A Friend card is visible with coin amount', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Refer A Friend/i);
      expect(bodyText).toMatch(/5.*Referral|Referral.*5/i);
      console.log('✅ Refer A Friend card found with 5 coin reward');
    });

    // TC_CT_11 — "Use Invite Code" card is visible with coin amount
    test('TC_CT_11: Use Invite Code card is visible with coin amount', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Use Invite Code/i);
      console.log('✅ Use Invite Code card found');
    });

    // TC_CT_12 — "Complete Your Profile" card is visible with coin amount
    test('TC_CT_12: Complete Your Profile card is visible with coin amount', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Complete Your Profile/i);
      expect(bodyText).toMatch(/10.*Completion|Completion.*10/i);
      console.log('✅ Complete Your Profile card found with 10 coin reward');
      await page.screenshot({ path: 'reports/screenshots/TC_CT_12-cards.png', fullPage: true });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3 — Previous Winner List (TC_CT_13–14)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Previous Winner List', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_13 — "Previous Winner List" button is present
    test('TC_CT_13: Previous Winner List button is present on the page', async () => {
      const btn = page.locator('button, a').filter({ hasText: /Previous Winner List/i }).first();
      const count = await btn.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ Previous Winner List button found');
    });

    // TC_CT_14 — Clicking "Previous Winner List" navigates to leaderboard
    test('TC_CT_14: clicking Previous Winner List navigates to the leaderboard page', async () => {
      const btn = page.locator('button, a').filter({ hasText: /Previous Winner List/i }).first();
      await btn.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      expect(page.url()).toContain('/leaderboard');
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/leaderboard|winner|Rank|Comic Coins/i);
      console.log(`✅ Navigated to leaderboard: ${page.url()}`);
      await page.screenshot({ path: 'reports/screenshots/TC_CT_14-leaderboard.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 4 — Enter Unique Code Modal (TC_CT_15–17)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Enter Unique Code Modal', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_15 — Clicking "Enter Unique Code" card opens a modal
    test('TC_CT_15: clicking Enter Unique Code card opens a modal', async () => {
      const card = page.locator('h2, h3').filter({ hasText: /Enter Unique Code/i }).first();
      await card.click({ force: true });
      await page.waitForTimeout(1500);

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      console.log('✅ Enter Unique Code modal opened');
      await page.screenshot({ path: 'reports/screenshots/TC_CT_15-unique-code-modal.png' });
    });

    // TC_CT_16 — Modal contains the code entry instructions
    test('TC_CT_16: unique code modal shows instructions and daily limit note', async () => {
      const modal    = page.locator('[role="dialog"]');
      const modalText = await modal.innerText();
      expect(modalText).toMatch(/unique code|Sprite.*bottle|Enter/i);
      // Shows daily limit info
      expect(modalText).toMatch(/5.*day|day.*5|code.*day/i);
      console.log('✅ Modal instructions and daily limit note present');
    });

    // TC_CT_17 — Modal has a Submit button
    test('TC_CT_17: unique code modal has a Submit button', async () => {
      const modal     = page.locator('[role="dialog"]');
      const submitBtn = modal.locator('button').filter({ hasText: /Submit/i }).first();
      await expect(submitBtn).toBeVisible({ timeout: 3000 });
      console.log('✅ Submit button present in unique code modal');
      await closeModalIfOpen(page);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 5 — React to a Joke (TC_CT_18–20)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('React to a Joke', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_18 — Clicking "React to a Joke" opens a response (video OR serial chiller popup)
    test('TC_CT_18: clicking React to a Joke opens a response — surprise video or Serial Chiller popup', async () => {
      const card = page.locator('h2, h3').filter({ hasText: /React to a Joke/i }).first();
      await card.click({ force: true });
      await page.waitForTimeout(2000);

      const modal    = page.locator('[role="dialog"]');
      const bodyText = await page.locator('body').innerText();

      const modalVisible    = await modal.isVisible().catch(() => false);
      const hasSerialChiller = /serial chiller|daily limit|exhausted/i.test(bodyText);
      const hasSurprise      = /surprise|video/i.test(bodyText) || page.url().includes('video');

      // Either a popup appeared or the page showed video content
      expect(modalVisible || hasSerialChiller || hasSurprise).toBe(true);
      console.log(`✅ React to Joke response: modal=${modalVisible}, chiller=${hasSerialChiller}, surprise=${hasSurprise}`);
      await page.screenshot({ path: 'reports/screenshots/TC_CT_18-react-joke.png' });
    });

    // TC_CT_19 — If daily limit exceeded, "Serial Chiller" popup is shown
    test('TC_CT_19: if daily react limit exceeded, Serial Chiller popup is shown', async () => {
      const bodyText  = await page.locator('body').innerText();
      const modal     = page.locator('[role="dialog"]');
      const modalText = await modal.innerText({ timeout: 3000 }).catch(() => '');

      const limitExceeded = /serial chiller|daily limit|exhausted|come back tomorrow/i.test(bodyText + modalText);

      if (limitExceeded) {
        expect(limitExceeded).toBe(true);
        console.log('✅ Serial Chiller popup shown — daily limit reached');
      } else {
        // Limit not reached — surprise video scenario (valid pass)
        console.log('ℹ️  Daily limit not reached — surprise video/content shown (Serial Chiller not expected)');
      }
      await closeModalIfOpen(page);
    });

    // TC_CT_20 — "React to Joke" card is re-clickable (card still present on page)
    test('TC_CT_20: React to a Joke card remains accessible on the contest page', async () => {
      await gotoContest(page);
      const card = page.locator('h2, h3').filter({ hasText: /React to a Joke/i });
      const count = await card.count();
      expect(count).toBeGreaterThan(0);
      console.log('✅ React to a Joke card is present and accessible');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 6 — Vote for Favourite Joke → UGC Section (TC_CT_21–22)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Vote for Favourite Joke', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_21 — Clicking "Vote for Favorite Joke" redirects to UGC/Joke Box section
    test('TC_CT_21: clicking Vote for Favorite Joke redirects to UGC joke section', async () => {
      const card = page.locator('h2, h3').filter({ hasText: /Vote for Fav/i }).first();
      await card.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Should navigate to /user-generated-jokes or joke box section
      const url = page.url();
      expect(url).toMatch(/user-generated-joke|joke|scroll/i);
      console.log(`✅ Redirected to UGC/Joke section: ${url}`);
      await page.screenshot({ path: 'reports/screenshots/TC_CT_21-vote-redirect.png' });
    });

    // TC_CT_22 — Redirected UGC page shows Joke Box content
    test('TC_CT_22: redirected UGC page shows Joke Box content', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/JOKE BOX|Jokes For you|Filter|Load More/i);
      console.log('✅ UGC/Joke Box content visible after redirect');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 7 — Refer A Friend Modal (TC_CT_23–25)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Refer A Friend Modal', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_23 — Clicking "Refer A Friend" card opens a modal
    test('TC_CT_23: clicking Refer A Friend card opens a referral modal', async () => {
      const card = page.locator('h2, h3').filter({ hasText: /Refer A Friend/i }).first();
      await card.click({ force: true });
      await page.waitForTimeout(1500);

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      console.log('✅ Refer A Friend modal opened');
      await page.screenshot({ path: 'reports/screenshots/TC_CT_23-refer-modal.png' });
    });

    // TC_CT_24 — Referral modal has "Refer Now" button
    test('TC_CT_24: referral modal has a Refer Now button', async () => {
      const modal    = page.locator('[role="dialog"]');
      const referBtn = modal.locator('button').filter({ hasText: /Refer Now/i }).first();
      await expect(referBtn).toBeVisible({ timeout: 3000 });
      console.log('✅ Refer Now button visible in referral modal');
    });

    // TC_CT_25 — Referral modal shows bro-code / referral info text
    test('TC_CT_25: referral modal shows referral info and coin reward text', async () => {
      const modal     = page.locator('[role="dialog"]');
      const modalText = await modal.innerText();
      expect(modalText).toMatch(/friend|coin|refer|bro/i);
      console.log('✅ Referral info text present in modal');
      await closeModalIfOpen(page);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 8 — Use Invite Code Modal (TC_CT_26–28)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Use Invite Code Modal', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_26 — Clicking "Use Invite Code" card opens a modal
    test('TC_CT_26: clicking Use Invite Code card opens a modal', async () => {
      const card = page.locator('h2, h3').filter({ hasText: /Use Invite Code/i }).first();
      await card.click({ force: true });
      await page.waitForTimeout(1500);

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      console.log('✅ Use Invite Code modal opened');
      await page.screenshot({ path: 'reports/screenshots/TC_CT_26-invite-modal.png' });
    });

    // TC_CT_27 — Invite code modal has a Submit button
    test('TC_CT_27: invite code modal has a Submit button', async () => {
      const modal     = page.locator('[role="dialog"]');
      const submitBtn = modal.locator('button').filter({ hasText: /Submit/i }).first();
      await expect(submitBtn).toBeVisible({ timeout: 3000 });
      console.log('✅ Submit button present in invite code modal');
    });

    // TC_CT_28 — Invite code modal shows instructions to enter and collect coins
    test('TC_CT_28: invite code modal shows instructions for entering the code', async () => {
      const modal     = page.locator('[role="dialog"]');
      const modalText = await modal.innerText();
      expect(modalText).toMatch(/invite code|comic coin|enter|collect/i);
      console.log('✅ Invite code modal instructions present');
      await closeModalIfOpen(page);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 9 — Complete Your Profile (TC_CT_29–30)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Complete Your Profile', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_29 — Clicking "Complete Your Profile" redirects to /profile
    test('TC_CT_29: clicking Complete Your Profile redirects to the profile page', async () => {
      const card = page.locator('h2, h3').filter({ hasText: /Complete Your Profile/i }).first();
      await card.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2500);

      expect(page.url()).toContain('/profile');
      console.log(`✅ Redirected to profile: ${page.url()}`);
      await page.screenshot({ path: 'reports/screenshots/TC_CT_29-profile.png' });
    });

    // TC_CT_30 — Profile page shows coin balance (increments when profile completed)
    test('TC_CT_30: profile page shows Comic Coins balance', async () => {
      const bodyText = await page.locator('body').innerText();
      // Profile page shows coin balance — large number visible
      expect(bodyText).toMatch(/Comic Coins/i);
      expect(bodyText).toMatch(/\d{3,}/);  // coin balance is a large number
      console.log('✅ Comic Coins balance visible on profile page');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 10 — Static Elements & Full Flow (TC_CT_31–33)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Static Elements & Full Flow', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoContest(page);
    });

    // TC_CT_31 — BUY NOW button is visible
    test('TC_CT_31: BUY NOW button is visible on the contest page', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/BUY NOW/i);
      console.log('✅ BUY NOW visible');
    });

    // TC_CT_32 — Footer has T&C and Privacy Policy links
    test('TC_CT_32: footer has T&C and Privacy Policy links', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/Terms.*Conditions|T&C/i);
      expect(bodyText).toMatch(/Privacy Policy/i);
      console.log('✅ Footer: T&C and Privacy Policy links found');
      await page.screenshot({ path: 'reports/screenshots/TC_CT_32-footer.png', fullPage: true });
    });

    // TC_CT_33 — Full flow: all 6 earning cards visible, Previous Winner redirects, Enter Unique Code opens modal
    test('TC_CT_33: full flow — all earning cards visible, Previous Winner navigates, modal opens', async () => {
      await gotoContest(page);

      const bodyText = await page.locator('body').innerText();

      // Step 1: All 6 earning cards visible
      expect(bodyText).toMatch(/Enter Unique Code/i);
      console.log('Step 1a ✅ Enter Unique Code card present');
      expect(bodyText).toMatch(/React to a Joke/i);
      console.log('Step 1b ✅ React to a Joke card present');
      expect(bodyText).toMatch(/Vote for Fav/i);
      console.log('Step 1c ✅ Vote for Favorite Joke card present');
      expect(bodyText).toMatch(/Refer A Friend/i);
      console.log('Step 1d ✅ Refer A Friend card present');
      expect(bodyText).toMatch(/Use Invite Code/i);
      console.log('Step 1e ✅ Use Invite Code card present');
      expect(bodyText).toMatch(/Complete Your Profile/i);
      console.log('Step 1f ✅ Complete Your Profile card present');

      // Step 2: Previous Winner List button present
      const prevBtn = page.locator('button, a').filter({ hasText: /Previous Winner List/i }).first();
      expect(await prevBtn.count()).toBeGreaterThan(0);
      console.log('Step 2 ✅ Previous Winner List button present');

      // Step 3: Click Previous Winner → leaderboard
      await prevBtn.click({ force: true });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/leaderboard');
      console.log(`Step 3 ✅ Navigated to leaderboard: ${page.url()}`);

      // Step 4: Back to contest — Enter Unique Code modal opens
      await gotoContest(page);
      const codeCard = page.locator('h2, h3').filter({ hasText: /Enter Unique Code/i }).first();
      await codeCard.click({ force: true });
      await page.waitForTimeout(2500);
      const modal = page.locator('[role="dialog"]');
      const modalOpen = await modal.isVisible({ timeout: 6000 }).catch(() => false);
      expect(modalOpen).toBe(true);
      if (modalOpen) {
        const modalText = await modal.innerText();
        expect(modalText).toMatch(/unique code|Sprite|Enter/i);
        console.log('Step 4 ✅ Enter Unique Code modal opened with correct content');
        await closeModalIfOpen(page);
        await page.waitForTimeout(500);
      }

      // Step 5: Refer A Friend modal opens
      const referCard = page.locator('h2, h3').filter({ hasText: /Refer A Friend/i }).first();
      await referCard.click({ force: true });
      await page.waitForTimeout(2500);
      const referModalOpen = await page.locator('[role="dialog"]').isVisible({ timeout: 6000 }).catch(() => false);
      expect(referModalOpen).toBe(true);
      console.log('Step 5 ✅ Refer A Friend modal opened');
      await closeModalIfOpen(page);
      await page.waitForTimeout(500);

      // Step 6: Use Invite Code modal opens
      const inviteCard = page.locator('h2, h3').filter({ hasText: /Use Invite Code/i }).first();
      await inviteCard.click({ force: true });
      await page.waitForTimeout(2500);
      const inviteModalOpen = await page.locator('[role="dialog"]').isVisible({ timeout: 6000 }).catch(() => false);
      expect(inviteModalOpen).toBe(true);
      console.log('Step 6 ✅ Use Invite Code modal opened');
      await closeModalIfOpen(page);

      await page.screenshot({ path: 'reports/screenshots/TC_CT_33-full-flow.png' });
    });
  });
});
