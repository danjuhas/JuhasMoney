import { describe, it, expect } from 'vitest';
import { matchCategoryLocally } from './localCategoryMatcher';
import type { Category, Expense } from '../types';

const categories: Category[] = [
  { id: 'cat-food', user_id: 'u1', name: 'Alimentação', type: 'expense' },
  { id: 'cat-transport', user_id: 'u1', name: 'Transporte', type: 'expense' },
  { id: 'cat-stream', user_id: 'u1', name: 'Assinaturas e Lazer', type: 'expense' },
  { id: 'cat-salary', user_id: 'u1', name: 'Salário', type: 'income' },
];

const pastExpenses: Expense[] = [
  {
    id: 'e1',
    user_id: 'u1',
    description: 'Padaria do João',
    amount: 25,
    type: 'expense',
    category_id: 'cat-food',
    created_at: '2026-04-01T12:00:00.000Z',
  },
  {
    id: 'e2',
    user_id: 'u1',
    description: 'Padaria do João',
    amount: 30,
    type: 'expense',
    category_id: 'cat-food',
    created_at: '2026-04-10T12:00:00.000Z',
  },
  {
    id: 'e3',
    user_id: 'u1',
    description: 'Curso Online (1/6)',
    amount: 100,
    type: 'expense',
    category_id: 'cat-stream',
    created_at: '2026-04-12T12:00:00.000Z',
  },
];

describe('localCategoryMatcher', () => {
  it('matches exact historical descriptions with high confidence', () => {
    const match = matchCategoryLocally('padaria do joao', 'expense', categories, pastExpenses);
    expect(match).toEqual({
      categoryId: 'cat-food',
      confidence: 'high',
      source: 'history',
    });
  });

  it('strips installment suffixes when matching history', () => {
    const match = matchCategoryLocally('Curso Online', 'expense', categories, pastExpenses);
    expect(match?.categoryId).toBe('cat-stream');
    expect(match?.source).toBe('history');
  });

  it('falls back to built-in keyword heuristics when no history exists', () => {
    const match = matchCategoryLocally('Uber para o aeroporto', 'expense', categories, []);
    expect(match).toEqual({
      categoryId: 'cat-transport',
      confidence: 'medium',
      source: 'keyword',
    });

    const netflixMatch = matchCategoryLocally('Netflix', 'expense', categories, []);
    expect(netflixMatch?.categoryId).toBe('cat-stream');
  });

  it('respects transaction type separation (income vs expense)', () => {
    const incomeMatch = matchCategoryLocally('Salário mensal', 'income', categories, []);
    expect(incomeMatch?.categoryId).toBe('cat-salary');

    const wrongTypeMatch = matchCategoryLocally('Uber', 'income', categories, []);
    expect(wrongTypeMatch).toBeNull();
  });

  it('returns null for very short descriptions or unknown items', () => {
    expect(matchCategoryLocally('a', 'expense', categories, pastExpenses)).toBeNull();
    expect(matchCategoryLocally('XYZ Widget Corp', 'expense', categories, pastExpenses)).toBeNull();
  });
});
