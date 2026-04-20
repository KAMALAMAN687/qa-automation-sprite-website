/**
 * Diagnostic script — finds the daily limit screen selectors on Scroll and Lol page.
 * Run: npx ts-node tests/diagnostic/find-limit-screen.ts
 * Or:  npx playwright test tests/diagnostic/find-limit-screen.ts --project=phase3-authenticated
 */

import { test } from '../../fixtures';

const SCROLL_LOL_URL = 'https://sprite-joke-in-a-bottle.coke2home.com/scroll-and-lol';

test('diagnostic: find daily limit screen text and selectors', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: 'playwright/.auth/user.json',
  });
  const page = await context.newPage();

  await page.goto(SCROLL_LOL_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // ── Full page screenshot ──────────────────────────────────────────────────
  await page.screenshot({
    path: 'reports/screenshots/DIAG-scroll-lol-fullpage.png',
    fullPage: true,
  });
  console.log('📸 Full page screenshot saved.');

  // ── Dump ALL visible text on the page ────────────────────────────────────
  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
    );
    const texts: string[] = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && text.length > 2) {
        texts.push(text);
      }
    }
    return texts;
  });

  console.log('\n══ ALL VISIBLE TEXT ON PAGE ══');
  allText.forEach((t) => console.log(' •', t));

  // ── Look for limit-related keywords ──────────────────────────────────────
  const limitKeywords = ['limit', 'daily', 'quota', 'come back', 'tomorrow', 'maximum', 'watched', 'videos today', 'try again'];
  console.log('\n══ LIMIT-RELATED TEXT ══');
  allText
    .filter((t) => limitKeywords.some((k) => t.toLowerCase().includes(k)))
    .forEach((t) => console.log(' ✅', t));

  // ── Dump elements that contain limit-related text ─────────────────────────
  const limitElements = await page.evaluate(() => {
    const keywords = ['limit', 'daily', 'quota', 'come back', 'tomorrow', 'maximum', 'watched', 'videos today'];
    const results: { tag: string; class: string; id: string; text: string }[] = [];

    document.querySelectorAll('*').forEach((el) => {
      const text = el.textContent?.trim() || '';
      if (keywords.some((k) => text.toLowerCase().includes(k)) && text.length < 300) {
        results.push({
          tag: el.tagName.toLowerCase(),
          class: el.className || '',
          id: el.id || '',
          text: text.substring(0, 100),
        });
      }
    });
    return results.slice(0, 20); // limit to first 20 matches
  });

  console.log('\n══ DOM ELEMENTS WITH LIMIT TEXT ══');
  limitElements.forEach((el) => {
    console.log(`\n  Tag:   ${el.tag}`);
    console.log(`  Class: ${el.class}`);
    console.log(`  ID:    ${el.id}`);
    console.log(`  Text:  ${el.text}`);
  });

  // ── Check for overlay/screen elements ────────────────────────────────────
  const overlayElements = await page.evaluate(() => {
    const results: { tag: string; class: string; id: string }[] = [];
    document.querySelectorAll('[class*="overlay"], [class*="limit"], [class*="empty"], [class*="no-more"], [class*="end"], [class*="quota"]').forEach((el) => {
      results.push({
        tag: el.tagName.toLowerCase(),
        class: el.className || '',
        id: el.id || '',
      });
    });
    return results;
  });

  console.log('\n══ OVERLAY / LIMIT-CLASS ELEMENTS ══');
  overlayElements.forEach((el) => {
    console.log(`  Tag: ${el.tag} | Class: ${el.class} | ID: ${el.id}`);
  });

  await context.close();
});