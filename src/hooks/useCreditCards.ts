import { useState, useEffect } from 'react';
import type { CreditCard } from '../types';

export function useCreditCards(userId: string | null) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }

    const loadCards = async () => {
      try {
        setLoading(true);
        // Supabase strategy: for now we try to fetch if table exists, otherwise fallback to localStorage
        // Since we are mocking mostly, we just use localStorage
        const localCards = localStorage.getItem(`juhas_cards_${userId}`);
        if (localCards) {
          setCards(JSON.parse(localCards));
        }
      } catch (err) {
        console.error('Error loading cards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [userId]);

  const saveCards = (newCards: CreditCard[]) => {
    if (!userId) return;
    setCards(newCards);
    localStorage.setItem(`juhas_cards_${userId}`, JSON.stringify(newCards));
  };

  const addCard = (card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) return;
    const newCard: CreditCard = {
      ...card,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    saveCards([...cards, newCard]);
  };

  const updateCard = (id: string, updates: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at'>>) => {
    const newCards = cards.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCards(newCards);
  };

  const deleteCard = (id: string) => {
    saveCards(cards.filter(c => c.id !== id));
  };

  return { cards, loading, addCard, updateCard, deleteCard };
}
