import { render, screen, fireEvent } from '@testing-library/react';
import { CreditCardTransactionModal } from '../../src/components/CreditCardTransactionModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key === 'dashboard.locale' ? 'pt-BR' : key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  }
}));

const mockCategories = [{ id: 'cat1', name: 'Food', type: 'expense', icon: 'food', color: 'red' }];
const mockCards = [{ id: 'card1', name: 'Nubank', color: 'purple', closing_day: 10, due_day: 15 }];

describe('CreditCardTransactionModal Component', () => {
  const onSaveMock = vi.fn();
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreditCardTransactionModal
        isOpen={false}
        onClose={onCloseMock}
        onSave={onSaveMock}
        userId="user1"
        categories={mockCategories}
        cards={mockCards}
        preferences={{ currency: 'BRL' }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <CreditCardTransactionModal
        isOpen={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        userId="user1"
        categories={mockCategories}
        cards={mockCards}
        preferences={{ currency: 'BRL' }}
      />
    );
    expect(screen.getByText('dashboard.description')).toBeDefined();
  });

  it('resets form state when modal opens', () => {
    const { rerender } = render(
      <CreditCardTransactionModal
        isOpen={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        userId="user1"
        categories={mockCategories}
        cards={mockCards}
        preferences={{ currency: 'BRL' }}
      />
    );

    const input = screen.getByPlaceholderText('dashboard.description_placeholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test expense' } });
    expect(input.value).toBe('Test expense');

    rerender(
      <CreditCardTransactionModal
        isOpen={false}
        onClose={onCloseMock}
        onSave={onSaveMock}
        userId="user1"
        categories={mockCategories}
        cards={mockCards}
        preferences={{ currency: 'BRL' }}
      />
    );

    rerender(
      <CreditCardTransactionModal
        isOpen={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
        userId="user1"
        categories={mockCategories}
        cards={mockCards}
        preferences={{ currency: 'BRL' }}
      />
    );

    const inputAfter = screen.getByPlaceholderText('dashboard.description_placeholder') as HTMLInputElement;
    expect(inputAfter.value).toBe('');
  });
});
