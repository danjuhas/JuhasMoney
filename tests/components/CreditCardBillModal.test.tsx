import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreditCardBillModal } from '../../src/components/CreditCardBillModal';
import type { Expense, CreditCard, Category } from '../../src/types';

// Mock the react-i18next hook
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
const mockPreferences = {
  currency: 'BRL',
  theme: 'dark'
};

const dummyCard: CreditCard = {
  id: 'card-1',
  user_id: 'user-1',
  name: 'Test Card',
  color: '#000000',
  closing_day: 15,
  due_day: 25,
  created_at: '2026-09-01T00:00:00Z'
};

const dummyCategories: Category[] = [
  { id: 'cat-1', name: 'Food', color: 'bg-red-500', icon: 'pizza', type: 'expense', user_id: 'user-1', created_at: '2026-01-01' }
];

vi.mock('../../src/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    preferences: { currency: 'BRL', theme: 'dark' },
    updatePreferences: vi.fn()
  }),
  PreferencesProvider: ({ children }: any) => <div>{children}</div>
}));

describe('CreditCardBillModal Component', () => {
  it('should display the empty state when there are no expenses for the bill', () => {
    render(
      <CreditCardBillModal
        cardId="card-1"
        onClose={vi.fn()}
        expenses={[]}
        categories={dummyCategories}
        cards={[dummyCard]}
        initialMonth="2026-09"
        onDeleteExpense={vi.fn()}
        onEditExpense={vi.fn()}
        preferences={mockPreferences}
      />
    );

    // Assert that the empty state text is rendered
    expect(screen.getByText('Nenhuma despesa para esta fatura.')).toBeInTheDocument();
  });

  it('should display the "Fatura Paga" tag when all expenses are paid', () => {
    const paidExpenses: Expense[] = [
      {
        id: 'exp-1',
        user_id: 'user-1',
        description: 'Test Expense',
        amount: 100,
        type: 'expense',
        category_id: 'cat-1',
        created_at: '2026-09-10T10:00:00Z',
        is_paid: true,
        credit_card_id: 'card-1',
        due_day: 25
      }
    ];

    render(
      <CreditCardBillModal
        cardId="card-1"
        onClose={vi.fn()}
        expenses={paidExpenses}
        categories={dummyCategories}
        cards={[dummyCard]}
        initialMonth="2026-09"
        onDeleteExpense={vi.fn()}
        onEditExpense={vi.fn()}
        preferences={mockPreferences}
      />
    );

    // Assert that the paid tag is rendered
    expect(screen.getByText('Fatura Paga')).toBeInTheDocument();
  });
});
