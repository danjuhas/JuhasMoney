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
    it('deve retornar true para transações normais apenas no mês de criação', () => {
      const normalExpense = { ...baseExpense, is_fixed: false };
      expect(isActiveInMonth(normalExpense, '2026-05')).toBe(true);
      expect(isActiveInMonth(normalExpense, '2026-06')).toBe(false);
    });

    it('deve retornar true para despesas fixas em meses futuros', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true };
      expect(isActiveInMonth(fixedExpense, '2026-05')).toBe(true);
      expect(isActiveInMonth(fixedExpense, '2026-10')).toBe(true); // Futuro
    });

    it('deve retornar false para despesas fixas em meses anteriores à criação', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true };
      expect(isActiveInMonth(fixedExpense, '2026-04')).toBe(false); // Passado
    });

    it('deve retornar false se o mês estiver na lista de excluded_months', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true, excluded_months: ['2026-07'] };
      expect(isActiveInMonth(fixedExpense, '2026-07')).toBe(false);
      expect(isActiveInMonth(fixedExpense, '2026-08')).toBe(true);
    });

    it('deve retornar false se o mês for posterior ao end_month', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true, end_month: '2026-08' };
      expect(isActiveInMonth(fixedExpense, '2026-08')).toBe(true);
      expect(isActiveInMonth(fixedExpense, '2026-09')).toBe(false);
    });
  });

  describe('isExpensePaid', () => {
    it('deve verificar is_paid para transações normais', () => {
      const normalExpense = { ...baseExpense, is_fixed: false, is_paid: true };
      expect(isExpensePaid(normalExpense, '2026-05')).toBe(true);
      
      const unpaidNormal = { ...baseExpense, is_fixed: false, is_paid: false };
      expect(isExpensePaid(unpaidNormal, '2026-05')).toBe(false);
    });

    it('deve verificar paid_months para transações fixas no mês específico', () => {
      const fixedExpense = { ...baseExpense, is_fixed: true, paid_months: ['2026-06'] };
      expect(isExpensePaid(fixedExpense, '2026-05')).toBe(false); // Maio não pago
      expect(isExpensePaid(fixedExpense, '2026-06')).toBe(true);  // Junho pago
    });
  });
});
