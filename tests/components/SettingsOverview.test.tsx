import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsOverview } from '../../src/components/SettingsOverview';
import { PreferencesProvider } from '../../src/contexts/PreferencesContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Category, Expense } from '../../src/types';

// Mock translations
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food',
    type: 'expense',
    icon: 'Coffee',
    color: 'bg-rose-500',
    user_id: 'user-1'
  },
  {
    id: 'cat-2',
    name: 'Salary',
    type: 'income',
    icon: 'DollarSign',
    color: 'bg-emerald-500',
    user_id: 'user-1'
  }
];

const mockFixedExpenses: Expense[] = [];

describe('SettingsOverview - Category Management', () => {
  const mockDeleteCategory = vi.fn();
  const mockAddCategory = vi.fn();
  const mockUpdateCategory = vi.fn();
  const mockOpenFixedModal = vi.fn();
  const mockHandleEditFixedExpense = vi.fn();
  const mockHandleDeleteFixedExpense = vi.fn();
  const mockHandleSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <PreferencesProvider>
        <SettingsOverview
          categories={mockCategories}
          fixedExpenses={mockFixedExpenses}
          openFixedModal={mockOpenFixedModal}
          handleEditFixedExpense={mockHandleEditFixedExpense}
          handleDeleteFixedExpense={mockHandleDeleteFixedExpense}
          addCategory={mockAddCategory}
          updateCategory={mockUpdateCategory}
          deleteCategory={mockDeleteCategory}
          handleSignOut={mockHandleSignOut}
          userId="user-1"
        />
      </PreferencesProvider>
    );
  };

  it('should render the list of categories', () => {
    renderComponent();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('should open the delete confirmation modal when clicking the delete button', () => {
    renderComponent();
    
    const deleteButtons = screen.getAllByTitle('Excluir categoria');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('modal.delete_category_title')).toBeInTheDocument();
    expect(screen.getByText('modal.delete_category_desc')).toBeInTheDocument();
  });

  it('should call deleteCategory and close modal when confirming deletion', () => {
    renderComponent();
    
    const deleteButtons = screen.getAllByTitle('Excluir categoria');
    fireEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByText('modal.delete');
    fireEvent.click(confirmButton);

    expect(mockDeleteCategory).toHaveBeenCalledTimes(1);
    expect(mockDeleteCategory).toHaveBeenCalledWith('cat-1');
  });

  it('should not call deleteCategory when cancelling deletion', () => {
    renderComponent();
    
    const deleteButtons = screen.getAllByTitle('Excluir categoria');
    fireEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByText('modal.cancel');
    fireEvent.click(cancelButton);

    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });
});

