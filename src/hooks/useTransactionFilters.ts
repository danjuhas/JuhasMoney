import { useState, useMemo, useEffect } from 'react';
import type { Expense, Category } from '../types';
import { isActiveInMonth, isExpensePaid } from '../utils/transactions';

export type SortOption = 'default' | 'date_desc' | 'date_asc' | 'name_asc' | 'amount_desc' | 'amount_asc';

export function useTransactionFilters(expenses: Expense[], categories: Category[], selectedMonth: string) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const isFilterActive = filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || sortBy !== 'default';

  // Cross-filter validation
  useEffect(() => {
    if (filterCategory !== 'all' && filterType !== 'all') {
      const selectedCat = categories.find(c => c.id === filterCategory);
      if (selectedCat && selectedCat.type !== filterType) {
        setFilterCategory('all');
      }
    }
  }, [filterType, filterCategory, categories]);

  // Step 1: Month filter
  const monthExpenses = useMemo(() => {
    return expenses.filter(exp => isActiveInMonth(exp, selectedMonth));
  }, [expenses, selectedMonth]);

  // Step 2: Calculate Totals (always based on month only, ignoring filters)
  const { totalReceitas, totalDespesas, saldo, totalPendente } = useMemo(() => {
    const totalReceitas = monthExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
    const totalDespesas = monthExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
    const saldo = totalReceitas - totalDespesas;
    const totalPendente = monthExpenses.reduce((acc, curr) => {
      if (curr.type === 'income') return acc;
      return isExpensePaid(curr, selectedMonth) ? acc : acc + curr.amount;
    }, 0);
    return { totalReceitas, totalDespesas, saldo, totalPendente };
  }, [monthExpenses, selectedMonth]);

  // Step 3: Apply User Filters (Type, Status, Category)
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter(expense => {
      if (filterType !== 'all' && (expense.type || 'expense') !== filterType) return false;
      
      const isPaid = isExpensePaid(expense, selectedMonth);
      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'pending' && isPaid) return false;
      
      if (filterCategory !== 'all' && expense.category_id !== filterCategory) return false;
      
      return true;
    });
  }, [monthExpenses, filterType, filterStatus, filterCategory, selectedMonth]);

  // Step 4: Sort
  const finalExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'default') {
        const aPaid = isExpensePaid(a, selectedMonth);
        const bPaid = isExpensePaid(b, selectedMonth);

        if (aPaid !== bPaid) return aPaid ? 1 : -1;

        if (!aPaid) {
          const aDue = a.due_day || 99;
          const bDue = b.due_day || 99;
          if (aDue !== bDue) return aDue - bDue;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      if (sortBy === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.description.localeCompare(b.description);
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [filteredExpenses, sortBy, selectedMonth]);

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setSortBy('default');
  };

  return {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    sortBy,
    setSortBy,
    isFilterActive,
    clearFilters,
    filteredExpenses: monthExpenses, // Returning month expenses here in case something needs it
    finalExpenses,
    totals: { totalReceitas, totalDespesas, saldo, totalPendente }
  };
}
