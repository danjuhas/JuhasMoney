# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: creditCardFlow.spec.ts >> Credit Card Flow >> should create a card, add a 3x installment expense, and verify dashboard
- Location: tests/e2e/creditCardFlow.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Ajustes')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "JuhasMoney" [level=2] [ref=e8]
    - paragraph [ref=e9]: O seu controle financeiro simples e direto.
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: E-mail
        - textbox "seu@email.com" [ref=e16]
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Senha
          - button "Esqueceu a senha?" [ref=e20]
        - textbox "Sua senha" [ref=e22]
      - button "Entrar" [ref=e24]
    - generic [ref=e25]:
      - generic [ref=e26]: Primeira vez aqui?
      - link "Crie sua conta" [ref=e32] [cursor=pointer]:
        - /url: /signup
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Credit Card Flow', () => {
  4  |   test('should create a card, add a 3x installment expense, and verify dashboard', async ({ page }) => {
  5  |     // Inject mock user to bypass onboarding
  6  |     await page.addInitScript(() => {
  7  |       window.localStorage.setItem('juhas_mock_user', JSON.stringify({ id: 'test-user', name: 'Test', email: 'test@test.com' }));
  8  |     });
  9  |     
  10 |     await page.goto('/');
  11 | 
  12 |     // Navigate to Settings/Cards
> 13 |     await page.click('text=Ajustes');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  14 |     await page.click('text=Novo Cartão');
  15 |     
  16 |     // Fill Card Form
  17 |     await page.fill('input[placeholder*="Nubank"]', 'Test Card');
  18 |     await page.fill('text=Dia de Fechamento >> xpath=../input', '25');
  19 |     await page.fill('text=Dia de Vencimento >> xpath=../input', '5');
  20 |     await page.click('button:has-text("Salvar")');
  21 | 
  22 |     // Go to dashboard to add expense (the button is usually there or floating)
  23 |     await page.click('text=Visão Geral');
  24 |     
  25 |     // Add Expense
  26 |     await page.click('button[aria-label="Nova transação"]');
  27 |     await page.click('text=Cartão de Crédito');
  28 |     
  29 |     await page.fill('input[placeholder*="Mercado"]', 'Test Installment');
  30 |     await page.fill('input[placeholder="R$ 0,00"]', '30000'); // 300.00
  31 |     
  32 |     // Select Card
  33 |     await page.selectOption('select', { label: 'Test Card' });
  34 |     
  35 |     // Set Installments
  36 |     await page.fill('input[type="number"]', '3'); // 3x
  37 |     await page.click('button:has-text("Salvar")');
  38 | 
  39 |     // Verify current month bill
  40 |     await expect(page.locator('text=Test Card')).toBeVisible({ timeout: 10000 });
  41 |   });
  42 | });
  43 | 
```