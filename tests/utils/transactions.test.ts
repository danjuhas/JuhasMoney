import { describe, it, expect } from 'vitest';
import { isActiveInMonth, isExpensePaid } from '../../src/utils/transactions';
import type { Expense } from '../../src/types';

describe('Transaction Utilities', () => {
  const baseExpense: Expense = {
    id: '123',
    user_id: 'user1',
    description: 'Test',
    amount: 100,
    created_at: '2026-05-15T10:00:00.000Z',
    type: 'expense'
  };

  describe('isActiveInMonth', () => {
    it('should return true for normal transactions only in the creation month', () => {
      const normalExpense = { ...baseExpense, is_fixed: false };
      expect(isActiveInMonth(normalExpense, '2026-05')).toBe(true);
      expect(isActiveInMonth(normalExpense, '2026-06')).toBe(false);
    });

    it('should return true for fixed expenses in future months', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true };
      expect(isActiveInMonth(fixedExpense, '2026-05')).toBe(true);
      expect(isActiveInMonth(fixedExpense, '2026-10')).toBe(true); // Future
    });

    it('should return false for fixed expenses in months prior to creation', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true };
      expect(isActiveInMonth(fixedExpense, '2026-04')).toBe(false); // Past
    });

    it('should return false if the month is in the excluded_months list', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true, excluded_months: ['2026-07'] };
      expect(isActiveInMonth(fixedExpense, '2026-07')).toBe(false);
      expect(isActiveInMonth(fixedExpense, '2026-08')).toBe(true);
    });

    it('should return false if the month is after the end_month', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true, end_month: '2026-08' };
      expect(isActiveInMonth(fixedExpense, '2026-08')).toBe(true);
      expect(isActiveInMonth(fixedExpense, '2026-09')).toBe(false);
    });
  });

  describe('isExpensePaid', () => {
    it('should check is_paid for normal transactions', () => {
      const normalExpense = { ...baseExpense, is_fixed: false, is_paid: true };
      expect(isExpensePaid(normalExpense, '2026-05')).toBe(true);
      
      const unpaidNormal = { ...baseExpense, is_fixed: false, is_paid: false };
      expect(isExpensePaid(unpaidNormal, '2026-05')).toBe(false);
    });

    it('should check paid_months for fixed transactions in the specific month', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true, paid_months: ['2026-06'] };
      expect(isExpensePaid(fixedExpense, '2026-05')).toBe(false); // May not paid
      expect(isExpensePaid(fixedExpense, '2026-06')).toBe(true);  // June paid
    });
  });
});
