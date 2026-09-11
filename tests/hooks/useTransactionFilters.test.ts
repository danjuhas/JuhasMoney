import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionFilters } from '../../src/hooks/useTransactionFilters';
import type { Expense, Category } from '../../src/types';

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
    
    expect(result.current.totals.totalReceitas).toBe(5000);
    expect(result.current.totals.totalDespesas).toBe(1600);
    expect(result.current.totals.saldo).toBe(3400);
    expect(result.current.totals.totalPendente).toBe(100);
  });

  it('should filter by type (expenses only)', () => {
    const { result } = renderHook(() => useTransactionFilters(mockExpenses, mockCategories, '2026-05'));
    
    act(() => {
      result.current.setFilterType('expense');
    });

    expect(result.current.finalExpenses).toHaveLength(2); // Aluguel e Internet
    // Totals should not be affected by UI filter
    expect(result.current.totals.totalDespesas).toBe(1600);
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
});
