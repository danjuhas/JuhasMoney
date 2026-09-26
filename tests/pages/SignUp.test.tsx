import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUp from '../../src/pages/SignUp';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

const mockUpdatePreferences = vi.fn();
vi.mock('../../src/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    updatePreferences: mockUpdatePreferences,
  }),
}));

const mockSignUp = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signUp: (...args: any[]) => mockSignUp(...args),
    },
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

describe('SignUp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the signup form', () => {
    render(<SignUp />);
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });

  it('should show error if passwords do not match', async () => {
    render(<SignUp />);
    
    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
    
    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 6 caracteres');
    const confirmInput = screen.getByPlaceholderText('Digite sua senha novamente');

    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
    });
    
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('should call supabase signUp and navigate on success', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null, data: { session: { user: { id: '123' } } } });
    
    render(<SignUp />);
    
    fireEvent.change(screen.getByPlaceholderText('Seu nome'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
    
    const passwordInputs = screen.getAllByPlaceholderText('Mínimo 6 caracteres');
    const confirmInput = screen.getByPlaceholderText('Digite sua senha novamente');

    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: { name: 'Test User' } }
      });
      expect(mockUpdatePreferences).toHaveBeenCalledWith({ name: 'Test User' });
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });
});
