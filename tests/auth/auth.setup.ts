import { test as setup } from '@playwright/test';
import { ENV } from '../../utils/env';
import * as path from 'path';

const URL  = 'https://sprite-joke-in-a-bottle.coke2home.com';

// All future tests that need login will load this file as their session
export const AUTH_FILE = path.join(__dirname, '../../playwright/.auth/user.json');

setup('AUTH SETUP: login once and save session', async ({ page }) => {

  await page.goto(URL);
  await page.waitForLoadState('domcontentloaded');

  // ── Step 1: Click the "Log in" button in the nav (visible when logged out) ──
  await page.waitForLoadState('networkidle').catch(() => {});
  // Close any intro popup that may be open (e.g. the Surprise Me bottle animation)
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
  // Click the Log in button in the nav
  await page.getByRole('button', { name: 'Log in' }).click();

  // ── Step 2: Wait for phone input to appear ────────────────────────────────
  const phoneInput = page.getByRole('textbox', { name: 'Mobile Number*' });
  await phoneInput.waitFor({ state: 'visible', timeout: 10000 });

  // ── Step 3: Fill phone number from .env ───────────────────────────────────
  await phoneInput.fill(ENV.TEST_PHONE_NUMBER);
  console.log(`📱 Phone number filled: ${ENV.TEST_PHONE_NUMBER}`);

  // ── Step 4: Click Get OTP ─────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Get OTP' }).click();
  console.log('✅ Get OTP clicked — OTP SMS sent to phone');

  // ── Step 5: Wait for OTP input to appear ──────────────────────────────────
  const otpInput = page.locator('input[maxlength="1"]').first()
    .or(page.locator('input[maxlength="6"]'))
    .or(page.getByPlaceholder(/otp|enter code/i));

  await otpInput.waitFor({ state: 'visible', timeout: 15000 });

  // ── Step 6: PAUSE — manually enter OTP in the browser ────────────────────
  // Type the OTP received on your phone, submit it, then click RESUME
  console.log('⏸  PAUSED — Enter the OTP in the browser, submit it, then click Resume');
  await page.pause();

  // ── Step 7: Verify login was successful ───────────────────────────────────
  // Modal should be closed after successful login
  await phoneInput.waitFor({ state: 'hidden', timeout: 30000 });
  console.log('✅ Login successful — modal closed');

  // ── Step 8: Save the full session (cookies + localStorage + sessionStorage)
  await page.context().storageState({ path: AUTH_FILE });
  console.log('💾 Session saved to playwright/.auth/user.json');
  console.log('🎉 All future tests will reuse this login — no OTP needed again!');
});
