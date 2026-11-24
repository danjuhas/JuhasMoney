import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvestmentsOverview } from '../../src/components/InvestmentsOverview';
import { PreferencesProvider } from '../../src/contexts/PreferencesContext';
import type { Investment, InvestmentTransaction } from '../../src/types';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => (key === 'dashboard.locale' ? 'pt-BR' : key),
    }),
  };
});

// Mock Recharts ResponsiveContainer for JSDOM
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 300, height: 200 }}>{children}</div>
    ),
  };
});

const mockInvestments: Investment[] = [
  {
    id: 'inv-1',
    user_id: 'user-1',
    name: 'Nubank Emergency Fund',
    category: 'emergency',
    color: '#10b981',
    target_amount: 10000,
    created_at: '2026-10-01T12:00:00Z',
  },
];

const mockTransactions: InvestmentTransaction[] = [
  {
    id: 'tx-1',
    investment_id: 'inv-1',
    user_id: 'user-1',
    type: 'contribution',
    amount: 2500,
    date: '2026-10-01T12:00:00Z',
    created_at: '2026-10-01T12:00:00Z',
  },
];

describe('InvestmentsOverview Component', () => {
  const mockAddInvestment = vi.fn().mockResolvedValue(undefined);
  const mockUpdateInvestment = vi.fn().mockResolvedValue(undefined);
  const mockDeleteInvestment = vi.fn().mockResolvedValue(undefined);
  const mockAddTransaction = vi.fn().mockResolvedValue(undefined);
  const mockAdjustBalance = vi.fn().mockResolvedValue(undefined);
  const mockDeleteTransaction = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    investments = mockInvestments,
    transactions = mockTransactions
  ) =>
    render(
      <PreferencesProvider>
        <InvestmentsOverview
          investments={investments}
          transactions={transactions}
          addInvestment={mockAddInvestment}
          updateInvestment={mockUpdateInvestment}
          deleteInvestment={mockDeleteInvestment}
          addInvestmentTransaction={mockAddTransaction}
          adjustInvestmentBalance={mockAdjustBalance}
          deleteInvestmentTransaction={mockDeleteTransaction}
        />
      </PreferencesProvider>
    );

  it('should render empty state when no investments exist', () => {
    renderComponent([], []);
    expect(screen.getByText('investments.empty_title')).toBeInTheDocument();
    expect(screen.getByText('investments.create_first')).toBeInTheDocument();
  });

  it('should render investment cards and portfolio summary', () => {
    renderComponent();
    expect(screen.getByText('Nubank Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument(); // 2500 / 10000 target
  });

  it('should open create modal and call addInvestment with initial balance', async () => {
    renderComponent([], []);

    fireEvent.click(screen.getByText('investments.create_first'));

    const nameInput = screen.getByPlaceholderText('investments.name_placeholder');
    fireEvent.change(nameInput, { target: { value: 'Treasury Selic' } });

    const numberInputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(numberInputs[0], { target: { value: '1200' } }); // Initial balance

    fireEvent.click(screen.getByText('dashboard.save'));

    await waitFor(() => {
      expect(mockAddInvestment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Treasury Selic',
          category: 'emergency',
        }),
        1200
      );
    });
  });

  it('should block withdrawal larger than current balance and display error', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('investments.withdraw'));

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '5000' } }); // Exceeds 2500 balance

    fireEvent.click(screen.getByText('dashboard.save'));

    expect(
      screen.getByText('investments.error_insufficient_balance')
    ).toBeInTheDocument();
    expect(mockAddTransaction).not.toHaveBeenCalled();
  });

  it('should call adjustInvestmentBalance when updating total balance', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('investments.update_balance'));

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '2650' } });

    fireEvent.click(screen.getByText('dashboard.save'));

    await waitFor(() => {
      expect(mockAdjustBalance).toHaveBeenCalledWith('inv-1', 2650, undefined);
    });
  });

  it('should display validation error when submitting negative or invalid amount in contribute modal', () => {
    renderComponent();

    fireEvent.click(screen.getByText('investments.contribute'));

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '0' } });

    fireEvent.click(screen.getByText('dashboard.save'));

    expect(screen.getByText('investments.error_invalid_amount')).toBeInTheDocument();
    expect(mockAddTransaction).not.toHaveBeenCalled();
  });

  it('should open details modal on card click and allow deleting a history transaction', () => {
    renderComponent();

    fireEvent.click(screen.getByText('Nubank Emergency Fund'));

    expect(screen.getByText('investments.history_title')).toBeInTheDocument();

    const deleteButtons = screen.getAllByTitle('item.delete');
    // The last delete button belongs to the transaction history row
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(mockDeleteTransaction).toHaveBeenCalledWith('tx-1');
  });

  it('should open delete confirmation modal and delete the investment asset box', async () => {
    renderComponent();

    const deleteButtons = screen.getAllByTitle('item.delete');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('investments.delete_title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('modal.delete'));

    await waitFor(() => {
      expect(mockDeleteInvestment).toHaveBeenCalledWith('inv-1');
    });
  });
});
