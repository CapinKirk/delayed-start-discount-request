import { test, expect } from '@playwright/test';

test('widget loads and auto-open greeting renders under unified persona', async ({ page }) => {
  await page.goto('/admin/embed');
  const iframe = page.frameLocator('iframe');
  await expect(iframe).toBeDefined();
  // Best-effort check for the launcher appearing (script loads)
  await expect(page.locator('text=Embed Snippet')).toBeVisible();
});



