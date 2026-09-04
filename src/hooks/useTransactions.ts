import { useState, useEffect, useCallback } from 'react';
import type { Expense, Category } from '../types';

export function useTransactions(userId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    
    const localData = localStorage.getItem(`juhas_expenses_${userId}`);
    if (localData) {
      setExpenses(JSON.parse(localData));
    } else {
      setExpenses([]);
    }
    
    const localCategories = localStorage.getItem(`juhas_categories_${userId}`);
    if (localCategories) {
      setCategories(JSON.parse(localCategories));
    } else {
      setCategories([]);
    }
    
    setLoading(false);
  }, [userId]);

  const saveExpenses = useCallback((newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    if (userId) {
      localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));
    }
  }, [userId]);

  const saveCategories = useCallback((newCategories: Category[]) => {
    setCategories(newCategories);
    if (userId) {
      localStorage.setItem(`juhas_categories_${userId}`, JSON.stringify(newCategories));
    }
  }, [userId]);

  const addCategory = useCallback((category: Category) => {
    const newCategories = [...categories, category];
    saveCategories(newCategories);
  }, [categories, saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    const newCategories = categories.filter(c => c.id !== id);
    saveCategories(newCategories);
  }, [categories, saveCategories]);

  const deleteExpense = useCallback((id: string, selectedMonth: string, deleteAll: boolean = false) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    const isDifferentMonth = !expenseToDelete.created_at.startsWith(selectedMonth);
    let newExpenses;

    if (expenseToDelete.is_fixed && isDifferentMonth && !deleteAll) {
      const updated = {
        ...expenseToDelete,
        excluded_months: [...(expenseToDelete.excluded_months || []), selectedMonth]
      };
      newExpenses = expenses.map(e => e.id === id ? updated : e);
    } else {
      newExpenses = expenses.filter(e => e.id !== id);
    }
    
    saveExpenses(newExpenses);
  }, [expenses, saveExpenses]);

  const togglePaid = useCallback((expense: Expense, selectedMonth: string) => {
    const newExpenses = expenses.map(e => {
      if (e.id === expense.id) {
        if (e.is_fixed) {
          const paidMonths = e.paid_months || [];
          const isPaid = paidMonths.includes(selectedMonth);
          return {
            ...e,
            paid_months: isPaid
              ? paidMonths.filter(m => m !== selectedMonth)
              : [...paidMonths, selectedMonth]
          };
        } else {
          return { ...e, is_paid: !e.is_paid };
        }
      }
      return e;
    });
    
    saveExpenses(newExpenses);
  }, [expenses, saveExpenses]);

  return {
    expenses,
    categories,
    loading,
    saveExpenses,
    saveCategories,
    addCategory,
    deleteCategory,
    deleteExpense,
    togglePaid,
  };
}

