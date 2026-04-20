import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators
  private readonly emailInput = () => this.page.getByLabel(/email/i).or(this.page.locator('[name="email"]'));
  private readonly passwordInput = () => this.page.getByLabel(/password/i).or(this.page.locator('[name="password"]'));
  private readonly submitButton = () => this.page.getByRole('button', { name: /sign in|log in|login/i });
  private readonly errorMessage = () => this.page.locator('[data-testid="error-message"], .error-message, [role="alert"]');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
    await this.waitForLoad();
  }

  async assertLoggedIn() {
    await expect(this.page).not.toHaveURL(/login/i);
  }

  async assertLoginError(message?: string) {
    const error = this.errorMessage();
    await expect(error).toBeVisible();
    if (message) {
      await expect(error).toContainText(message);
    }
  }

  async assertOnLoginPage() {
    await expect(this.page).toHaveURL(/login/i);
  }
}
