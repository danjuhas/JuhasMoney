import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInvestments } from '../../src/hooks/useInvestments';

const chainableMock = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainableMock),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('useInvestments Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty arrays when userId is null', async () => {
    const { result } = renderHook(() => useInvestments(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.investments).toEqual([]);
    expect(result.current.transactions).toEqual([]);
  });

  it('should create an investment and automatically record an initial balance contribution when initialBalance > 0', async () => {
    chainableMock.single
      .mockResolvedValueOnce({
        data: {
          id: 'inv-db-1',
          user_id: 'user-1',
          name: 'Emergency Fund',
          category: 'emergency',
          color: '#10b981',
          target_amount: 5000,
          created_at: '2026-11-23T12:00:00Z',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: 'tx-db-1',
          investment_id: 'inv-db-1',
          user_id: 'user-1',
          type: 'contribution',
          amount: 1000,
          date: '2026-11-23T12:00:00Z',
          notes: 'investments.note_initial_balance',
          created_at: '2026-11-23T12:00:00Z',
        },
        error: null,
      });

    const { result } = renderHook(() => useInvestments('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addInvestment(
        {
          name: 'Emergency Fund',
          category: 'emergency',
          color: '#10b981',
          target_amount: 5000,
        },
        1000
      );
    });

    expect(result.current.investments).toHaveLength(1);
    expect(result.current.investments[0].name).toBe('Emergency Fund');
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].amount).toBe(1000);
    expect(result.current.transactions[0].notes).toBe('investments.note_initial_balance');
  });

  it('should calculate positive and negative yield deltas in adjustInvestmentBalance and ignore zero delta', async () => {
    const { result } = renderHook(() => useInvestments('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Add initial contribution of 2000
    await act(async () => {
      await result.current.addInvestmentTransaction({
        investment_id: 'inv-1',
        type: 'contribution',
        amount: 2000,
      });
    });

    expect(result.current.transactions).toHaveLength(1);

    // Zero delta (new balance == 2000) -> should not create any transaction
    await act(async () => {
      await result.current.adjustInvestmentBalance('inv-1', 2000);
    });
    expect(result.current.transactions).toHaveLength(1);

    // Positive yield (new balance == 2150 -> delta +150)
    await act(async () => {
      await result.current.adjustInvestmentBalance('inv-1', 2150);
    });
    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions[0].type).toBe('yield');
    expect(result.current.transactions[0].amount).toBe(150);
    expect(result.current.transactions[0].notes).toBe('investments.note_yield_positive');

    // Negative yield / devaluation (new balance == 1900 -> delta -250)
    await act(async () => {
      await result.current.adjustInvestmentBalance('inv-1', 1900);
    });
    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.transactions[0].type).toBe('yield');
    expect(result.current.transactions[0].amount).toBe(-250);
    expect(result.current.transactions[0].notes).toBe('investments.note_yield_negative');
  });

  it('should delete an investment and cascade delete its transactions in state', async () => {
    const { result } = renderHook(() => useInvestments('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addInvestment(
        {
          name: 'Crypto Box',
          category: 'crypto',
          color: '#f59e0b',
        },
        500
      );
    });

    const createdId = result.current.investments[0].id;
    expect(result.current.investments).toHaveLength(1);
    expect(result.current.transactions).toHaveLength(1);

    await act(async () => {
      await result.current.deleteInvestment(createdId);
    });

    expect(result.current.investments).toHaveLength(0);
    expect(result.current.transactions).toHaveLength(0);
  });
});
