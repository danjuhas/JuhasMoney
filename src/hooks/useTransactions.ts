import { useState, useEffect, useCallback } from 'react';
import type { Expense, Category } from '../types';
import { supabase } from '../lib/supabase';

export function useTransactions(userId: string | null, onError?: (message: string) => void) {
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
      if (onError) onError('Erro ao adicionar categoria. Verifique sua conexão.');
      fetchAll();
    }
  }, [fetchAll, onError]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error updating category:', err);
      if (onError) onError('Erro ao atualizar categoria. Verifique sua conexão.');
      fetchAll();
    }
  }, [fetchAll, onError]);


  const payMultipleExpenses = useCallback(async (expenseIds: string[], monthStr: string) => {
    if (!userId || expenseIds.length === 0) return;
    try {
      // Find the expenses locally first to update them properly
      const expensesToUpdate = expenses.filter(e => expenseIds.includes(e.id));
      
      const updates = expensesToUpdate.map(exp => {
        if (exp.is_fixed) {
          const paidMonths = exp.paid_months || [];
          if (!paidMonths.includes(monthStr)) {
            return { id: exp.id, paid_months: [...paidMonths, monthStr] };
          }
          return null;
        } else {
          return { id: exp.id, is_paid: true };
        }
      }).filter(Boolean) as {id: string, paid_months?: string[], is_paid?: boolean}[];

      if (updates.length === 0) return;

      // Update locally immediately
      setExpenses(prev => prev.map(exp => {
        const update = updates.find(u => u.id === exp.id);
        if (update) {
          return { ...exp, ...update };
        }
        return exp;
      }));

      // In real backend, we'd do a bulk upsert. Using individual updates for now or supabase bulk
      const { error } = await supabase.from('transactions').upsert(
        updates.map(u => ({ ...expensesToUpdate.find(e => e.id === u.id), ...u }))
      );

      if (error) throw error;
    } catch (err: any) {
      console.error('Error paying multiple expenses:', err);
      if (onError) onError(err.message || 'Erro ao pagar itens do cartão.');
      fetchAll(); // rollback
    }
  }, [userId, expenses, fetchAll, onError]);

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
    } else if (expenseToDelete.group_id) {
      const groupId = expenseToDelete.group_id;
      const createdAt = expenseToDelete.created_at;
      setExpenses(prev => prev.filter(e => !(e.group_id === groupId && e.created_at >= createdAt)));
      try {
        const { error } = await supabase.from('transactions').delete().eq('group_id', groupId).gte('created_at', createdAt);
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
    updateCategory,
    deleteCategory,
    deleteExpense,
    togglePaid,
    payMultipleExpenses,
  };
}
