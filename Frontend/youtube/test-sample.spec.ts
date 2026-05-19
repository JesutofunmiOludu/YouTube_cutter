import { test, expect } from '@playwright/test';

test('sample test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/VidMind AI/);
});