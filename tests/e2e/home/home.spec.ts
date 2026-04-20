import { test, expect } from '../../../fixtures';
import { USERS } from '../../../data/test-data';

test.describe('Home Page — UI', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(USERS.standard.email, USERS.standard.password);
    await loginPage.assertLoggedIn();
  });

  test('should display welcome heading after login', async ({ homePage }) => {
    await homePage.assertWelcome();
  });

  test('should have correct page title', async ({ homePage }) => {
    const title = await homePage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should logout successfully', async ({ homePage, loginPage }) => {
    await homePage.logout();
    await loginPage.assertOnLoginPage();
  });
});
