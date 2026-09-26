import { test, expect } from '@playwright/test';

test.describe('Credit Card Flow', () => {
  test('should create a card, add a 3x installment expense, and verify dashboard', async ({ page }) => {
    // Inject mock user to bypass onboarding
    await page.addInitScript(() => {
      window.localStorage.setItem('juhas_mock_user', JSON.stringify({ id: 'test-user', name: 'Test', email: 'test@test.com' }));
    });
    
    await page.goto('/');

    // Navigate to Settings/Cards
    await page.click('text=Ajustes');
    await page.click('text=Novo Cartão');
    
    // Fill Card Form
    await page.fill('input[placeholder*="Nubank"]', 'Test Card');
    await page.fill('text=Dia de Fechamento >> xpath=../input', '25');
    await page.fill('text=Dia de Vencimento >> xpath=../input', '5');
    await page.click('button:has-text("Salvar")');

    // Go to dashboard to add expense (the button is usually there or floating)
    await page.click('text=Visão Geral');
    
    // Add Expense
    await page.click('button[aria-label="Nova transação"]');
    await page.click('text=Cartão de Crédito');
    
    await page.fill('input[placeholder*="Mercado"]', 'Test Installment');
    await page.fill('input[placeholder="R$ 0,00"]', '30000'); // 300.00
    
    // Select Card
    await page.selectOption('select', { label: 'Test Card' });
    
    // Set Installments
    await page.fill('input[type="number"]', '3'); // 3x
    await page.click('button:has-text("Salvar")');

    // Verify current month bill
    await expect(page.locator('text=Test Card')).toBeVisible({ timeout: 10000 });
  });
});
