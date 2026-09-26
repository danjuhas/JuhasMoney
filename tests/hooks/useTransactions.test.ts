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
  in: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
  catch: vi.fn().mockReturnThis(),
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => chainableMock),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'dashboard.locale') return 'pt-BR';
      if (key === 'analytics.search_placeholder') return 'Busque por despesa ou categoria (ex: Uber, Mercado)...';
      if (key === 'dashboard.bill_empty') return 'Nenhuma despesa para esta fatura.';
      if (key === 'dashboard.bill_paid') return 'Fatura Paga';
      return key;
    },
    i18n: { language: 'pt' }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
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
    await waitFor(() => expect(result.current.loading).toBe(false));

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
    await waitFor(() => expect(result.current.loading).toBe(false));

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

  it('should add to excluded_months when deleting a fixed expense for a single future month', async () => {
    chainableMock.then.mockImplementationOnce((resolve) => resolve({ 
        data: [{ 
          id: 'exp_fixed', 
          created_at: '2026-01-10T10:00:00Z', 
          is_fixed: true, 
          type: 'expense',
          excluded_months: [] 
        }], 
        error: null 
      }))
      .mockImplementationOnce((resolve) => resolve({ data: [], error: null })); 

    const { result } = renderHook(() => useTransactions('user-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    chainableMock.update.mockClear();
    chainableMock.eq.mockClear();

    act(() => {
      // Delete specifically for May 2026, without deleting all
      result.current.deleteExpense('exp_fixed', '2026-05', false);
    });

    // It should optimistically update the local state to include the excluded month
    expect(result.current.expenses[0].excluded_months).toContain('2026-05');

    // It should call supabase.update with the excluded_months array
    expect(chainableMock.update).toHaveBeenCalledWith({ excluded_months: ['2026-05'] });
    expect(chainableMock.eq).toHaveBeenCalledWith('id', 'exp_fixed');
  });

  it('should call upsert on supabase when upsertExpenses is called', async () => {
    const { result } = renderHook(() => useTransactions('user-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    chainableMock.upsert.mockClear();

    const mockExpenses = [{ id: 'new_exp', description: 'Test', amount: 100, type: 'expense' as const, created_at: '2026-05-10T12:00:00Z', is_fixed: false }];
    
    act(() => {
      result.current.upsertExpenses(mockExpenses);
    });

    expect(result.current.expenses).toContainEqual(mockExpenses[0]);
    expect(chainableMock.upsert).toHaveBeenCalledWith(mockExpenses);
  });

  it('should mark all passed expenses as paid via payMultipleExpenses', async () => {
    const { result } = renderHook(() => useTransactions('user-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Setup initial expenses inside the hook by upserting them first
    const mockExpenses = [
      { id: 'exp_1', description: 'Normal', amount: 50, type: 'expense', created_at: '2026-05-10T12:00:00Z', is_fixed: false, is_paid: false },
      { id: 'exp_2', description: 'Fixed', amount: 50, type: 'expense', created_at: '2026-05-10T12:00:00Z', is_fixed: true, paid_months: [] }
    ];
    
    act(() => {
      result.current.upsertExpenses(mockExpenses as any);
    });
    
    chainableMock.upsert.mockClear();

    await act(async () => {
      await result.current.payMultipleExpenses(['exp_1', 'exp_2'], '2026-05');
    });

    const exp1 = result.current.expenses.find(e => e.id === 'exp_1');
    const exp2 = result.current.expenses.find(e => e.id === 'exp_2');

    expect(exp1?.is_paid).toBe(true);
    expect(exp2?.paid_months).toContain('2026-05');

    expect(chainableMock.upsert).toHaveBeenCalled();
  });

  it('should safely remove month string from fixed expenses in unpayMultipleExpenses', async () => {
    
    const { result } = renderHook(() => useTransactions('user-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    const mockExpenses = [
      { id: 'exp_3', description: 'Normal', amount: 50, type: 'expense', created_at: '2026-05-10T12:00:00Z', is_fixed: false, is_paid: true },
      { id: 'exp_4', description: 'Fixed', amount: 50, type: 'expense', created_at: '2026-05-10T12:00:00Z', is_fixed: true, paid_months: ['2026-04', '2026-05', '2026-06'] }
    ];
    
    act(() => {
      result.current.upsertExpenses(mockExpenses as any);
    });
    
    chainableMock.upsert.mockClear();

    await act(async () => {
      await result.current.unpayMultipleExpenses(['exp_3', 'exp_4'], '2026-05');
    });

    const exp3 = result.current.expenses.find(e => e.id === 'exp_3');
    const exp4 = result.current.expenses.find(e => e.id === 'exp_4');

    expect(exp3?.is_paid).toBe(false);
    expect(exp4?.paid_months).toEqual(['2026-04', '2026-06']); // 2026-05 is removed securely

    expect(chainableMock.upsert).toHaveBeenCalled();
  });

  it('should call delete on supabase when deleteMultipleExpenses is triggered', async () => {
    const { result } = renderHook(() => useTransactions('user-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    chainableMock.delete.mockClear();
    
    await act(async () => {
      await result.current.deleteMultipleExpenses(['exp_1', 'exp_2']);
    });
    
    expect(chainableMock.delete).toHaveBeenCalled();
  });
});
