import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Investment, InvestmentTransaction, InvestmentTransactionType } from '../types';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';
import { calculateInvestmentMetrics } from '../utils/investments';

const LOCAL_INV_KEY = (userId: string) => `juhasmoney_investments_${userId}`;
const LOCAL_TX_KEY = (userId: string) => `juhasmoney_investment_txs_${userId}`;

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function useInvestments(userId: string | null, onError?: (message: string) => void) {
  const { t } = useTranslation();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvestments = useCallback(async () => {
    if (!userId) {
      setInvestments([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [invRes, txRes] = await Promise.all([
        supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('investment_transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
      ]);

      // If table does not exist yet on remote Supabase (PGRST205 / 42P01), fall back smoothly to localStorage
      if (invRes.error || txRes.error) {
        const localInvs = readLocal<Investment>(LOCAL_INV_KEY(userId));
        const localTxs = readLocal<InvestmentTransaction>(LOCAL_TX_KEY(userId));
        setInvestments(localInvs);
        setTransactions(localTxs);
        return;
      }

      const fetchedInvs = (invRes.data as Investment[]) || [];
      const fetchedTxs = (txRes.data as InvestmentTransaction[]) || [];

      setInvestments(fetchedInvs);
      setTransactions(fetchedTxs);
      writeLocal(LOCAL_INV_KEY(userId), fetchedInvs);
      writeLocal(LOCAL_TX_KEY(userId), fetchedTxs);
    } catch (err) {
      console.error('Error loading investments:', err);
      const localInvs = readLocal<Investment>(LOCAL_INV_KEY(userId));
      const localTxs = readLocal<InvestmentTransaction>(LOCAL_TX_KEY(userId));
      setInvestments(localInvs);
      setTransactions(localTxs);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const addInvestment = async (
    payload: Omit<Investment, 'id' | 'user_id' | 'created_at'>,
    initialBalance: number = 0
  ) => {
    if (!userId) return;

    const now = new Date().toISOString();
    const optimisticId = generateUUID();
    const newInvestment: Investment = {
      ...payload,
      id: optimisticId,
      user_id: userId,
      created_at: now,
    };

    const nextInvs = [...investments, newInvestment];
    setInvestments(nextInvs);
    writeLocal(LOCAL_INV_KEY(userId), nextInvs);

    let realInvestmentId = optimisticId;

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([{
          user_id: userId,
          name: payload.name,
          category: payload.category,
          color: payload.color,
          target_amount: payload.target_amount || null,
        }])
        .select()
        .single();

      if (!error && data) {
        realInvestmentId = data.id;
        setInvestments(prev => {
          const updated = prev.map(inv => inv.id === optimisticId ? (data as Investment) : inv);
          writeLocal(LOCAL_INV_KEY(userId), updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Error saving investment to Supabase (persisted locally):', err);
    }

    if (initialBalance > 0) {
      await addInvestmentTransaction({
        investment_id: realInvestmentId,
        type: 'contribution',
        amount: initialBalance,
        date: now,
        notes: 'investments.note_initial_balance',
      });
    }
  };

  const updateInvestment = async (
    id: string,
    updates: Partial<Omit<Investment, 'id' | 'user_id' | 'created_at'>>
  ) => {
    if (!userId) return;

    setInvestments(prev => {
      const updated = prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
      writeLocal(LOCAL_INV_KEY(userId), updated);
      return updated;
    });

    try {
      const { error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase update fallback to local:', error.message);
      }
    } catch (err) {
      console.error('Error updating investment:', err);
      if (onError) onError(t('investments.error_update'));
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!userId) return;

    setInvestments(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      writeLocal(LOCAL_INV_KEY(userId), updated);
      return updated;
    });

    setTransactions(prev => {
      const updated = prev.filter(tx => tx.investment_id !== id);
      writeLocal(LOCAL_TX_KEY(userId), updated);
      return updated;
    });

    try {
      await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (err) {
      console.error('Error deleting investment:', err);
    }
  };

  const addInvestmentTransaction = async (payload: {
    investment_id: string;
    type: InvestmentTransactionType;
    amount: number;
    date?: string;
    notes?: string;
  }) => {
    if (!userId) return;

    const now = new Date().toISOString();
    const optimisticId = generateUUID();
    const newTx: InvestmentTransaction = {
      id: optimisticId,
      investment_id: payload.investment_id,
      user_id: userId,
      type: payload.type,
      amount: payload.amount,
      date: payload.date || now,
      notes: payload.notes,
      created_at: now,
    };

    setTransactions(prev => {
      const updated = [newTx, ...prev];
      writeLocal(LOCAL_TX_KEY(userId), updated);
      return updated;
    });

    try {
      const { data, error } = await supabase
        .from('investment_transactions')
        .insert([{
          investment_id: payload.investment_id,
          user_id: userId,
          type: payload.type,
          amount: payload.amount,
          date: payload.date || now,
          notes: payload.notes || null,
        }])
        .select()
        .single();

      if (!error && data) {
        setTransactions(prev => {
          const updated = prev.map(t => t.id === optimisticId ? (data as InvestmentTransaction) : t);
          writeLocal(LOCAL_TX_KEY(userId), updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Error adding investment transaction:', err);
    }
  };

  /**
   * Smart Balance Adjustment: calculates delta between the new total balance reported by user
   * and current calculated balance, recording the difference as a 'yield' transaction.
   */
  const adjustInvestmentBalance = async (investmentId: string, newTotalBalance: number, notes?: string) => {
    if (!userId) return;

    const invTxs = transactions.filter(t => t.investment_id === investmentId);
    const { currentBalance } = calculateInvestmentMetrics(invTxs);
    const delta = Math.round((newTotalBalance - currentBalance) * 100) / 100;

    if (delta === 0) return;

    await addInvestmentTransaction({
      investment_id: investmentId,
      type: 'yield',
      amount: delta,
      notes:
        notes ||
        (delta > 0 ? 'investments.note_yield_positive' : 'investments.note_yield_negative'),
    });
  };

  const deleteInvestmentTransaction = async (id: string) => {
    if (!userId) return;

    setTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== id);
      writeLocal(LOCAL_TX_KEY(userId), updated);
      return updated;
    });

    try {
      await supabase
        .from('investment_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (err) {
      console.error('Error deleting investment transaction:', err);
    }
  };

  return {
    investments,
    transactions,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addInvestmentTransaction,
    adjustInvestmentBalance,
    deleteInvestmentTransaction,
    refreshInvestments: loadInvestments,
  };
}
