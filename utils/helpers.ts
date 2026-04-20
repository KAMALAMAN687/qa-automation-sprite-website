import { Page } from '@playwright/test';

/**
 * Generate a random string of given length
 */
export function randomString(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate a random email address
 */
export function randomEmail(domain = 'test.com'): string {
  return `test_${randomString(6)}@${domain}`;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Wait for a given number of milliseconds
 */
export async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until a condition function returns true, polling every interval
 */
export async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  timeout = 10000,
  interval = 200
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await wait(interval);
  }
  throw new Error('waitUntil timed out');
}

/**
 * Scroll to bottom of page
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * Clear and type text into a locator
 */
export async function clearAndType(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  await page.locator(selector).clear();
  await page.locator(selector).fill(text);
}
