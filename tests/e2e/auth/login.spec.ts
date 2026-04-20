import { test, expect } from '../../../fixtures';
import { USERS } from '../../../data/test-data';

test.describe('Login — UI', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('should login successfully with valid credentials', async ({ loginPage }) => {
    await loginPage.login(USERS.standard.email, USERS.standard.password);
    await loginPage.assertLoggedIn();
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login(USERS.invalid.email, USERS.invalid.password);
    await loginPage.assertLoginError();
    await loginPage.assertOnLoginPage();
  });

  test('should remain on login page after failed attempt', async ({ loginPage }) => {
    await loginPage.login('', '');
    await loginPage.assertOnLoginPage();
  });
});
