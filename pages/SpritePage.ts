import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SpritePage extends BasePage {
  // ── Page title ──────────────────────────────────────────────────────────────
  readonly expectedTitle = 'Sprite Joke-In-A-Bottle | Scan Karo, Joke Suno, Thand Rakho';

  // ── Section locators ────────────────────────────────────────────────────────
  readonly comingSoonBanner: Locator;
  readonly moodSection: Locator;
  readonly pjChallengeSection: Locator;
  readonly jokeBoxSection: Locator;
  readonly shareALaughSection: Locator;

  // ── Interactive elements ─────────────────────────────────────────────────────
  readonly submitJokeBtn: Locator;
  readonly surpriseMeBtn: Locator;
  readonly loginModal: Locator;
  readonly languageSwitcher: Locator;

  // ── Footer social links ──────────────────────────────────────────────────────
  readonly facebookLink: Locator;
  readonly instagramLink: Locator;
  readonly youtubeLink: Locator;

  // ── Footer legal links ───────────────────────────────────────────────────────
  readonly privacyPolicyLink: Locator;
  readonly termsLink: Locator;

  // ── Reaction buttons ─────────────────────────────────────────────────────────
  readonly reactionButtons: Locator;

  constructor(page: Page) {
    super(page);

    this.comingSoonBanner = page.locator('text=/COMING SOON|CONTEST IS OVER/i').first();

    // Mood section — matches heading or carousel wrapper
    this.moodSection = page
      .locator('text=/Select Mood|Pick Your Mood|Scroll and Lol/i')
      .first();

    // PJ Challenge section
    this.pjChallengeSection = page
      .locator('text=/PJ Challenge|Submit.*Joke|pjChallenge/i')
      .first();

    // Joke Box
    this.jokeBoxSection = page.locator('text=/Joke Box|JokeBox/i').first();

    // Share a Laugh
    this.shareALaughSection = page.locator('text=/Share a Laugh/i').first();

    // CTA buttons
    this.submitJokeBtn = page
      .getByRole('button', { name: /Submit.*Joke|Joke Submit/i })
      .or(page.getByRole('link', { name: /Submit.*Joke/i }))
      .first();

    this.surpriseMeBtn = page
      .getByRole('button', { name: /Surprise Me/i })
      .or(page.locator('text=/Surprise Me/i'))
      .first();

    // Login modal — shown when unauthenticated user triggers a protected action
    this.loginModal = page
      .locator('[role="dialog"]')
      .or(page.locator('.modal, [class*="modal"], [class*="login"]'))
      .first();

    // Language switcher
    this.languageSwitcher = page
      .locator('text=/English|Hindi|Kannada|ENGLISH|HINDI/i')
      .first();

    // Social links
    this.facebookLink = page.locator('a[href*="facebook.com/sprite"]');
    this.instagramLink = page.locator('a[href*="instagram.com/sprite"]');
    this.youtubeLink = page.locator('a[href*="youtube.com/sprite"]');

    // Legal links
    this.privacyPolicyLink = page.locator('a[href*="privacy_policy"]');
    this.termsLink = page.locator('a[href*="terms_conditions"]');

    // Reaction buttons (laugh / neutral / sad emojis on joke cards)
    this.reactionButtons = page.locator('[class*="reaction"], [class*="emoji"], [aria-label*="laugh"], [aria-label*="react"]');
  }

  async navigate() {
    await this.goto('/');
  }

  async assertPageTitle() {
    await expect(this.page).toHaveTitle(this.expectedTitle);
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL('/');
    await this.page.waitForLoadState('domcontentloaded');
    // Ensure no uncaught Next.js error overlay
    const errorOverlay = this.page.locator('#__next-build-watcher, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  }

  async assertComingSoonBannerVisible() {
    await expect(this.comingSoonBanner).toBeVisible();
  }

  async assertMoodSectionVisible() {
    await expect(this.moodSection).toBeVisible();
  }

  async assertPjChallengeSectionVisible() {
    await expect(this.pjChallengeSection).toBeVisible();
  }

  async assertJokeBoxVisible() {
    await expect(this.jokeBoxSection).toBeVisible();
  }

  async assertShareALaughVisible() {
    await expect(this.shareALaughSection).toBeVisible();
  }

  async assertSocialLinksPresent() {
    await expect(this.facebookLink).toBeVisible();
    await expect(this.instagramLink).toBeVisible();
    await expect(this.youtubeLink).toBeVisible();
  }

  async assertLegalLinksPresent() {
    await expect(this.privacyPolicyLink).toBeVisible();
    await expect(this.termsLink).toBeVisible();
  }

  async clickSubmitJokeButton() {
    await this.submitJokeBtn.click();
    await this.waitForLoad();
  }

  async triggerLoginModal() {
    // "Surprise Me" requires auth — clicking it should surface the login modal
    await this.surpriseMeBtn.click();
  }

  async assertLoginModalVisible() {
    await expect(this.loginModal).toBeVisible({ timeout: 8000 });
  }

  async assertLoginModalNotVisible() {
    await expect(this.loginModal).toBeHidden();
  }
}
