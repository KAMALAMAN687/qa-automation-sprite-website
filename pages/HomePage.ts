import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Locators
  private readonly navLinks = () => this.page.locator('nav a');
  private readonly welcomeHeading = () => this.page.getByRole('heading').first();
  private readonly logoutButton = () =>
    this.page.getByRole('button', { name: /logout|sign out/i }).or(
      this.page.getByRole('link', { name: /logout|sign out/i })
    );

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/');
  }

  async assertWelcome(userName?: string) {
    await expect(this.welcomeHeading()).toBeVisible();
    if (userName) {
      await expect(this.welcomeHeading()).toContainText(userName);
    }
  }

  async navigateTo(section: string) {
    await this.navLinks().filter({ hasText: section }).click();
    await this.waitForLoad();
  }

  async logout() {
    await this.logoutButton().click();
    await this.waitForLoad();
  }

  async assertNavContains(linkText: string) {
    await expect(this.navLinks().filter({ hasText: linkText })).toBeVisible();
  }
}
