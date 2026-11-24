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

const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt', changeLanguage: mockChangeLanguage }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form and language switcher', () => {
    render(<Login />);
    expect(screen.getByText('JuhasMoney')).toBeInTheDocument();
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
  });

  it('should allow switching language from the login screen before onboarding', () => {
    render(<Login />);
    fireEvent.click(screen.getByText('EN'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('should handle successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null, data: { session: { user: { id: '123' } } } });
    
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('auth.email_placeholder'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('auth.password_placeholder'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'auth.sign_in' }));

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
    
    fireEvent.change(screen.getByPlaceholderText('auth.email_placeholder'), { target: { value: 'test@example.com' } });
    
    fireEvent.click(screen.getByText('auth.forgot_password'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/update-password'),
      });
      expect(screen.getByText('auth.reset_sent')).toBeInTheDocument();
    });
  });
});
