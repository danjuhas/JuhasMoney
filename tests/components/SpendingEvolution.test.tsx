import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpendingEvolution } from '../../src/components/SpendingEvolution';
import type { Expense, Category } from '../../src/types';

// Mock ResizeObserver for Recharts
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock the preferences context to provide a currency
vi.mock('../../src/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    preferences: { currency: 'BRL' }
  })
}));

describe('SpendingEvolution Component', () => {
  const mockCategories: Category[] = [
    { id: 'c1', name: 'Mercado', user_id: 'u1', type: 'expense', icon: 'cart', color: '#000' }
  ];

  const mockExpenses: Expense[] = [
    { id: 'e1', user_id: 'u1', description: 'Assai', amount: 300, type: 'expense', category_id: 'c1', created_at: '2026-09-10T12:00:00Z', is_fixed: false, is_paid: false }
  ];

  const selectedMonth = '2026-09';

  it('renders search input and initial empty state', () => {
    render(
      <SpendingEvolution 
        allExpenses={mockExpenses} 
        categories={mockCategories} 
        selectedMonth={selectedMonth} 
      />
    );

    expect(screen.getByPlaceholderText(/Busque por despesa ou categoria/i)).toBeInTheDocument();
    expect(screen.getByText(/Digite o nome de uma despesa ou categoria/i)).toBeInTheDocument();
  });

  it('renders empty state when search term yields no results', () => {
    render(
      <SpendingEvolution 
        allExpenses={mockExpenses} 
        categories={mockCategories} 
        selectedMonth={selectedMonth} 
      />
    );

    const input = screen.getByPlaceholderText(/Busque por despesa ou categoria/i);
    fireEvent.change(input, { target: { value: 'Posto' } });

    expect(screen.getByText(/Nenhum histórico encontrado para "Posto"/i)).toBeInTheDocument();
  });

  it('renders charts and metrics when data matches the search term', () => {
    render(
      <SpendingEvolution 
        allExpenses={mockExpenses} 
        categories={mockCategories} 
        selectedMonth={selectedMonth} 
      />
    );

    const input = screen.getByPlaceholderText(/Busque por despesa ou categoria/i);
    // Search for Assai
    fireEvent.change(input, { target: { value: 'Assai' } });

    // The component should render the Total, Average and Trend metrics
    expect(screen.getByText(/Total \(6m\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Média Mensal/i)).toBeInTheDocument();
    expect(screen.getByText(/Tendência \(vs Média\)/i)).toBeInTheDocument();
    
    // Total should be 300 (since there's only one expense of 300)
    // Wait, the currency format uses R$ for BRL. Since it might use non-breaking spaces or different formats based on the environment,
    // let's just search for the number "300"
    const amounts = screen.getAllByText(/300/);
    expect(amounts.length).toBeGreaterThan(0);
  });
});
