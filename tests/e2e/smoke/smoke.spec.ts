import { test, expect } from '../../../fixtures';

const BASE = 'https://sprite-joke-in-a-bottle.coke2home.com';

test.describe('Sprite Joke-In-A-Bottle — Smoke Tests', () => {
  test.use({ baseURL: BASE });

  // ── 1. Page load ────────────────────────────────────────────────────────────
  test.describe('Page Load', () => {
    test('homepage returns 200 and loads without JS errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('domcontentloaded');

      expect(errors).toHaveLength(0);
    });

    test('page title is correct', async ({ spritePage }) => {
      await spritePage.navigate();
      await spritePage.assertPageTitle();
    });

    test('meta viewport is set for mobile', async ({ page }) => {
      await page.goto('/');
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('initial-scale=1');
    });

    test('favicon loads successfully', async ({ page, request }) => {
      await page.goto('/');
      const faviconHref = await page
        .locator('link[rel*="icon"]')
        .first()
        .getAttribute('href');
      expect(faviconHref).toBeTruthy();
    });
  });

  // ── 2. Homepage sections ─────────────────────────────────────────────────────
  test.describe('Homepage Sections', () => {
    test.beforeEach(async ({ spritePage }) => {
      await spritePage.navigate();
      await spritePage.page.waitForLoadState('domcontentloaded');
    });

    test('coming soon / contest banner is visible', async ({ spritePage }) => {
      await spritePage.assertComingSoonBannerVisible();
    });

    test('"Pick Your Mood" section is visible', async ({ spritePage }) => {
      await spritePage.assertMoodSectionVisible();
    });

    test('PJ Challenge section is visible', async ({ spritePage }) => {
      await spritePage.assertPjChallengeSectionVisible();
    });

    test('Joke Box section is visible', async ({ spritePage }) => {
      await spritePage.assertJokeBoxVisible();
    });

    test('"Share a Laugh" section is visible', async ({ spritePage }) => {
      await spritePage.assertShareALaughVisible();
    });
  });

  // ── 3. Navigation ────────────────────────────────────────────────────────────
  test.describe('Navigation', () => {
    test('navigating to /submit-your-joke loads the page (200)', async ({ page }) => {
      const response = await page.goto('/submit-your-joke');
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(/submit-your-joke/);
    });

    test('navigating to /privacy_policy loads the page (200)', async ({ page }) => {
      const response = await page.goto('/privacy_policy');
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(/privacy_policy/);
    });

    test('navigating to /terms_conditions loads the page (200)', async ({ page }) => {
      const response = await page.goto('/terms_conditions');
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(/terms_conditions/);
    });

    test('PJ Challenge submit button navigates to /submit-your-joke', async ({ spritePage }) => {
      await spritePage.navigate();
      await spritePage.clickSubmitJokeButton();
      await expect(spritePage.page).toHaveURL(/submit-your-joke/);
    });

    test('browser back from /submit-your-joke returns to homepage', async ({ page }) => {
      await page.goto('/');
      await page.goto('/submit-your-joke');
      await page.goBack();
      await expect(page).toHaveURL('/');
    });
  });

  // ── 4. Footer ────────────────────────────────────────────────────────────────
  test.describe('Footer', () => {
    test.beforeEach(async ({ spritePage }) => {
      await spritePage.navigate();
      await spritePage.page.waitForLoadState('domcontentloaded');
    });

    test('social media links are present', async ({ spritePage }) => {
      await spritePage.assertSocialLinksPresent();
    });

    test('legal links (privacy policy & terms) are present', async ({ spritePage }) => {
      await spritePage.assertLegalLinksPresent();
    });

    test('Facebook link points to correct URL', async ({ spritePage }) => {
      const href = await spritePage.facebookLink.getAttribute('href');
      expect(href).toContain('facebook.com/sprite');
    });

    test('Instagram link points to correct URL', async ({ spritePage }) => {
      const href = await spritePage.instagramLink.getAttribute('href');
      expect(href).toContain('instagram.com/sprite');
    });

    test('YouTube link points to correct URL', async ({ spritePage }) => {
      const href = await spritePage.youtubeLink.getAttribute('href');
      expect(href).toContain('youtube.com/sprite');
    });
  });

  // ── 5. Auth gate ─────────────────────────────────────────────────────────────
  test.describe('Auth Gate (unauthenticated)', () => {
    test.beforeEach(async ({ spritePage }) => {
      await spritePage.navigate();
      await spritePage.page.waitForLoadState('domcontentloaded');
    });

    test('"Surprise Me" shows login modal for unauthenticated users', async ({ spritePage }) => {
      await spritePage.triggerLoginModal();
      await spritePage.assertLoginModalVisible();
    });
  });

  // ── 6. Static assets ─────────────────────────────────────────────────────────
  test.describe('Static Assets', () => {
    test('no CSS 4xx/5xx errors on homepage', async ({ page }) => {
      const failedAssets: string[] = [];
      page.on('response', (response) => {
        const url = response.url();
        const status = response.status();
        if ((url.endsWith('.css') || url.includes('/_next/static')) && status >= 400) {
          failedAssets.push(`${status} ${url}`);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(failedAssets).toHaveLength(0);
    });

    test('no image 4xx/5xx errors on homepage', async ({ page }) => {
      const failedImages: string[] = [];
      page.on('response', (response) => {
        const url = response.url();
        const status = response.status();
        if (/\.(png|jpg|jpeg|svg|webp)/.test(url) && status >= 400) {
          failedImages.push(`${status} ${url}`);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(failedImages).toHaveLength(0);
    });
  });

  // ── 7. PWA / manifest ────────────────────────────────────────────────────────
  test.describe('PWA', () => {
    test('web app manifest loads successfully', async ({ request }) => {
      const response = await request.get(`${BASE}/manifest.json`);
      expect(response.status()).toBe(200);
      const manifest = await response.json();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('start_url');
    });
  });
});
