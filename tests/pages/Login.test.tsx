import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../src/pages/Login';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

const mockSignIn = vi.fn();
const mockResetPassword = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPassword(...args),
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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form', () => {
    render(<Login />);
    expect(screen.getByText('JuhasMoney')).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null, data: { session: { user: { id: '123' } } } });
    
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      
    });
  });

  it('should handle reset password request', async () => {
    mockResetPassword.mockResolvedValueOnce({ error: null });
    
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
    
    fireEvent.click(screen.getByText('Esqueceu a senha?'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/update-password'),
      });
      expect(screen.getByText('Se o e-mail existir, você receberá um link de redefinição de senha.')).toBeInTheDocument();
    });
  });
});
