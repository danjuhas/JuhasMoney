import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransactions } from '../../src/hooks/useTransactions';

// Supabase mock
const chainableMock = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
  catch: vi.fn().mockReturnThis(),
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainableMock),
  },
}));

describe('useTransactions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize empty when no user is provided', async () => {
    const { result } = renderHook(() => useTransactions(null));
    expect(result.current.expenses).toEqual([]);
    expect(result.current.categories).toEqual([]);
  });

  it('should fetch data when user is provided', async () => {
    // Override the mock to return specific data
    chainableMock.then.mockImplementationOnce((resolve) => resolve({ data: [{ id: 'exp1' }], error: null }))
                      .mockImplementationOnce((resolve) => resolve({ data: [{ id: 'cat1' }], error: null }));

    const { result } = renderHook(() => useTransactions('user-123'));

    await waitFor(() => {
      expect(result.current.expenses).toEqual([{ id: 'exp1' }]);
    });
    
    expect(result.current.categories).toEqual([{ id: 'cat1' }]);
  });

  it('should trigger cascading delete for installments on Supabase', async () => {
    chainableMock.then.mockImplementationOnce((resolve) => resolve({ 
        data: [{ id: 'exp1', group_id: 'group1', created_at: '2026-05-10T10:00:00Z', is_fixed: false, type: 'expense' }], 
        error: null 
      }))
      .mockImplementationOnce((resolve) => resolve({ data: [], error: null })); // categories

    const { result } = renderHook(() => useTransactions('user-123'));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    // Capture the mock call to verify chaining
    chainableMock.delete.mockClear();
    chainableMock.eq.mockClear();
    chainableMock.gte.mockClear();

    act(() => {
      result.current.deleteExpense('exp1', '2026-05', false);
    });

    // Verify it optimistically removed from local state
    expect(result.current.expenses).toHaveLength(0);

    // Verify it called Supabase correctly with group_id and gte created_at
    expect(chainableMock.delete).toHaveBeenCalled();
    expect(chainableMock.eq).toHaveBeenCalledWith('group_id', 'group1');
    expect(chainableMock.gte).toHaveBeenCalledWith('created_at', '2026-05-10T10:00:00Z');
  });
});
