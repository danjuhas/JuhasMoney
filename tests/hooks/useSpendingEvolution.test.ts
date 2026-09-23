import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSpendingEvolution } from '../../src/hooks/useSpendingEvolution';
import type { Expense, Category } from '../../src/types';

describe('useSpendingEvolution', () => {
  const mockCategories: Category[] = [
    { id: 'c1', name: 'Transporte', user_id: 'u1', type: 'expense', icon: 'car', color: '#000' },
    { id: 'c2', name: 'Mercado', user_id: 'u1', type: 'expense', icon: 'cart', color: '#000' }
  ];

  const mockExpenses: Expense[] = [
    // Variable expenses
    { id: 'e1', user_id: 'u1', description: 'Uber', amount: 50, type: 'expense', category_id: 'c1', created_at: '2026-09-10T12:00:00Z', is_fixed: false, is_paid: false },
    { id: 'e2', user_id: 'u1', description: '99Taxi', amount: 30, type: 'expense', category_id: 'c1', created_at: '2026-08-15T12:00:00Z', is_fixed: false, is_paid: false },
    { id: 'e3', user_id: 'u1', description: 'Uber Eats', amount: 80, type: 'expense', category_id: 'c1', created_at: '2026-09-20T12:00:00Z', is_fixed: false, is_paid: false },
    
    // Income (should be ignored)
    { id: 'e4', user_id: 'u1', description: 'Uber Refund', amount: 20, type: 'income', category_id: 'c1', created_at: '2026-09-21T12:00:00Z', is_fixed: false, is_paid: false },
    
    // Fixed expense starting in Jan 2026
    { id: 'e5', user_id: 'u1', description: 'Condominio', amount: 500, type: 'expense', category_id: 'c2', created_at: '2026-01-10T12:00:00Z', is_fixed: true, is_paid: false, excluded_months: [], paid_months: [] }
  ];

  const selectedMonth = '2026-09';

  it('should return empty state when search term is less than 2 characters', () => {
    const { result } = renderHook(() => 
      useSpendingEvolution(mockExpenses, mockCategories, selectedMonth, 'U')
    );
    
    expect(result.current.hasData).toBe(false);
    expect(result.current.chartData.length).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should filter by description correctly (case insensitive)', () => {
    const { result } = renderHook(() => 
      useSpendingEvolution(mockExpenses, mockCategories, selectedMonth, 'UBER')
    );
    
    expect(result.current.hasData).toBe(true);
    // Should match e1 (Uber) and e3 (Uber Eats), but ignore e4 (Uber Refund - income)
    expect(result.current.total).toBe(130); // 50 + 80
    
    // Check if chartData ends in Sept 2026
    const lastMonth = result.current.chartData[5];
    expect(lastMonth.monthStr).toBe('2026-09');
    expect(lastMonth.amount).toBe(130);
  });

  it('should filter by category name correctly', () => {
    const { result } = renderHook(() => 
      useSpendingEvolution(mockExpenses, mockCategories, selectedMonth, 'Transporte')
    );
    
    expect(result.current.hasData).toBe(true);
    // Should match e1, e2, e3 (all in 'Transporte', ignoring income)
    // 2026-08 (e2 = 30), 2026-09 (e1=50 + e3=80 = 130)
    expect(result.current.total).toBe(160);
    
    const augData = result.current.chartData.find(d => d.monthStr === '2026-08');
    expect(augData?.amount).toBe(30);
  });

  it('should calculate trend correctly', () => {
    const { result } = renderHook(() => 
      useSpendingEvolution(mockExpenses, mockCategories, selectedMonth, 'Transporte')
    );
    
    // Total = 160 over 6 months -> Avg = 26.666
    // Last month (Sept) = 130
    // Trend = ((130 - 26.666) / 26.666) * 100 = 387.5%
    expect(result.current.trend).toBeCloseTo(387.5);
  });

  it('should handle fixed expenses across the 6-month window', () => {
    const { result } = renderHook(() => 
      useSpendingEvolution(mockExpenses, mockCategories, selectedMonth, 'Condominio')
    );
    
    // Fixed expense of 500 starting in Jan 2026. 
    // The window is Apr 2026 to Sept 2026 (6 months).
    // Should count 500 for each of the 6 months.
    expect(result.current.total).toBe(3000);
    expect(result.current.average).toBe(500);
    
    // Sept = 500, Avg = 500. Trend = 0
    expect(result.current.trend).toBe(0);
    
    // Verify each month has 500
    result.current.chartData.forEach(month => {
      expect(month.amount).toBe(500);
    });
  });
});

