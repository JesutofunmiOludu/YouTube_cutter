import { test, expect } from '@playwright/test';

test('Homepage should load successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/VidMind AI/);
});

test('Homepage should have hero section', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Stop watching. Start understanding./i })).toBeVisible();
});

test('Homepage should have a link to the About page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /About/i })).toBeVisible();
});