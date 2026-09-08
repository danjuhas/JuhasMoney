import { useState, useMemo } from 'react';
import type { Expense } from '../types';
import { isActiveInMonth, isExpensePaid } from '../utils/transactions';

export function useTransactionFilters(expenses: Expense[], selectedMonth: string) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

  const isFilterActive = filterType !== 'all' || filterStatus !== 'all';

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => isActiveInMonth(exp, selectedMonth));
  }, [expenses, selectedMonth]);

  const { totalReceitas, totalDespesas, saldo, totalPendente } = useMemo(() => {
    const totalReceitas = filteredExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
    const totalDespesas = filteredExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
    const saldo = totalReceitas - totalDespesas;
    const totalPendente = filteredExpenses.reduce((acc, curr) => {
      if (curr.type === 'income') return acc;
      return isExpensePaid(curr, selectedMonth) ? acc : acc + curr.amount;
    }, 0);
    return { totalReceitas, totalDespesas, saldo, totalPendente };
  }, [filteredExpenses, selectedMonth]);

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      const aPaid = isExpensePaid(a, selectedMonth);
      const bPaid = isExpensePaid(b, selectedMonth);

      if (aPaid !== bPaid) return aPaid ? 1 : -1;

      if (!aPaid) {
        const aDue = a.due_day || 99;
        const bDue = b.due_day || 99;
        if (aDue !== bDue) return aDue - bDue;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredExpenses, selectedMonth]);

  const finalExpenses = useMemo(() => {
    return sortedExpenses.filter(expense => {
      if (filterType !== 'all' && (expense.type || 'expense') !== filterType) return false;
      const isPaid = isExpensePaid(expense, selectedMonth);
      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'pending' && isPaid) return false;
      return true;
    });
  }, [sortedExpenses, filterType, filterStatus, selectedMonth]);

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
  };

  return {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    isFilterActive,
    clearFilters,
    filteredExpenses, // The raw filtered by month
    finalExpenses, // Filtered by type/status
    totals: { totalReceitas, totalDespesas, saldo, totalPendente }
  };
}
