import { useState, useEffect, useCallback } from 'react';
import type { Expense, Category } from '../types';
import { supabase } from '../lib/supabase';

export function useTransactions(userId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setExpenses([]);
      setCategories([]);
      return;
    }
    setLoading(true);

    try {
      const [expRes, catRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId)
      ]);

      if (expRes.error) throw expRes.error;
      if (catRes.error) throw catRes.error;

      setExpenses((expRes.data as unknown as Expense[]) || []);
      setCategories((catRes.data as unknown as Category[]) || []);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addCategory = useCallback(async (category: Category) => {
    setCategories(prev => [...prev, category]);
    try {
      const { error } = await supabase.from('categories').insert(category);
      if (error) throw error;
    } catch (err) {
      console.error('Error adding category:', err);
      fetchAll();
    }
  }, [fetchAll]);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting category:', err);
      fetchAll();
    }
  }, [fetchAll]);

  const upsertExpenses = useCallback(async (items: Expense[]) => {
    setExpenses(prev => {
      let newArray = [...prev];
      items.forEach(item => {
        const idx = newArray.findIndex(x => x.id === item.id);
        if (idx >= 0) newArray[idx] = item;
        else newArray.push(item);
      });
      return newArray;
    });

    try {
      const { error } = await supabase.from('transactions').upsert(items);
      if (error) throw error;
    } catch (err) {
      console.error('Error upserting expenses:', err);
      fetchAll();
    }
  }, [fetchAll]);

  const deleteExpense = useCallback(async (id: string, selectedMonth: string, deleteAll: boolean = false) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    const isDifferentMonth = !expenseToDelete.created_at.startsWith(selectedMonth);

    if (expenseToDelete.is_fixed && isDifferentMonth && !deleteAll) {
      const updated = {
        ...expenseToDelete,
        excluded_months: [...(expenseToDelete.excluded_months || []), selectedMonth]
      };
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
      try {
        const { error } = await supabase.from('transactions').update({ excluded_months: updated.excluded_months }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        fetchAll();
      }
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        fetchAll();
      }
    }
  }, [expenses, fetchAll]);

  const togglePaid = useCallback(async (expense: Expense, selectedMonth: string) => {
    let updated: Expense;
    if (expense.is_fixed) {
      const paidMonths = expense.paid_months || [];
      const isPaid = paidMonths.includes(selectedMonth);
      updated = {
        ...expense,
        paid_months: isPaid
          ? paidMonths.filter(m => m !== selectedMonth)
          : [...paidMonths, selectedMonth]
      };
    } else {
      updated = { ...expense, is_paid: !expense.is_paid };
    }

    setExpenses(prev => prev.map(e => e.id === expense.id ? updated : e));
    try {
      const { error } = await supabase.from('transactions').upsert(updated);
      if (error) throw error;
    } catch (err) {
      fetchAll();
    }
  }, [fetchAll]);

  return {
    expenses,
    categories,
    loading,
    upsertExpenses,
    addCategory,
    deleteCategory,
    deleteExpense,
    togglePaid,
  };
}
