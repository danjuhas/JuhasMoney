import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Logout from '../../src/pages/Logout';

const mockSignOut = vi.fn();
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: () => mockSignOut(),
    },
  },
}));

describe('Logout Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as Location;
    
    Object.defineProperty(window, 'localStorage', { value: { clear: vi.fn() }, configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: { clear: vi.fn() }, configurable: true });
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should render the loading spinner and sign out text', () => {
    render(<Logout />);
    expect(screen.getByText('Saindo com segurança...')).toBeInTheDocument();
  });

  it('should call supabase signOut, clear storages and redirect to login', async () => {
    render(<Logout />);
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
    
    expect(window.localStorage.clear).toHaveBeenCalled();
    expect(window.sessionStorage.clear).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });
});
