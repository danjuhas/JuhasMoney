import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('Login Page Snapshot', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Wait for the main elements to load so the UI is stable
    await expect(page.locator('form')).toBeVisible();
    
    // Slight pause to ensure animations (like focus rings or fade-ins) settle
    await page.waitForTimeout(500);

    // Compare with baseline screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.05 // Allows up to 5% pixel difference to avoid flaky tests
    });
  });

  test('SignUp Page Snapshot', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('form')).toBeVisible();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('signup-page.png', {
      maxDiffPixelRatio: 0.05
    });
  });
});
