import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Dashboard', () => {
  test('Dashboard and Modals Snapshot (Real Account)', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');
    
    // 2. Perform real login
    await page.fill('input[type="email"]', 'danilojuhas+3@gmail.com');
    await page.fill('input[type="password"]', 'Test@123');
    await page.click('button[type="submit"]');

    // 3. Wait to arrive at Dashboard
    // We can wait for the header greeting which indicates successful auth
    // We can wait for the header which indicates successful auth
    await expect(page.locator('header').first()).toBeVisible({ timeout: 15000 });
    
    // Wait a little bit extra for Supabase requests to finish and charts to render
    await page.waitForTimeout(2000);

    // 4. Snapshot Dashboard
    await expect(page).toHaveScreenshot('dashboard-list.png', {
      maxDiffPixelRatio: 0.05
    });

    // 5. Open FAB menu
    await page.locator('.fixed.right-6 button').last().click();
    await page.waitForTimeout(500);

    // 6. Click Nova Despesa
    await page.getByText('Nova Despesa').click();
    await page.waitForTimeout(500);

    // Snapshot Transaction Modal
    await expect(page.locator('.fixed.inset-0.z-\\[70\\]').first()).toHaveScreenshot('transaction-modal.png', {
      maxDiffPixelRatio: 0.05
    });

    // 7. Close Modal
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.waitForTimeout(500);

    // 8. Open FAB menu again
    await page.locator('.fixed.right-6 button').last().click();
    await page.waitForTimeout(500);

    // 9. Click Novo Gasto Cartão
    await page.getByRole('button', { name: 'Compra no Cartão' }).click();
    await page.waitForTimeout(500);

    // Snapshot Credit Card Modal
    await expect(page.locator('.fixed.inset-0.z-\\[70\\]').first()).toHaveScreenshot('credit-card-modal.png', {
      maxDiffPixelRatio: 0.05
    });
  });
});
