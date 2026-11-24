import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpdatePassword from '../../src/pages/UpdatePassword';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: '123' } } } });
const mockOnAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt', changeLanguage: vi.fn() }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

describe('UpdatePassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate being on the recovery page
    window.location.hash = '#access_token=test-token&type=recovery';
  });

  it('should render the update password form', async () => {
    render(<UpdatePassword />);
    
    await waitFor(() => {
      expect(screen.getByText('auth.update_password_title')).toBeInTheDocument();
    });
  });

  it('should show error if passwords do not match', async () => {
    render(<UpdatePassword />);
    
    const passwordInputs = screen.getAllByPlaceholderText('auth.new_password_min_chars');
    const confirmInput = screen.getByPlaceholderText('auth.confirm_new_password_placeholder');

    fireEvent.change(passwordInputs[0], { target: { value: 'newpass123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpass456' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'auth.save_new_password' }));

    await waitFor(() => {
      expect(screen.getByText('auth.error_password_mismatch')).toBeInTheDocument();
    });
    
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('should call updateUser and navigate on success', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: null });
    
    render(<UpdatePassword />);
    
    const passwordInputs = screen.getAllByPlaceholderText('auth.new_password_min_chars');
    const confirmInput = screen.getByPlaceholderText('auth.confirm_new_password_placeholder');

    fireEvent.change(passwordInputs[0], { target: { value: 'newpass123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpass123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'auth.save_new_password' }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpass123' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
