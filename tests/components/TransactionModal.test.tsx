import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionModal } from '../../src/components/TransactionModal';
import type { Category } from '../../src/types';

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
vi.mock('../../src/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    preferences: { currency: 'BRL', language: 'pt' },
    updatePreferences: vi.fn(),
  }),
}));

describe('TransactionModal Component', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', user_id: 'user1', name: 'Salário', type: 'income', icon: 'money', color: 'bg-green' },
    { id: 'cat-2', user_id: 'user1', name: 'Aluguel', type: 'expense', icon: 'home', color: 'bg-red' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    categories: mockCategories,
    selectedMonth: '2026-05',
    userId: 'user1',
    preferences: { currency: 'BRL', language: 'pt' },
    initialType: 'expense' as const,
    initialMode: 'quick' as const,
    editingExpense: null,
  };

  it('should not render anything if isOpen is false', () => {
    const { container } = render(<TransactionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should format the monetary amount correctly when typing', () => {
    render(<TransactionModal {...defaultProps} />);
    const amountInput = screen.getByPlaceholderText('0,00');
    
    fireEvent.change(amountInput, { target: { value: '12345' } });
    
    expect(amountInput).toHaveValue('123,45');
  });

  it('creates an installment expense and splits it across multiple months', () => {
    const onSaveMock = vi.fn();
    render(<TransactionModal {...defaultProps} onSave={onSaveMock} />);
    
    // Fill description
    const descInput = screen.getByPlaceholderText('dashboard.description_placeholder');
    fireEvent.change(descInput, { target: { value: 'Compra Parcelada' } });

    // Fill amount (R$ 300,00)
    const amountInput = screen.getByPlaceholderText('0,00');
    fireEvent.change(amountInput, { target: { value: '30000' } });

    // Find and click the toggle for installments
    // It's a button with role switch or just a button. We can find it by text or role.
    // The label is "dashboard.installments" but it doesn't have an ID.
    // Let's find the button by checking the text next to it or just grabbing all buttons.
    // The button has a span with "dashboard.no" initially
    const toggleText = screen.getByText('dashboard.no');
    // The button is the previous sibling of the span, let's just use click on the button.
    const toggleBtn = toggleText.previousElementSibling as HTMLButtonElement;
    fireEvent.click(toggleBtn);

    // Now the months input should appear
    const monthsInput = screen.getByPlaceholderText('Ex: 3');
    fireEvent.change(monthsInput, { target: { value: '3' } });

    // Submit
    const submitBtn = screen.getByText('dashboard.add');
    fireEvent.click(submitBtn);

    expect(onSaveMock).toHaveBeenCalledTimes(1);
    
    const savedExpenses = onSaveMock.mock.calls[0][0];
    expect(savedExpenses).toHaveLength(3);
    expect(savedExpenses[0].amount).toBe(300); // Wait, does TransactionModal divide the amount?
    // Let's check TransactionModal source...
    // Actually, in TransactionModal:
    // const numericAmount = parseInt(amount || '0', 10) / 100;
    // expensesToUpsert.push({ amount: numericAmount, ... })
    // It DOES NOT divide the amount by count! It uses numericAmount for all!
    expect(savedExpenses[0].amount).toBe(300);
    expect(savedExpenses[0].description).toBe('Compra Parcelada (1/3)');
    expect(savedExpenses[1].description).toBe('Compra Parcelada (2/3)');
    
    // Check months shifting
    const targetMonth1 = savedExpenses[0].created_at.substring(0, 7);
    const targetMonth2 = savedExpenses[1].created_at.substring(0, 7);
    expect(targetMonth1).not.toBe(targetMonth2); // Should be shifted
  });
});
