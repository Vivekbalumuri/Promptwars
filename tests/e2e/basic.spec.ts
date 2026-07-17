import { test, expect } from '@playwright/test';

test('homepage loads and contains header', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page.locator('text=FACILITIES MANAGEMENT OPERATIONS SYSTEM CONTROLLER')).toBeVisible();
});
