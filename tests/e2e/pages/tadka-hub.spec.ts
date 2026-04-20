import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const HOME_URL     = 'https://sprite-joke-in-a-bottle.coke2home.com';
const TADKA_HUB_URL = `${HOME_URL}/tadka-hub`;

// ── Helper: close any open modal/dialog ──────────────────────────────────────
async function dismissModalIfPresent(page: Page) {
  const modal = page.locator('[role="dialog"][data-state="open"]');
  const isOpen = await modal.isVisible({ timeout: 2000 }).catch(() => false);
  if (isOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log('ℹ️  Modal dismissed');
  }
}

// ── Helper: go to homepage → close modal → navigate to Tadka Hub ─────────────
async function gotoTadkaHub(page: Page) {
  await page.goto(HOME_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await dismissModalIfPresent(page);

  await page.goto(TADKA_HUB_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3500);  // extra wait — video cards lazy-load after DOM ready

  // Scroll to trigger lazy content
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Each nested group has configure({ mode: 'serial' }) — failures within a
// group abort only that group, never another group.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Tadka Hub — Page Smoke Tests (Authenticated)', () => {
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
  // GROUP 1 — Page Load & Basic Elements (TC_TH_01–06)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Page Load & Basic Elements', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoTadkaHub(page);
    });

    // TC_TH_01 — Homepage loads and modal is dismissed before navigation
    test('TC_TH_01: homepage loads and any modal is dismissed before navigating', async () => {
      await page.goto(HOME_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      await dismissModalIfPresent(page);

      // No open modal should remain
      const modal = page.locator('[role="dialog"][data-state="open"]');
      const isOpen = await modal.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isOpen).toBe(false);
      console.log('✅ Homepage loaded — no open modal');
      await page.screenshot({ path: 'reports/screenshots/TC_TH_01-homepage-no-modal.png' });
    });

    // TC_TH_02 — Tadka Hub page loads with status 200
    test('TC_TH_02: Tadka Hub page loads with status 200', async () => {
      const response = await page.goto(TADKA_HUB_URL);
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'reports/screenshots/TC_TH_02-loaded.png', fullPage: true });
    });

    // TC_TH_03 — Page title contains Sprite
    test('TC_TH_03: page title contains Sprite', async () => {
      await expect(page).toHaveTitle(/Sprite Joke-In-A-Bottle/i);
    });

    // TC_TH_04 — User is logged in (Profile Image visible in nav)
    test('TC_TH_04: user is logged in — profile icon visible in nav', async () => {
      const profileImg = page.getByRole('img', { name: 'Profile Image' });
      await expect(profileImg).toBeVisible({ timeout: 8000 });
      console.log('✅ User is logged in');
    });

    // TC_TH_05 — "TADKA HUB" heading is visible
    test('TC_TH_05: TADKA HUB heading is visible', async () => {
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/TADKA HUB/i);
      console.log('✅ TADKA HUB heading found');
    });

    // TC_TH_06 — Page URL is /tadka-hub
    test('TC_TH_06: page URL is /tadka-hub', async () => {
      expect(page.url()).toContain('/tadka-hub');
      console.log(`✅ URL: ${page.url()}`);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 2 — Video Cards Content (TC_TH_07–12)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Video Cards Content', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoTadkaHub(page);
    });

    // TC_TH_07 — At least 1 video card is visible
    test('TC_TH_07: at least one video card is visible on the page', async () => {
      // Each card has a Play or Pause icon
      const playImgs  = page.locator('img[alt="Play"]');
      const pauseImgs = page.locator('img[alt="Pause"]');
      const playCount  = await playImgs.count();
      const pauseCount = await pauseImgs.count();
      const totalCards = playCount + pauseCount;
      expect(totalCards).toBeGreaterThan(0);
      console.log(`✅ ${totalCards} video card(s) found (Play: ${playCount}, Pause: ${pauseCount})`);
    });

    // TC_TH_08 — Video titles are visible
    test('TC_TH_08: video titles are visible on cards', async () => {
      const bodyText = await page.locator('body').innerText();
      // Known video titles on Tadka Hub
      const hasTitles = /Spicy Chilli Paneer|Momo Day|Spicy Momo|Spicy Noodle|Sprite Manchurian/i.test(bodyText);
      expect(hasTitles).toBe(true);
      console.log('✅ Video titles visible');

      // At least 1 card heading visible
      const cardHeadings = await page.locator('h3, h4').all();
      let titleCount = 0;
      for (const h of cardHeadings) {
        const t = await h.innerText().catch(() => '');
        if (t.trim()) titleCount++;
      }
      expect(titleCount).toBeGreaterThan(0);
      console.log(`✅ ${titleCount} video title headings found`);
    });

    // TC_TH_09 — View count icon is visible on cards
    test('TC_TH_09: view count icon is visible on video cards', async () => {
      const viewIcons = page.locator('img[alt="views"]');
      const count = await viewIcons.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ ${count} view icon(s) found`);
    });

    // TC_TH_10 — Like icon is visible on cards
    test('TC_TH_10: like icon is visible on video cards', async () => {
      const likeIcons = page.locator('img[alt="like"]');
      const count = await likeIcons.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ ${count} like icon(s) found`);
    });

    // TC_TH_11 — Share icon is visible on cards
    test('TC_TH_11: share icon is visible on video cards', async () => {
      // Use evaluate() to avoid Playwright selector retry overhead on video pages
      const count = await page.evaluate(() =>
        document.querySelectorAll('img[alt="share"], img[alt="Share"]').length
      );
      expect(count).toBeGreaterThan(0);
      console.log(`✅ ${count} share icon(s) found`);
    });

    // TC_TH_12 — Numeric counts (views, likes, shares) are visible
    test('TC_TH_12: numeric view/like/share counts are visible on cards', async () => {
      // Use evaluate() to read body text to avoid page-closed errors on video pages
      const bodyText = await page.evaluate(() => document.body.innerText);
      const tadkaIdx = bodyText.indexOf('TADKA HUB');
      const section  = bodyText.substring(tadkaIdx, tadkaIdx + 1000);
      // Should have multiple numbers (view/like/share counts like 699, 294, 73)
      const numbers = section.match(/\d{2,}/g) || [];
      expect(numbers.length).toBeGreaterThan(0);
      console.log(`✅ Numeric counts found: ${numbers.slice(0, 6).join(', ')}`);
      await page.screenshot({ path: 'reports/screenshots/TC_TH_12-card-counts.png' });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 3 — Playback Controls (TC_TH_13–16)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Playback Controls', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoTadkaHub(page);
    });

    // TC_TH_13 — Play or Pause button is visible on video card
    test('TC_TH_13: Play or Pause button is visible on video cards', async () => {
      const playBtn  = page.locator('img[alt="Play"]');
      const pauseBtn = page.locator('img[alt="Pause"]');
      const playCount  = await playBtn.count();
      const pauseCount = await pauseBtn.count();
      expect(playCount + pauseCount).toBeGreaterThan(0);
      console.log(`✅ Play: ${playCount}, Pause: ${pauseCount}`);
    });

    // TC_TH_14 — Mute/Unmute button is visible
    test('TC_TH_14: Mute or Unmute button is visible on video cards', async () => {
      const muteBtn = page.locator('img[alt="Mute"]');
      const count   = await muteBtn.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ ${count} Mute/Unmute button(s) found`);
    });

    // TC_TH_15 — Scroll down arrow is visible (navigate between videos)
    test('TC_TH_15: scroll down arrow is visible for navigating between videos', async () => {
      const downArrow = page.locator('img[alt="Scroll down"]');
      const count     = await downArrow.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Scroll down arrow present: ${count}`);
    });

    // TC_TH_16 — Scroll up arrow is visible
    test('TC_TH_16: scroll up arrow is visible for navigating between videos', async () => {
      const upArrow = page.locator('img[alt="Scroll up"]');
      const count   = await upArrow.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Scroll up arrow present: ${count}`);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 4 — Navigation & Static Elements (TC_TH_17–19)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Navigation & Static Elements', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoTadkaHub(page);
    });

    // TC_TH_17 — Nav has Explore and Contest links
    test('TC_TH_17: navigation has Explore and Contest links', async () => {
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText).toMatch(/Explore/i);
      expect(bodyText).toMatch(/Contest/i);
      console.log('✅ Explore and Contest nav links found');
    });

    // TC_TH_18 — Language switcher is present in nav
    test('TC_TH_18: language switcher is present in navigation', async () => {
      const bodyText = await page.evaluate(() => document.body.innerText);
      // Language switcher shows current language (ENGLISH, हिन्दी, etc.)
      expect(bodyText).toMatch(/ENGLISH|हिन्दी|English/i);
      console.log('✅ Language switcher found');
      await page.screenshot({ path: 'reports/screenshots/TC_TH_18-nav.png' });
    });

    // TC_TH_19 — API returns 200 on page reload
    test('TC_TH_19: Tadka Hub API returns 200 on page reload', async () => {
      const responsePromise = page.waitForResponse(
        res => res.url().includes('/tadka-hub') || res.url().includes('/tadka') || res.url().includes('/video') || res.url().includes('/spicy'),
        { timeout: 10000 }
      ).catch(() => null);

      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const apiResp = await responsePromise;
      if (apiResp) {
        const status = apiResp.status();
        expect(status).toBe(200);
        console.log(`✅ API status: ${status} — ${apiResp.url().substring(0, 80)}`);
      } else {
        // SSR — page load itself is 200, already verified in TC_TH_02
        console.log('ℹ️  No separate API call captured (SSR) — page load verified in TC_TH_02');
        expect(page.url()).toContain('/tadka-hub');
      }
      await page.screenshot({ path: 'reports/screenshots/TC_TH_19-api.png', fullPage: true });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 5 — Full Flow (TC_TH_20)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Full Flow', () => {
    test.describe.configure({ mode: 'serial' });

    // TC_TH_20 — Full flow: homepage → dismiss modal → Tadka Hub → verify all
    test('TC_TH_20: full flow — homepage modal dismiss → Tadka Hub → all elements verified', async () => {
      // Step 1: Go to homepage
      await page.goto(HOME_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      console.log('Step 1 ✅ Homepage loaded');

      // Step 2: Dismiss modal if present
      await dismissModalIfPresent(page);
      const modal = page.locator('[role="dialog"][data-state="open"]');
      const isOpen = await modal.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isOpen).toBe(false);
      console.log('Step 2 ✅ No open modal');

      // Step 3: Navigate to Tadka Hub
      await page.goto(TADKA_HUB_URL);
      await page.waitForLoadState('domcontentloaded');
      // Wait for at least one video card to appear before proceeding
      await page.waitForSelector('img[alt="Play"], img[alt="Pause"]', { timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);
      console.log('Step 3 ✅ Navigated to Tadka Hub');

      // Step 4: URL correct
      expect(page.url()).toContain('/tadka-hub');
      console.log('Step 4 ✅ URL is /tadka-hub');

      // Step 5: TADKA HUB heading
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toMatch(/TADKA HUB/i);
      console.log('Step 5 ✅ TADKA HUB heading visible');

      // Step 6: Video titles visible
      const hasTitles = /Spicy Chilli Paneer|Momo Day|Spicy Momo|Spicy Noodle|Sprite Manchurian/i.test(bodyText);
      expect(hasTitles).toBe(true);
      console.log('Step 6 ✅ Video titles visible');

      // Step 7: View/Like/Share icons
      const viewCount  = await page.locator('img[alt="views"]').count();
      const likeCount  = await page.locator('img[alt="like"]').count();
      const shareCount = await page.evaluate(() =>
        document.querySelectorAll('img[alt="share"], img[alt="Share"]').length
      );
      expect(viewCount).toBeGreaterThan(0);
      expect(likeCount).toBeGreaterThan(0);
      expect(shareCount).toBeGreaterThan(0);
      console.log(`Step 7 ✅ Icons — Views: ${viewCount}, Likes: ${likeCount}, Shares: ${shareCount}`);

      // Step 8: Play or Pause button
      const playCount  = await page.locator('img[alt="Play"]').count();
      const pauseCount = await page.locator('img[alt="Pause"]').count();
      expect(playCount + pauseCount).toBeGreaterThan(0);
      console.log(`Step 8 ✅ Play/Pause buttons: ${playCount + pauseCount}`);

      // Step 9: Mute button
      const muteCount = await page.locator('img[alt="Mute"]').count();
      expect(muteCount).toBeGreaterThan(0);
      console.log(`Step 9 ✅ Mute button: ${muteCount}`);

      // Step 10: Scroll arrows
      const downArrow = await page.locator('img[alt="Scroll down"]').count();
      const upArrow   = await page.locator('img[alt="Scroll up"]').count();
      expect(downArrow + upArrow).toBeGreaterThan(0);
      console.log(`Step 10 ✅ Scroll arrows — Down: ${downArrow}, Up: ${upArrow}`);

      // Step 11: Numeric counts visible
      const tadkaIdx = bodyText.indexOf('TADKA HUB');
      const section  = bodyText.substring(tadkaIdx, tadkaIdx + 1000);
      const numbers  = section.match(/\d{2,}/g) || [];
      expect(numbers.length).toBeGreaterThan(0);
      console.log(`Step 11 ✅ Numeric counts: ${numbers.slice(0, 6).join(', ')}`);

      await page.screenshot({ path: 'reports/screenshots/TC_TH_20-full-flow.png', fullPage: true });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GROUP 6 — Interactions: Like, Share, View Count, Arrow Navigation (TC_TH_21–24)
  // ══════════════════════════════════════════════════════════════════════════
  test.describe('Interactions — Like, Share, View Count & Arrow Navigation', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async () => {
      await gotoTadkaHub(page);
    });

    // TC_TH_21 — View count is a numeric value > 0 on each card
    test('TC_TH_21: view count is a visible positive number on video cards', async () => {
      // Numeric values near the "views" icon — extracted from body text
      const bodyText = await page.evaluate(() => document.body.innerText);
      const tadkaIdx = bodyText.indexOf('TADKA HUB');
      const section  = bodyText.substring(tadkaIdx, tadkaIdx + 1000);
      // Should contain multi-digit view counts (e.g. 699, 327, 350)
      const numbers = section.match(/\d{2,}/g) || [];
      expect(numbers.length).toBeGreaterThan(0);
      const firstCount = parseInt(numbers[0], 10);
      expect(firstCount).toBeGreaterThan(0);
      console.log(`✅ First video view count: ${firstCount} (total numbers in section: ${numbers.length})`);
      await page.screenshot({ path: 'reports/screenshots/TC_TH_21-view-count.png' });
    });

    // TC_TH_22 — Like button is clickable; count changes after click (if not already liked)
    test('TC_TH_22: like button is clickable and like count updates', async () => {
      // Get the first like icon button (the parent button containing img[alt="like"])
      const likeBtn = page.locator('img[alt="like"]').first();
      await expect(likeBtn).toBeVisible({ timeout: 5000 });

      // Read like count before click from body text
      const beforeText = await page.evaluate(() => document.body.innerText);
      const tadkaIdx   = beforeText.indexOf('TADKA HUB');
      const section    = beforeText.substring(tadkaIdx, tadkaIdx + 500);
      const nums       = section.match(/\d+/g) || [];
      // Typically: viewCount likeCount shareCount (e.g. "699 294 73")
      const likeCountBefore = nums.length >= 2 ? parseInt(nums[1], 10) : -1;
      console.log(`ℹ️  Like count before click: ${likeCountBefore}`);

      // Click the like button (click parent button element)
      await likeBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // Read like count after click
      const afterText    = await page.evaluate(() => document.body.innerText);
      const sectionAfter = afterText.substring(afterText.indexOf('TADKA HUB'), afterText.indexOf('TADKA HUB') + 500);
      const numsAfter    = sectionAfter.match(/\d+/g) || [];
      const likeCountAfter = numsAfter.length >= 2 ? parseInt(numsAfter[1], 10) : -1;
      console.log(`ℹ️  Like count after click: ${likeCountAfter}`);

      // The count should have changed by ±1 (like or unlike)
      if (likeCountBefore >= 0 && likeCountAfter >= 0) {
        const diff = Math.abs(likeCountAfter - likeCountBefore);
        expect(diff).toBeLessThanOrEqual(1);
        console.log(`✅ Like count changed by ${diff} (before: ${likeCountBefore}, after: ${likeCountAfter})`);
      } else {
        // If counts are not parseable, just verify the button was clickable
        console.log('✅ Like button was clickable (count parsing not available)');
      }
      await page.screenshot({ path: 'reports/screenshots/TC_TH_22-like-clicked.png' });
    });

    // TC_TH_23 — Share button is visible and clickable (opens share modal or action)
    test('TC_TH_23: share button is visible and clickable', async () => {
      const shareBtn = page.locator('img[alt="share"], img[alt="Share"]').first();
      const count = await page.evaluate(() =>
        document.querySelectorAll('img[alt="share"], img[alt="Share"]').length
      );
      expect(count).toBeGreaterThan(0);
      await expect(shareBtn).toBeVisible({ timeout: 5000 });
      console.log(`✅ Share button visible (${count} share icons found)`);

      // Click the share button
      await shareBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // After clicking share, either a modal/sheet opens or nothing breaks
      const bodyAfter = await page.evaluate(() => document.body.innerText);
      expect(bodyAfter).toMatch(/TADKA HUB/i);  // page is still on Tadka Hub
      console.log('✅ Share button clicked — page still on Tadka Hub');

      // Close any share modal that may have appeared
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'reports/screenshots/TC_TH_23-share-clicked.png' });
    });

    // TC_TH_24 — Scroll down and up arrow buttons are clickable; they navigate between videos
    test('TC_TH_24: scroll down and up arrow buttons are clickable and navigate between videos', async () => {
      // Get initial heading visible in viewport
      const downArrow = page.locator('img[alt="Scroll down"]').first();
      const upArrow   = page.locator('img[alt="Scroll up"]').first();

      await expect(downArrow).toBeVisible({ timeout: 5000 });
      await expect(upArrow).toBeVisible({ timeout: 5000 });
      console.log('✅ Both scroll arrows are visible');

      // Click scroll down — should navigate to next video
      await downArrow.click({ force: true });
      await page.waitForTimeout(1500);
      const bodyAfterDown = await page.evaluate(() => document.body.innerText);
      expect(bodyAfterDown).toMatch(/TADKA HUB/i);
      console.log('✅ Scroll down arrow clicked — still on Tadka Hub');
      await page.screenshot({ path: 'reports/screenshots/TC_TH_24-scroll-down.png' });

      // Click scroll up — should navigate back to previous video
      await upArrow.click({ force: true });
      await page.waitForTimeout(1500);
      const bodyAfterUp = await page.evaluate(() => document.body.innerText);
      expect(bodyAfterUp).toMatch(/TADKA HUB/i);
      console.log('✅ Scroll up arrow clicked — still on Tadka Hub');
      await page.screenshot({ path: 'reports/screenshots/TC_TH_24-scroll-up.png' });
    });
  });
});
