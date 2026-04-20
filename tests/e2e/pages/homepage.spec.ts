import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';

const URL = 'https://sprite-joke-in-a-bottle.coke2home.com';

test.describe.configure({ mode: 'serial' });

test.describe('Homepage — All Sections', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Load saved login session
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    page = await context.newPage();
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // ── Page Load ──────────────────────────────────────────────────────────────

  // TC_HP_01 — Homepage loads successfully
  test('TC_HP_01: homepage loads with status 200', async () => {
    const response = await page.goto(URL);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: 'reports/screenshots/TC_HP_01-homepage-loaded.png', fullPage: true });
  });

  // TC_HP_02 — Page title is correct
  test('TC_HP_02: page title is correct', async () => {
    await expect(page).toHaveTitle('Sprite Joke-In-A-Bottle | Scan Karo, Joke Suno, Thand Rakho');
  });

  // TC_HP_03 — User is logged in (profile icon visible)
  test('TC_HP_03: user is logged in after session restore', async () => {
    const profileImg = page.getByRole('img', { name: 'Profile Image' });
    await expect(profileImg).toBeVisible();
    await page.screenshot({ path: 'reports/screenshots/TC_HP_03-logged-in.png' });
  });

  // ── Coming Soon Banner ─────────────────────────────────────────────────────

  // TC_HP_04 — Coming Soon banner is visible
  test('TC_HP_04: coming soon banner is visible', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    const banner = page.locator('text=/COMING SOON|CONTEST IS OVER|EXCITING NEW REWARDS/i').first();
    await expect(banner).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_04-coming-soon-banner.png' });
  });

  // ── Carousel Section ───────────────────────────────────────────────────────

  // TC_HP_05 — Carousel slide buttons are present
  test('TC_HP_05: carousel slide buttons are present', async () => {
    const slideButtons = page.getByRole('button', { name: 'Go to slide' });
    const count = await slideButtons.count();
    expect(count).toBeGreaterThan(0);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_05-carousel-buttons.png' });
  });

  // TC_HP_06 — First carousel slide button is clickable
  test('TC_HP_06: first carousel slide button is clickable', async () => {
    const firstSlideBtn = page.getByRole('button', { name: 'Go to slide' }).first();
    await expect(firstSlideBtn).toBeVisible();
    await firstSlideBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_06-carousel-slide-1.png' });
  });

  // TC_HP_07 — Second carousel slide button is clickable
  test('TC_HP_07: second carousel slide button is clickable', async () => {
    const secondSlideBtn = page.getByRole('button', { name: 'Go to slide' }).nth(1);
    await expect(secondSlideBtn).toBeVisible();
    await secondSlideBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_07-carousel-slide-2.png' });
  });

  // TC_HP_08 — Carousel navigates back to first slide
  test('TC_HP_08: carousel navigates back to first slide', async () => {
    await page.getByRole('button', { name: 'Go to slide' }).nth(1).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Go to slide' }).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_08-carousel-back-to-first.png' });
  });

  // TC_HP_09 — Carousel cycles through all slides
  test('TC_HP_09: carousel cycles through all slides', async () => {
    const slideButtons = page.getByRole('button', { name: 'Go to slide' });
    const count = await slideButtons.count();

    for (let i = 0; i < count; i++) {
      await slideButtons.nth(i).click();
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: 'reports/screenshots/TC_HP_09-carousel-all-slides.png' });
  });

  // ── Pick Your Mood Section ─────────────────────────────────────────────────

  // TC_HP_10 — Mood section is visible
  test('TC_HP_10: Pick Your Mood section is visible', async () => {
    const moodSection = page.locator('text=/Select Mood|Pick Your Mood|Scroll and Lol/i').first();
    await expect(moodSection).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_10-mood-section.png' });
  });

  // TC_HP_11 — Mood carousel items are visible
  test('TC_HP_11: mood carousel items are visible', async () => {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    const moodSection = page.locator('text=/Select Mood|Pick Your Mood|Scroll and Lol/i').first();
    await expect(moodSection).toBeVisible();
    await page.screenshot({ path: 'reports/screenshots/TC_HP_11-mood-items.png' });
  });

  // ── PJ Challenge Section ───────────────────────────────────────────────────

  // TC_HP_12 — PJ Challenge section is visible
  test('TC_HP_12: PJ Challenge section is visible', async () => {
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1000);
    const pjSection = page.locator('text=/PJ Challenge|Submit.*Joke/i').first();
    await expect(pjSection).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_12-pj-challenge.png' });
  });

  // TC_HP_13 — Submit Your Joke button is visible
  test('TC_HP_13: Submit Your Joke button is visible', async () => {
    const submitBtn = page
      .getByRole('button', { name: /submit.*joke|submit your joke/i })
      .or(page.getByRole('link', { name: /submit.*joke/i }))
      .first();
    await expect(submitBtn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_13-submit-joke-btn.png' });
  });

  // TC_HP_14 — Submit Your Joke button navigates to correct page
  test('TC_HP_14: Submit Your Joke button navigates to /submit-your-joke', async () => {
    const submitBtn = page
      .getByRole('button', { name: /submit.*joke|submit your joke/i })
      .or(page.getByRole('link', { name: /submit.*joke/i }))
      .first();
    await submitBtn.click();
    await expect(page).toHaveURL(/submit-your-joke/, { timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_14-navigate-submit-joke.png' });
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
  });

  // ── Joke Box Section ───────────────────────────────────────────────────────

  // TC_HP_15 — Joke Box section is visible
  test('TC_HP_15: Joke Box section is visible', async () => {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1000);
    const jokeBox = page.locator('text=/Joke Box|JokeBox/i').first();
    await expect(jokeBox).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_15-joke-box.png' });
  });

  // TC_HP_16 — Joke cards are visible in Joke Box
  test('TC_HP_16: joke cards are visible in Joke Box', async () => {
    const jokeCard = page.locator('[class*="joke"], [class*="card"]').first();
    await expect(jokeCard).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_16-joke-cards.png' });
  });

  // TC_HP_17 — Reaction buttons are visible on joke cards
  test('TC_HP_17: reaction buttons are visible on joke cards', async () => {
    const reactionBtn = page
      .locator('[class*="reaction"], [class*="emoji"], [aria-label*="laugh"], [aria-label*="react"]')
      .first();
    await expect(reactionBtn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_17-reaction-buttons.png' });
  });

  // TC_HP_18 — Reaction button click works when logged in
  test('TC_HP_18: reaction button is clickable when logged in', async () => {
    const reactionBtn = page
      .locator('[class*="reaction"], [class*="emoji"], [aria-label*="laugh"], [aria-label*="react"]')
      .first();
    await reactionBtn.click();
    await page.waitForTimeout(1000);
    // Logged in user should NOT see login modal
    const modal = page.getByRole('textbox', { name: 'Mobile Number*' });
    await expect(modal).toBeHidden();
    await page.screenshot({ path: 'reports/screenshots/TC_HP_18-reaction-clicked.png' });
  });

  // ── Share a Laugh Section ──────────────────────────────────────────────────

  // TC_HP_19 — Share a Laugh section is visible
  test('TC_HP_19: Share a Laugh section is visible', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const shareSection = page.locator('text=/Share a Laugh/i').first();
    await expect(shareSection).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_19-share-a-laugh.png' });
  });

  // ── Surprise Me ───────────────────────────────────────────────────────────

  // TC_HP_20 — Surprise Me button is visible
  test('TC_HP_20: Surprise Me button is visible', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    const surpriseBtn = page.locator('text=/Surprise Me/i').first();
    await expect(surpriseBtn).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_20-surprise-me-btn.png' });
  });

  // TC_HP_21 — Surprise Me does NOT show login modal when logged in
  test('TC_HP_21: Surprise Me does not show login modal when already logged in', async () => {
    const surpriseBtn = page.locator('text=/Surprise Me/i').first();
    await surpriseBtn.click();
    await page.waitForTimeout(1500);
    const loginInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await expect(loginInput).toBeHidden();
    await page.screenshot({ path: 'reports/screenshots/TC_HP_21-surprise-me-logged-in.png' });
  });

  // ── Scroll Behaviour ──────────────────────────────────────────────────────

  // TC_HP_22 — Page scrolls smoothly from top to bottom
  test('TC_HP_22: page scrolls smoothly top to bottom', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_22-scroll-bottom.png', fullPage: false });
  });

  // TC_HP_23 — Page scrolls back to top
  test('TC_HP_23: page scrolls back to top', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_23-scroll-top.png' });
  });

  // ── Language Switcher ──────────────────────────────────────────────────────

  // TC_HP_24 — Language switcher is visible on homepage
  test('TC_HP_24: language switcher is visible', async () => {
    const langSwitcher = page.locator('#language-element-desktop')
      .or(page.locator('text=/English|Hindi|ENGLISH|HINDI/i').first());
    await expect(langSwitcher).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'reports/screenshots/TC_HP_24-language-switcher.png' });
  });

  // TC_HP_25 — All homepage sections load without console errors
  test('TC_HP_25: no console errors on homepage', async () => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
    await page.screenshot({ path: 'reports/screenshots/TC_HP_25-no-errors.png', fullPage: true });
  });
});
