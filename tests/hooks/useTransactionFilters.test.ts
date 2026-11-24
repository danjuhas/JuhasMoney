import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionFilters } from '../../src/hooks/useTransactionFilters';
import type { Expense, Category, Investment, InvestmentTransaction } from '../../src/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'dashboard.locale') return 'pt-BR';
      if (key === 'analytics.search_placeholder') return 'Busque por despesa ou categoria (ex: Uber, Mercado)...';
      if (key === 'dashboard.bill_empty') return 'Nenhuma despesa para esta fatura.';
      if (key === 'dashboard.bill_paid') return 'Fatura Paga';
      return key;
    },
    i18n: { language: 'pt' }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

describe('useTransactionFilters Hook', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', user_id: 'user', name: 'Salário', type: 'income', icon: 'money', color: 'bg-green' },
    { id: 'cat-2', user_id: 'user', name: 'Aluguel', type: 'expense', icon: 'home', color: 'bg-red' }
  ];

  const mockExpenses: Expense[] = [
    { id: 'exp-1', user_id: 'u', description: 'Salário', amount: 5000, type: 'income', created_at: '2026-05-10T10:00:00Z', is_fixed: false, is_paid: true },
    { id: 'exp-2', user_id: 'u', description: 'Aluguel', amount: 1500, type: 'expense', created_at: '2026-05-15T10:00:00Z', is_fixed: false, is_paid: true },
    { id: 'exp-3', user_id: 'u', description: 'Internet', amount: 100, type: 'expense', created_at: '2026-05-20T10:00:00Z', is_fixed: false, is_paid: false }
  ];

  it('should calculate totals correctly based on the month, ignoring UI filters', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses, mockCategories, '2026-05'));
    
    expect(result.current.totals.totalIncomes).toBe(5000);
    expect(result.current.totals.totalExpenses).toBe(1600);
    expect(result.current.totals.currentBalance).toBe(3500); // Only paid (5000 - 1500)
    expect(result.current.totals.totalPending).toBe(100);
    expect(result.current.totals.accumulatedBalance).toBe(0);
    expect(result.current.totals.projectedBalance).toBe(3400); // All expected (5000 - 1600)
  });

  it('should filter by type (expenses only)', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses, mockCategories, '2026-05'));
    
    act(() => {
      result.current.setFilterType('expense');
    });

    expect(result.current.finalExpenses).toHaveLength(2); // Aluguel e Internet
    // Totals should not be affected by UI filter
    expect(result.current.totals.totalExpenses).toBe(1600);
  });

  it('should filter by status (pending only)', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses, mockCategories, '2026-05'));
    
    act(() => {
      result.current.setFilterStatus('pending');
    });

    expect(result.current.finalExpenses).toHaveLength(1);
    expect(result.current.finalExpenses[0].description).toBe('Internet');
  });

  it('should clear filters correctly', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses, mockCategories, '2026-05'));
    
    act(() => {
      result.current.setFilterStatus('pending');
      result.current.setFilterType('income');
      result.current.clearFilters();
    });

    expect(result.current.filterStatus).toBe('all');
    expect(result.current.filterType).toBe('all');
    expect(result.current.isFilterActive).toBe(false);
  });

  it('should correctly calculate accumulated and projected balances from previous months', () => {
    const historicalExpenses: Expense[] = [
      { id: 'old-1', user_id: 'u', description: 'Past Income', amount: 1000, type: 'income', created_at: '2026-03-10T10:00:00Z', is_fixed: false, is_paid: true },
      { id: 'old-2', user_id: 'u', description: 'Past Expense (paid)', amount: 200, type: 'expense', created_at: '2026-04-15T10:00:00Z', is_fixed: false, is_paid: true },
      { id: 'old-3', user_id: 'u', description: 'Past Expense (pending)', amount: 300, type: 'expense', created_at: '2026-04-20T10:00:00Z', is_fixed: false, is_paid: false },
      { id: 'curr-1', user_id: 'u', description: 'Current Income', amount: 2000, type: 'income', created_at: '2026-05-10T10:00:00Z', is_fixed: false, is_paid: true }
    ];

    const { result } = renderHook(() => useTransactionFilters(historicalExpenses, mockCategories, '2026-05'));
    
    // Past Paid = +1000 - 200 = 800 (Accumulated Real)
    expect(result.current.totals.accumulatedBalance).toBe(800);
    // Past Expected = +1000 - 200 - 300 = 500 (Accumulated Projected)
    // Current Incomes = 2000, Current Expenses = 0
    // Saldo Atual = Accumulated Real (800) + Current Paid (2000) = 2800
    expect(result.current.totals.currentBalance).toBe(2800);
    // Saldo Projetado = Accumulated Projected (500) + Current Total (2000) = 2500
    expect(result.current.totals.projectedBalance).toBe(2500);
  });

  it('should deduct investment contributions and add withdrawals to balance while ignoring initial balance and yield', () => {
    const investments: Investment[] = [
      {
        id: 'inv-1',
        user_id: 'u',
        name: 'Emergency Fund',
        category: 'emergency',
        color: '#0ea5e9',
        created_at: '2026-05-01T10:00:00Z',
      },
    ];

    const invTxs: InvestmentTransaction[] = [
      // Initial balance -> should NOT deduct from month balance
      {
        id: 'itx-init',
        investment_id: 'inv-1',
        user_id: 'u',
        type: 'contribution',
        amount: 10000,
        date: '2026-05-01T10:00:00Z',
        notes: 'investments.note_initial_balance',
        created_at: '2026-05-01T10:00:00Z',
      },
      // Active deposit -> SHOULD deduct 1000 from month balance
      {
        id: 'itx-contrib',
        investment_id: 'inv-1',
        user_id: 'u',
        type: 'contribution',
        amount: 1000,
        date: '2026-05-12T10:00:00Z',
        notes: 'Monthly savings',
        created_at: '2026-05-12T10:00:00Z',
      },
      // Active withdrawal -> SHOULD add 300 back to month balance
      {
        id: 'itx-withdraw',
        investment_id: 'inv-1',
        user_id: 'u',
        type: 'withdrawal',
        amount: 300,
        date: '2026-05-18T10:00:00Z',
        created_at: '2026-05-18T10:00:00Z',
      },
      // Yield adjustment -> should NOT affect checking account balance
      {
        id: 'itx-yield',
        investment_id: 'inv-1',
        user_id: 'u',
        type: 'yield',
        amount: 150,
        date: '2026-05-25T10:00:00Z',
        notes: 'investments.note_yield_positive',
        created_at: '2026-05-25T10:00:00Z',
      },
    ];

    const { result } = renderHook(() =>
      useTransactionFilters(mockExpenses, mockCategories, '2026-05', [], investments, invTxs)
    );

    // Net invested this month = 1000 - 300 = 700
    expect(result.current.totals.totalInvestedMonth).toBe(700);
    // Incomes (5000) - Paid Expenses (1500) - Net Invested (700) = 2800
    expect(result.current.totals.currentBalance).toBe(2800);
    // Incomes (5000) - Total Expenses (1600) - Net Invested (700) = 2700
    expect(result.current.totals.projectedBalance).toBe(2700);
    // Expenses metric itself remains untouched (1600)
    expect(result.current.totals.totalExpenses).toBe(1600);

    // Dashboard items should include the 2 cash-flow investment transactions (contribution + withdrawal)
    const invItems = result.current.dashboardItems.filter(
      (i) => i.type === 'investment_transaction'
    );
    expect(invItems).toHaveLength(2);
  });
});
