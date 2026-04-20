import { test } from '../../fixtures';

const PROFILE_URL = 'https://sprite-joke-in-a-bottle.coke2home.com/profile';

test('DIAG: dump modal buttons and referrals section HTML', async ({ browser }) => {
  const context = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
  const page    = await context.newPage();

  await page.goto(PROFILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // ── Open the Refer Another modal ──────────────────────────────────────────
  const section = page.locator('text=/My Referrals/i').first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const referBtn = page.locator('text=/Refer Another/i').first();
  await referBtn.click();
  await page.waitForTimeout(1500);

  const dialog = page.locator('[role="dialog"][data-state="open"]').first();
  const dialogText = await dialog.innerText({ timeout: 5000 }).catch(() => 'NO DIALOG TEXT');

  console.log('\n══ DIALOG INNER TEXT ══');
  console.log(dialogText);

  // Dump every button inside the dialog
  const buttons = await dialog.locator('button').all();
  console.log(`\n══ ${buttons.length} BUTTON(S) IN DIALOG ══`);
  for (let i = 0; i < buttons.length; i++) {
    const txt  = await buttons[i].innerText().catch(() => '');
    const aria = await buttons[i].getAttribute('aria-label').catch(() => '');
    const dis  = await buttons[i].isDisabled().catch(() => false);
    const cls  = (await buttons[i].getAttribute('class').catch(() => ''))?.substring(0, 80);
    console.log(`  [${i}] text="${txt}"  aria-label="${aria}"  disabled=${dis}  class="${cls}"`);
  }

  await page.screenshot({ path: 'reports/screenshots/DIAG-modal.png' });

  // ── Close modal and dump My Referrals section HTML ────────────────────────
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.goto(PROFILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const refSection = page.locator('text=/My Referrals/i').first();
  await refSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Walk up 3 levels to get the whole section container
  const refContainer = refSection.locator('..').locator('..').locator('..');
  const refHTML = await refContainer.innerHTML({ timeout: 5000 }).catch(() => 'N/A');
  console.log('\n══ MY REFERRALS SECTION HTML (first 3000 chars) ══');
  console.log(refHTML.substring(0, 3000));

  await page.screenshot({ path: 'reports/screenshots/DIAG-referrals-section.png', fullPage: true });
  await context.close();
});
