import { test, expect } from '../../../fixtures';
import { Page } from '@playwright/test';
import { ENV } from '../../../utils/env';
import * as path from 'path';

const URL = 'https://sprite-joke-in-a-bottle.coke2home.com';
const PHONE = ENV.TEST_PHONE_NUMBER;
const AUTH_FILE = path.join(__dirname, '../../../playwright/.auth/user.json');

test.describe.configure({ mode: 'serial' });

test.describe('Group 5 — Login / Auth Modal', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // TC_AUTH_01 — Login modal opens when unauthenticated user clicks Surprise Me
  test('TC_AUTH_01: login modal opens on Surprise Me click', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button').nth(1).click();

    await expect(page.getByRole('textbox', { name: 'Mobile Number*' })).toBeVisible({ timeout: 8000 });
  });

  // TC_AUTH_02 — Login modal has phone number input field
  test('TC_AUTH_02: login modal has phone number input field', async () => {
    await expect(page.getByRole('textbox', { name: 'Mobile Number*' })).toBeVisible();
  });

  // TC_AUTH_03 — Login modal has Get OTP button
  test('TC_AUTH_03: login modal has Get OTP button', async () => {
    await expect(page.getByRole('button', { name: 'Get OTP' })).toBeVisible();
  });

  // TC_AUTH_04 — Get OTP button is disabled when phone number is empty
  test('TC_AUTH_04: Get OTP button is disabled when phone number is empty', async () => {
    await page.getByRole('textbox', { name: 'Mobile Number*' }).clear();

    const getOtpBtn = page.getByRole('button', { name: 'Get OTP' });
    await getOtpBtn.click();
    await page.waitForTimeout(1000);

    const isDisabled = await getOtpBtn.isDisabled().catch(() => false);
    const errorVisible = await page.locator('[class*="error"], [role="alert"]').first().isVisible().catch(() => false);

    expect(isDisabled || errorVisible).toBeTruthy();
  });

  // TC_AUTH_05 — Phone number field accepts numeric input
  test('TC_AUTH_05: phone number field accepts numeric input', async () => {
    const phoneInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await phoneInput.clear();
    await phoneInput.fill(PHONE);
    const value = await phoneInput.inputValue();
    expect(value).toBe(PHONE);
  });

  // TC_AUTH_06 — Phone number field rejects alphabets
  test('TC_AUTH_06: phone number field rejects alphabets', async () => {
    const phoneInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await phoneInput.clear();
    await phoneInput.fill('abcdefghij');
    const value = await phoneInput.inputValue();
    expect(value.replace(/\d/g, '')).toBe('');
  });

  // TC_AUTH_07 — Error shown for phone number less than 10 digits
  test('TC_AUTH_07: shows error for phone number less than 10 digits', async () => {
    const phoneInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await phoneInput.clear();
    await phoneInput.fill('12345');

    await page.getByRole('button', { name: 'Get OTP' }).click();
    await page.waitForTimeout(1000);

    const isDisabled = await page.getByRole('button', { name: 'Get OTP' }).isDisabled().catch(() => false);
    const errorVisible = await page.locator('[class*="error"], [role="alert"]').first().isVisible().catch(() => false);

    expect(isDisabled || errorVisible).toBeTruthy();
  });

  // TC_AUTH_08 — Phone number field has correct label
  test('TC_AUTH_08: phone number field has correct label', async () => {
    await expect(page.getByRole('textbox', { name: 'Mobile Number*' })).toBeVisible();
  });

  // TC_AUTH_09 — Get OTP button is enabled with valid 10-digit number
  test('TC_AUTH_09: Get OTP button is enabled with valid 10 digit number', async () => {
    const phoneInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await phoneInput.clear();
    await phoneInput.fill(PHONE);

    await expect(page.getByRole('button', { name: 'Get OTP' })).toBeEnabled();
  });

  // TC_AUTH_10 — Full OTP login flow via Profile → Log in → OTP (manual entry)
  test('TC_AUTH_10: full OTP login flow with manual entry', async () => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');

    // ── Screenshot 1: Homepage before login ───────────────────────────────────
    await page.screenshot({ path: 'reports/screenshots/TC_AUTH_10-01-homepage.png', fullPage: true });

    // ── Step 1: Click Profile icon ────────────────────────────────────────────
    await page.getByRole('img', { name: 'Profile Image' }).click();

    // ── Step 2: Click Log in button ───────────────────────────────────────────
    await page.getByRole('button', { name: 'Log in' }).click();

    // ── Step 3: Wait for phone number input to appear ─────────────────────────
    const phoneInput = page.getByRole('textbox', { name: 'Mobile Number*' });
    await phoneInput.waitFor({ state: 'visible', timeout: 10000 });

    // ── Screenshot 2: Login modal opened ─────────────────────────────────────
    await page.screenshot({ path: 'reports/screenshots/TC_AUTH_10-02-login-modal.png' });

    // ── Step 4: Fill phone number from .env ───────────────────────────────────
    await phoneInput.fill(PHONE);
    console.log(`📱 Phone number filled: ${PHONE}`);

    // ── Step 5: Click Get OTP ─────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Get OTP' }).click();
    console.log('✅ Get OTP clicked — OTP SMS sent');

    // ── Screenshot 3: After clicking Get OTP ──────────────────────────────────
    await page.screenshot({ path: 'reports/screenshots/TC_AUTH_10-03-otp-sent.png' });

    // ── Step 6: Wait for OTP input to appear ──────────────────────────────────
    const otpInput = page.locator('input[maxlength="1"]').first()
      .or(page.locator('input[maxlength="6"]'))
      .or(page.getByPlaceholder(/otp|enter code/i));

    await otpInput.waitFor({ state: 'visible', timeout: 15000 });
    expect(await otpInput.isVisible()).toBeTruthy();

    // ── Screenshot 4: OTP input appeared ──────────────────────────────────────
    await page.screenshot({ path: 'reports/screenshots/TC_AUTH_10-04-otp-input.png' });

    // ── Step 7: PAUSE — enter OTP manually in browser ────────────────────────
    console.log('⏸  Enter OTP in the browser → Submit → click ▶ Resume');
    await page.pause();

    // ── Step 8: Verify login success ──────────────────────────────────────────
    await phoneInput.waitFor({ state: 'hidden', timeout: 30000 });
    console.log('✅ Login successful');

    // ── Screenshot 5: After successful login ──────────────────────────────────
    await page.screenshot({ path: 'reports/screenshots/TC_AUTH_10-05-logged-in.png', fullPage: true });

    // ── Step 9: Save auth token/session for all future test cases ─────────────
    await page.context().storageState({ path: AUTH_FILE });
    console.log('💾 Auth session saved — all Phase 3 tests will reuse this login');
  });

});
