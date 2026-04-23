const { test, expect } = require('@playwright/test');

test.describe('App smoke', () => {
  test('loads and redirects to competitions admin', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/#\/admin\/competitions$/);
  });

  test('can navigate to player management', async ({ page }) => {
    await page.goto('/#/admin/players');
    await expect(page).toHaveURL(/#\/admin\/players$/);
  });

  test('organizations API responds', async ({ request }) => {
    const res = await request.get('/api/v1/organizations');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });
});
