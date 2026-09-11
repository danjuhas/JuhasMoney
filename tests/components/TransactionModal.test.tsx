import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionModal } from '../../src/components/TransactionModal';
import type { Category } from '../../src/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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
    transactionType: 'expense' as const,
    transactionMode: 'quick' as const,
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

});
