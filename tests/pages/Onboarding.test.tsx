import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from '../../src/pages/Onboarding';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt', changeLanguage: vi.fn() }
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUpdatePreferences = vi.fn();
vi.mock('../../src/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    preferences: { onboarding_completed: false, currency: 'BRL' },
    updatePreferences: mockUpdatePreferences,
  }),
}));

const mockAddCategory = vi.fn();
const mockUpsertExpenses = vi.fn();
vi.mock('../../src/hooks/useTransactions', () => ({
  useTransactions: () => ({
    categories: [],
    addCategory: mockAddCategory,
    deleteCategory: vi.fn(),
    upsertExpenses: mockUpsertExpenses,
  }),
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user123', user_metadata: { first_name: 'Danilo' } } } } }),
    },
  },
}));

describe('Onboarding Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render step 1 initially', async () => {
    render(<Onboarding />);
    
    await waitFor(() => {
      // It should display the welcome message
      expect(screen.getByText(/onboarding\.welcome/i)).toBeInTheDocument();
    });
    
    // Check if step 1 next button exists
    expect(screen.getByText('onboarding.next')).toBeInTheDocument();
  });

  it('should navigate through the wizard steps', async () => {
    render(<Onboarding />);
    
    await waitFor(() => {
      expect(screen.getByText('onboarding.next')).toBeInTheDocument();
    });

    // Go to Step 2
    fireEvent.click(screen.getByText('onboarding.next'));
    await waitFor(() => expect(screen.getByText('onboarding.categories_title')).toBeInTheDocument());

    // Go to Step 3
    fireEvent.click(screen.getByText('onboarding.next'));
    await waitFor(() => expect(screen.getByText('onboarding.income_title')).toBeInTheDocument());

    // Go to Step 4 (By skipping income)
    fireEvent.click(screen.getByText('onboarding.skip'));
    await waitFor(() => expect(screen.getByText('onboarding.fixed_expenses_title')).toBeInTheDocument());
  });

  it('should call updatePreferences on finish', async () => {
    render(<Onboarding />);
    
    await waitFor(() => {
      expect(screen.getByText('onboarding.next')).toBeInTheDocument();
    });

    // Jump to step 4
    fireEvent.click(screen.getByText('onboarding.next')); // 2
    await waitFor(() => expect(screen.getByText('onboarding.categories_title')).toBeInTheDocument());
    fireEvent.click(screen.getByText('onboarding.next')); // 3
    await waitFor(() => expect(screen.getByText('onboarding.income_title')).toBeInTheDocument());
    fireEvent.click(screen.getByText('onboarding.skip')); // 4
    await waitFor(() => expect(screen.getByText('onboarding.fixed_expenses_title')).toBeInTheDocument());

    // Click finish
    const finishBtn = screen.getByText('onboarding.skip_finish');
    fireEvent.click(finishBtn);

    expect(mockUpdatePreferences).toHaveBeenCalledWith({ onboarding_completed: true });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
