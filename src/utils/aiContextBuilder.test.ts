import { describe, it, expect } from 'vitest';
import {
  buildFinancialContextSnapshot,
  computeContextFingerprint,
} from './aiContextBuilder';
import type { Category, CreditCard, Expense, Investment, InvestmentTransaction } from '../types';

const mockCategories: Category[] = [
  { id: 'cat-food', user_id: 'u-secret-1', name: 'Food', type: 'expense' },
  { id: 'cat-rent', user_id: 'u-secret-1', name: 'Housing', type: 'expense' },
  { id: 'cat-salary', user_id: 'u-secret-1', name: 'Salary', type: 'income' },
];

const mockCards: CreditCard[] = [
  {
    id: 'card-1',
    user_id: 'u-secret-1',
    name: 'Nubank',
    color: '#8b5cf6',
    closing_day: 25,
    due_day: 5,
    limit: 2000,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

const mockExpenses: Expense[] = [
  {
    id: 'exp-1',
    user_id: 'u-secret-1',
    description: 'Salary',
    amount: 5000,
    type: 'income',
    category_id: 'cat-salary',
    created_at: '2026-05-05T12:00:00.000Z',
    is_paid: true,
  },
  {
    id: 'exp-2',
    user_id: 'u-secret-1',
    description: 'Apartment Rent',
    amount: 1500,
    type: 'expense',
    category_id: 'cat-rent',
    created_at: '2026-01-10T12:00:00.000Z',
    is_fixed: true,
    paid_months: ['2026-05'],
  },
  {
    id: 'exp-3',
    user_id: 'u-secret-1',
    description: 'iFood Dinner',
    amount: 300,
    type: 'expense',
    category_id: 'cat-food',
    credit_card_id: 'card-1',
    created_at: '2026-05-12T12:00:00.000Z',
    is_paid: false,
  },
  {
    id: 'exp-4',
    user_id: 'u-secret-1',
    description: 'iFood Previous Month',
    amount: 200,
    type: 'expense',
    category_id: 'cat-food',
    created_at: '2026-04-12T12:00:00.000Z',
    is_paid: true,
  },
  {
    id: 'exp-5',
    user_id: 'u-secret-1',
    description: 'Laptop (2/10)',
    amount: 500,
    type: 'expense',
    credit_card_id: 'card-1',
    created_at: '2026-05-15T12:00:00.000Z',
    installments: { current: 2, total: 10 },
    is_paid: false,
  },
];

const mockInvestments: Investment[] = [
  {
    id: 'inv-1',
    user_id: 'u-secret-1',
    name: 'Emergency Fund',
    category: 'emergency',
    color: '#10b981',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

const mockInvestmentTxs: InvestmentTransaction[] = [
  {
    id: 'itx-1',
    investment_id: 'inv-1',
    user_id: 'u-secret-1',
    type: 'contribution',
    amount: 1000,
    date: '2026-05-02T12:00:00.000Z',
    created_at: '2026-05-02T12:00:00.000Z',
  },
];

describe('aiContextBuilder', () => {
  it('builds accurate financial summary, category deltas, card usage, and sanitized items', () => {
    const monthExpenses = mockExpenses.filter((e) => e.id !== 'exp-4');

    const snapshot = buildFinancialContextSnapshot({
      selectedMonth: '2026-05',
      currency: 'BRL',
      allExpenses: mockExpenses,
      monthExpenses,
      categories: mockCategories,
      cards: mockCards,
      investments: mockInvestments,
      investmentTransactions: mockInvestmentTxs,
      totals: {
        totalIncomes: 5000,
        totalExpenses: 2300,
        totalPending: 800,
        totalInvestedMonth: 1000,
        currentBalance: 2500,
        projectedBalance: 1700,
      },
    });

    expect(snapshot.summary.savingsRatePercent).toBe(54);
    expect(snapshot.summary.fixedExpensesTotal).toBe(1500);
    expect(snapshot.summary.variableExpensesTotal).toBe(800);
    expect(snapshot.summary.transactionCount).toBe(4);

    // Food increased from 200 in April to 300 in May (+50%)
    const foodCat = snapshot.categoriesBreakdown.find((c) => c.name === 'Food');
    expect(foodCat).toBeDefined();
    expect(foodCat?.amount).toBe(300);
    expect(foodCat?.previousMonthAmount).toBe(200);
    expect(foodCat?.changePercent).toBe(50);

    // Credit card bill = 300 + 500 = 800 on 2000 limit = 40%
    expect(snapshot.creditCards).toHaveLength(1);
    expect(snapshot.creditCards[0].currentBill).toBe(800);
    expect(snapshot.creditCards[0].limitUsagePercent).toBe(40);

    // Active installments
    expect(snapshot.activeInstallments).toHaveLength(1);
    expect(snapshot.activeInstallments[0].progress).toBe('2/10');
    expect(snapshot.activeInstallments[0].remainingMonths).toBe(8);

    // Investments
    expect(snapshot.investments.totalNetWorth).toBe(1000);

    // Privacy check: serialized snapshot must not contain user_id or internal expense IDs
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain('u-secret-1');
    expect(serialized).not.toContain('exp-3');
  });

  it('handles empty months gracefully without division by zero', () => {
    const snapshot = buildFinancialContextSnapshot({
      selectedMonth: '2026-06',
      currency: 'USD',
      allExpenses: [],
      monthExpenses: [],
      categories: [],
      cards: [],
      investments: [],
      investmentTransactions: [],
      totals: {
        totalIncomes: 0,
        totalExpenses: 0,
        totalPending: 0,
        totalInvestedMonth: 0,
        currentBalance: 0,
        projectedBalance: 0,
      },
    });

    expect(snapshot.summary.savingsRatePercent).toBeNull();
    expect(snapshot.categoriesBreakdown).toEqual([]);
    expect(snapshot.topExpenses).toEqual([]);
  });

  it('produces stable fingerprints for identical data and changes when totals change', () => {
    const baseInput = {
      selectedMonth: '2026-05',
      currency: 'BRL',
      allExpenses: mockExpenses,
      monthExpenses: mockExpenses.filter((e) => e.id !== 'exp-4'),
      categories: mockCategories,
      cards: mockCards,
      investments: mockInvestments,
      investmentTransactions: mockInvestmentTxs,
      totals: {
        totalIncomes: 5000,
        totalExpenses: 2300,
        totalPending: 800,
        totalInvestedMonth: 1000,
        currentBalance: 2500,
        projectedBalance: 1700,
      },
    };

    const snap1 = buildFinancialContextSnapshot(baseInput);
    const snap2 = buildFinancialContextSnapshot(baseInput);
    const snap3 = buildFinancialContextSnapshot({
      ...baseInput,
      totals: { ...baseInput.totals, totalExpenses: 2450 },
    });

    expect(computeContextFingerprint(snap1)).toBe(computeContextFingerprint(snap2));
    expect(computeContextFingerprint(snap1)).not.toBe(computeContextFingerprint(snap3));
  });
});
