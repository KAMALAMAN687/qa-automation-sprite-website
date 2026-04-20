import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { SpritePage } from '../pages/SpritePage';
import { ApiClient } from '../utils/api-client';

type Fixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  spritePage: SpritePage;
  apiClient: ApiClient;
  authenticatedApiClient: ApiClient;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  spritePage: async ({ page }, use) => {
    await use(new SpritePage(page));
  },

  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  authenticatedApiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    const { ENV } = await import('../utils/env');
    await client.login(ENV.TEST_USER_EMAIL, ENV.TEST_USER_PASSWORD);
    await use(client);
  },
});

export { expect };
