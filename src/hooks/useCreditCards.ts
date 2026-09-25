import { useState, useEffect, useCallback } from 'react';
import type { CreditCard } from '../types';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';

export function useCreditCards(userId: string | null) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Error loading cards from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const addCard = async (card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;
    
    // Create optimistic card for immediate UI feedback
    const optimisticId = generateUUID();
    const newCard: CreditCard = {
      ...card,
      id: optimisticId,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    
    setCards(prev => [...prev, newCard]);

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert([{ 
          user_id: userId,
          name: card.name,
          color: card.color,
          closing_day: card.closing_day,
          due_day: card.due_day,
          limit: card.limit || null
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      // Update with real ID from database
      if (data) {
        setCards(prev => prev.map(c => c.id === optimisticId ? data : c));
      }
    } catch (err) {
      console.error('Error saving card:', err);
      // Revert optimistic update
      setCards(prev => prev.filter(c => c.id !== optimisticId));
    }
  };

  const updateCard = async (id: string, updates: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at'>>) => {
    if (!userId) return;
    
    // Optimistic update
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    try {
      const { error } = await supabase
        .from('credit_cards')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating card:', err);
      // Ideally rollback here, but for simplicity we reload
      loadCards();
    }
  };

  const deleteCard = async (id: string) => {
    if (!userId) return;
    
    // Optimistic delete
    setCards(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting card:', err);
      // Rollback
      loadCards();
    }
  };

  return { cards, loading, addCard, updateCard, deleteCard };
}
