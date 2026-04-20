import { test, expect } from '../../../fixtures';
import { Browser, Page } from '@playwright/test';

const URL = 'https://sprite-joke-in-a-bottle.coke2home.com';

// Serial mode = tests run one after another in the SAME browser
test.describe.configure({ mode: 'serial' });

test.describe('Group 1 — Page Load & Performance', () => {
  let page: Page;

  // Open ONE browser page before all tests
  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    page = await browser.newPage();
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
  });

  // Close the browser page after all tests in this group are done
  test.afterAll(async () => {
    await page.close();
  });

  // TC_01 — Homepage returns HTTP 200
  test('TC_01: homepage returns HTTP 200', async () => {
    const response = await page.goto(URL);
    expect(response?.status()).toBe(200);
  });

  // TC_02 — Page title is correct
  test('TC_02: page title is correct', async () => {
    await expect(page).toHaveTitle('Sprite Joke-In-A-Bottle | Scan Karo, Joke Suno, Thand Rakho');
  });

  // TC_03 — Page has no uncaught JavaScript errors
  test('TC_03: page has no uncaught JavaScript errors', async () => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  // TC_04 — Page fully loads within 10 seconds
  test('TC_04: page fully loads within 10 seconds', async () => {
    const start = Date.now();
    await page.goto(URL);
    await page.waitForLoadState('load');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  });

  // TC_05 — Favicon is present in the HTML
  test('TC_05: favicon link tag is present', async () => {
    const favicon = page.locator('link[rel*="icon"]').first();
    await expect(favicon).toHaveCount(1);
  });

  // TC_06 — Meta viewport tag is set (mobile-ready)
  test('TC_06: meta viewport tag is set for mobile', async () => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('initial-scale=1');
  });

  // TC_07 — Meta description tag is present
  test('TC_07: meta description tag is present', async () => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
  });

  // TC_08 — Page body is not empty
  test('TC_08: page body renders content (not blank)', async () => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  // TC_09 — URL is correct after load
  test('TC_09: URL stays on homepage after load', async () => {
    expect(page.url()).toContain('sprite-joke-in-a-bottle.coke2home.com');
  });

  // TC_10 — Surprise Me modal/login screen appears on clicking first button (unauthenticated)
  test('TC_10: Surprise Me shows login modal for unauthenticated users', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button').first().click();
    const modal = page.locator('[role="dialog"]').or(page.locator('.modal, [class*="modal"]')).first();
    await expect(modal).toBeVisible({ timeout: 8000 });
  });

  // TC_11 — Scroll and explore page sections
  test('TC_11: scroll through homepage sections', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Verify page is still loaded correctly
    expect(page.url()).toContain('sprite-joke-in-a-bottle.coke2home.com');
  });

  // TC_12 — Language switcher is present on desktop
  test('TC_12: language switcher dropdown is present', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    const langSwitcher = page.locator('#language-element-desktop');
    await expect(langSwitcher).toBeVisible();
  });
});
