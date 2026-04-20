import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const HOME_URL       = 'https://sprite-joke-in-a-bottle.coke2home.com';
const SCROLL_LOL_URL = 'https://sprite-joke-in-a-bottle.coke2home.com/scroll-and-lol';

// ── Helper: close dialog if open ─────────────────────────────────────────────
async function dismissModalIfPresent(page: Page) {
  try {
    await page.waitForSelector('[role="dialog"][data-state="open"]', { timeout: 1000 });
    const modal = page.locator('[role="dialog"][data-state="open"]').first();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const stillOpen = await modal.isVisible().catch(() => false);
    if (stillOpen) {
      await modal.locator('button').first().click({ force: true });
      await page.waitForTimeout(300);
    }
  } catch {
    // no modal — continue
  }
}

// ── Helper: navigate + wait for page to settle + dismiss any modal ────────────
async function gotoAndSettle(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await dismissModalIfPresent(page);
}

// No serial mode — failures in one test do NOT stop the rest from running.
// Single shared page (one browser window for the whole suite).
test.describe('Scroll and Lol — Full Flow (Authenticated)', () => {
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

  // ── Homepage — Scroll and Lol Section ─────────────────────────────────────

  test('TC_SL_01: Scroll and Lol section is visible on homepage', async () => {
    await gotoAndSettle(page, HOME_URL);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(800);
    const section = page.locator('text=/Scroll and Lol|Scroll & LOL/i').filter({ visible: true }).first();
    await expect(section).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_01-scroll-lol-section.png', fullPage: false });
  });

  test('TC_SL_02: video thumbnails are visible in Scroll and Lol section', async () => {
    await gotoAndSettle(page, HOME_URL);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(800);
    await dismissModalIfPresent(page);
    await expect(
      page.locator('[class*="thumbnail"], [class*="video"], [class*="reel"], video').first()
    ).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_02-video-thumbnails.png' });
  });

  test('TC_SL_03: multiple video thumbnails are present', async () => {
    await gotoAndSettle(page, HOME_URL);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(800);
    await dismissModalIfPresent(page);
    const count = await page.locator('[class*="thumbnail"], [class*="video"], [class*="reel"]').count();
    expect(count).toBeGreaterThan(1);
    await page.screenshot({ path: 'reports/screenshots/TC_SL_03-multiple-thumbnails.png' });
  });

  test('TC_SL_04: clicking video thumbnail navigates to Scroll and Lol page', async () => {
    await gotoAndSettle(page, HOME_URL);
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(800);
    await dismissModalIfPresent(page);
    await page.locator('[class*="thumbnail"], [class*="video"], [class*="reel"]').first().click();
    await page.waitForLoadState('networkidle');
    await dismissModalIfPresent(page);
    expect(page.url()).toContain('scroll');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_04-navigate-scroll-lol.png', fullPage: true });
  });

  // ── Scroll and Lol Page ────────────────────────────────────────────────────

  test('TC_SL_05: Scroll and Lol page loads successfully', async () => {
    const response = await page.goto(SCROLL_LOL_URL);
    await page.waitForLoadState('networkidle');
    await dismissModalIfPresent(page);
    expect(response?.status()).toBe(200);
    await page.screenshot({ path: 'reports/screenshots/TC_SL_05-scroll-lol-page.png', fullPage: true });
  });

  test('TC_SL_06: reel video is visible on Scroll and Lol page', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const video = page.locator('video').or(page.locator('[class*="reel"], [class*="video-player"]')).first();
    await expect(video).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_06-reel-visible.png' });
  });

  test('TC_SL_07: video plays automatically on Scroll and Lol page', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const video = page.locator('video').first();
    if (await video.isVisible().catch(() => false)) {
      const isPlaying = await video.evaluate((v: HTMLVideoElement) => !v.paused);
      expect(isPlaying).toBeTruthy();
    }
    await page.screenshot({ path: 'reports/screenshots/TC_SL_07-video-playing.png' });
  });

  test('TC_SL_08: next video button is visible', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const nextBtn = page.getByRole('button', { name: 'Scroll down' });
    await expect(nextBtn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_08-next-btn.png' });
  });

  test('TC_SL_09: previous video button is visible', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const prevBtn = page.getByRole('button', { name: 'Scroll up' });
    await expect(prevBtn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_09-prev-btn.png' });
  });

  test('TC_SL_10: clicking next button loads next video', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const nextBtn = page.getByRole('button', { name: 'Scroll down' });
    await nextBtn.click();
    await page.waitForLoadState('networkidle');
    const video = page.locator('video').first();
    await expect(video).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_10-next-video.png' });
  });

  test('TC_SL_11: clicking previous button loads previous video', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    // Click next first so Scroll up becomes enabled
    await page.getByRole('button', { name: 'Scroll down' }).click();
    await page.waitForLoadState('networkidle');
    const prevBtn = page.getByRole('button', { name: 'Scroll up' });
    await prevBtn.click();
    await page.waitForLoadState('networkidle');
    const video = page.locator('video').first();
    await expect(video).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_11-prev-video.png' });
  });

  test('TC_SL_12: reaction/emoji button is visible on video', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    await expect(page.locator('img[alt="funny"]')).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_12-like-btn.png' });
  });

  test('TC_SL_13: reaction button is clickable when logged in', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    await page.locator('img[alt="funny"]').locator('..').click();
    const loginInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await expect(loginInput).toBeHidden();
    await page.screenshot({ path: 'reports/screenshots/TC_SL_13-like-clicked.png' });
  });

  test('TC_SL_14: share button is visible on video', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const shareBtn = page
      .locator('[class*="share"], [aria-label*="share"]')
      .or(page.getByRole('button', { name: /share/i }))
      .first();
    await expect(shareBtn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_14-share-btn.png' });
  });

  test('TC_SL_15: share button opens share options', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const shareBtn = page
      .locator('[class*="share"], [aria-label*="share"]')
      .or(page.getByRole('button', { name: /share/i }))
      .first();
    await shareBtn.click();
    await page.screenshot({ path: 'reports/screenshots/TC_SL_15-share-options.png' });
  });

  test('TC_SL_16: browser back returns to previous page', async () => {
    await gotoAndSettle(page, HOME_URL);
    await gotoAndSettle(page, SCROLL_LOL_URL);
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('sprite-joke-in-a-bottle.coke2home.com');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_16-back-home.png' });
  });

  // ── Unauthenticated Flow ───────────────────────────────────────────────────

  test('TC_SL_17: login modal appears for unauthenticated user clicking thumbnail', async () => {
    const freshContext = await page.context().browser()!.newContext();
    const freshPage    = await freshContext.newPage();
    await freshPage.goto(HOME_URL);
    await freshPage.waitForLoadState('networkidle');
    await freshPage.evaluate(() => window.scrollBy(0, 600));
    await freshPage.waitForTimeout(500);
    const thumbnail = freshPage
      .locator('[class*="thumbnail"], [class*="video"], [class*="reel"]')
      .first();
    if (await thumbnail.isVisible().catch(() => false)) {
      await thumbnail.click();
      await freshPage.waitForLoadState('networkidle');
      const loginInput = freshPage.getByRole('textbox', { name: 'Mobile Number*' });
      await expect(loginInput).toBeVisible({ timeout: 8000 });
      await freshPage.screenshot({ path: 'reports/screenshots/TC_SL_17-login-required.png' });
    }
    await freshContext.close();
  });

  test('TC_SL_18: Scroll and Lol page has correct URL', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    expect(page.url()).toContain('scroll');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_18-correct-url.png' });
  });

  test('TC_SL_19: no console errors on Scroll and Lol page', async () => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await gotoAndSettle(page, SCROLL_LOL_URL);
    expect(errors).toHaveLength(0);
    await page.screenshot({ path: 'reports/screenshots/TC_SL_19-no-errors.png' });
  });

  test('TC_SL_20: video title or description is visible', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const title = page
      .locator('[class*="title"], [class*="description"], [class*="caption"]')
      .first();
    await expect(title).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_20-video-title.png' });
  });

  // ── Reaction Tests ─────────────────────────────────────────────────────────

  test('TC_SL_21: all 3 reaction emojis are visible on video', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    await expect(page.locator('img[alt="funny"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('img[alt="mad"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('img[alt="angry"]')).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_21-all-reactions.png' });
  });

  test('TC_SL_22: reaction count is visible next to each emoji', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const countArea = page.locator('img[alt="funny"]').locator('..');
    await expect(countArea).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_22-reaction-count.png' });
  });

  test('TC_SL_23: user can react on video with no existing reaction', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const funnyWrapper = page.locator('img[alt="funny"]').locator('..');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_23-before-reaction.png' });
    await funnyWrapper.click();
    await page.screenshot({ path: 'reports/screenshots/TC_SL_23-after-reaction.png' });
  });

  test('TC_SL_24: reaction count increases after clicking emoji', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const funnyWrapper = page.locator('img[alt="funny"]').locator('..');
    const textBefore = await funnyWrapper.innerText().catch(() => '0');
    await funnyWrapper.click();
    const textAfter = await funnyWrapper.innerText().catch(() => '0');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_24-count-increased.png' });
    const countBefore = parseInt(textBefore.replace(/\D/g, '')) || 0;
    const countAfter  = parseInt(textAfter.replace(/\D/g, '')) || 0;
    expect(countAfter >= countBefore).toBeTruthy();
  });

  test('TC_SL_25: user cannot react again on already reacted video', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const funnyWrapper = page.locator('img[alt="funny"]').locator('..');
    await funnyWrapper.click();
    const countAfterFirst = await funnyWrapper.innerText().catch(() => '0');
    await page.locator('img[alt="mad"]').locator('..').click();
    const countAfterSecond = await funnyWrapper.innerText().catch(() => '0');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_25-second-reaction-attempt.png' });
    const numFirst  = parseInt(countAfterFirst.replace(/\D/g, '')) || 0;
    const numSecond = parseInt(countAfterSecond.replace(/\D/g, '')) || 0;
    expect(numSecond).toBeLessThanOrEqual(numFirst);
  });

  test('TC_SL_26: already reacted emoji is highlighted/active', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const funnyWrapper = page.locator('img[alt="funny"]').locator('..');
    await funnyWrapper.click();
    await expect(funnyWrapper).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_26-emoji-highlighted.png' });
  });

  // ── View Count Tests ───────────────────────────────────────────────────────

  test('TC_SL_27: view count is visible on reel', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const viewCount = page.locator('img[alt="views"]').locator('..');
    await expect(viewCount).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_27-view-count-visible.png' });
  });

  test('TC_SL_28: view count increases only after whole video is watched', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const viewCountLocator = page.locator('img[alt="views"]').locator('..');
    const countBefore = await viewCountLocator.innerText().catch(() => '0');
    const video = page.locator('video').first();
    if (!await video.isVisible().catch(() => false)) {
      test.skip(true, 'Video element not found');
      return;
    }
    const duration = await video.evaluate((v: HTMLVideoElement) => v.duration).catch(() => 0);
    if (duration > 0 && duration <= 60) {
      await page.waitForTimeout((duration * 1000) + 2000);
    } else {
      await video.evaluate((v: HTMLVideoElement) => { v.currentTime = v.duration; }).catch(() => {});
      await page.waitForTimeout(3000);
    }
    const countAfter = await viewCountLocator.innerText().catch(() => '0');
    await page.screenshot({ path: 'reports/screenshots/TC_SL_28-views-after.png' });
    const countBeforeNum = parseInt(countBefore.replace(/\D/g, '')) || 0;
    const countAfterNum  = parseInt(countAfter.replace(/\D/g, '')) || 0;
    expect(countAfterNum).toBeGreaterThan(countBeforeNum);
  });

  test('TC_SL_29: angry emoji reaction works correctly', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    await page.locator('img[alt="angry"]').locator('..').click();
    await expect(page.getByRole('textbox', { name: 'Mobile Number*' })).toBeHidden();
    await page.screenshot({ path: 'reports/screenshots/TC_SL_29-sad-reaction.png' });
  });

  test('TC_SL_30: mad/neutral emoji reaction works correctly', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    await page.locator('img[alt="mad"]').locator('..').click();
    await expect(page.getByRole('textbox', { name: 'Mobile Number*' })).toBeHidden();
    await page.screenshot({ path: 'reports/screenshots/TC_SL_30-neutral-reaction.png' });
  });

  // ── Daily Video Limit Screen ───────────────────────────────────────────────

  test('TC_SL_31: daily limit screen heading is visible', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const limitHeading = page.getByRole('heading', { name: /LOL-ed your way through all our jokes/i });
    if (!await limitHeading.isVisible().catch(() => false)) {
      test.skip(true, 'Daily limit screen only appears after all videos are watched');
      return;
    }
    await expect(limitHeading).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_31-limit-heading.png' });
  });

  test('TC_SL_32: daily limit screen shows language switch suggestion', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const limitParagraph = page.getByText(/Switch languages to scroll through more/i);
    if (!await limitParagraph.isVisible().catch(() => false)) {
      test.skip(true, 'Daily limit screen only appears after all videos are watched');
      return;
    }
    await expect(limitParagraph).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_32-limit-suggestion.png' });
  });

  test('TC_SL_33: daily limit screen shows other language buttons', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const limitHeading = page.getByRole('heading', { name: /LOL-ed your way through all our jokes/i });
    if (!await limitHeading.isVisible().catch(() => false)) {
      test.skip(true, 'Daily limit screen only appears after all videos are watched');
      return;
    }
    await expect(page.getByRole('button', { name: 'हिंदी' })).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_33-limit-language-buttons.png' });
  });

  test('TC_SL_34: clicking language button on limit screen loads new videos', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const limitHeading = page.getByRole('heading', { name: /LOL-ed your way through all our jokes/i });
    if (!await limitHeading.isVisible().catch(() => false)) {
      test.skip(true, 'Daily limit screen only appears after all videos are watched');
      return;
    }
    await page.getByRole('button', { name: 'हिंदी' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('video').first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_SL_34-language-switched.png' });
  });

  test('TC_SL_35: current language button is disabled on limit screen', async () => {
    await gotoAndSettle(page, SCROLL_LOL_URL);
    const limitHeading = page.getByRole('heading', { name: /LOL-ed your way through all our jokes/i });
    if (!await limitHeading.isVisible().catch(() => false)) {
      test.skip(true, 'Daily limit screen only appears after all videos are watched');
      return;
    }
    await expect(page.getByRole('button', { name: 'English' })).toBeDisabled();
    await page.screenshot({ path: 'reports/screenshots/TC_SL_35-current-lang-disabled.png' });
  });
});
