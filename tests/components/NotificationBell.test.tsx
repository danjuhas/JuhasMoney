import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBell } from '../../src/components/NotificationBell';
import * as useNotificationsHook from '../../src/hooks/useNotifications';

// Mock the hooks
vi.mock('../../src/hooks/useNotifications', () => ({
  useNotifications: vi.fn()
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
describe('NotificationBell', () => {
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockOnNotificationClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (notifications: any[], unreadCount: number) => {
    vi.mocked(useNotificationsHook.useNotifications).mockReturnValue({
      notifications,
      unreadCount,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      reload: vi.fn()
    });
  };

  it('should not render anything if userId is null', () => {
    setupMock([], 0);
    const { container } = render(<NotificationBell userId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the bell icon without badge if unreadCount is 0', () => {
    setupMock([], 0);
    render(<NotificationBell userId="user-1" />);
    
    const button = screen.getByRole('button', { name: /notificações/i });
    expect(button).toBeInTheDocument();
    
    // Check if the red badge is NOT rendered
    const badge = screen.queryByText(/^[0-9+]+$/);
    expect(badge).not.toBeInTheDocument();
  });

  it('should render the bell icon with correct badge count', () => {
    setupMock([], 3);
    render(<NotificationBell userId="user-1" />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render "9+" if unreadCount is greater than 9', () => {
    setupMock([], 12);
    render(<NotificationBell userId="user-1" />);
    
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('should open dropdown when clicked and show empty state', () => {
    setupMock([], 0);
    render(<NotificationBell userId="user-1" />);
    
    // Dropdown should be hidden initially
    expect(screen.queryByText('notifications.all_good')).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(button);

    // Dropdown should be visible
    expect(screen.getByText('notifications.all_good')).toBeInTheDocument();
  });

  it('should render notifications in dropdown and trigger click handlers', () => {
    const mockNotifications = [
      {
        id: 'n1',
        title: 'Test Title',
        message: 'Test Message',
        is_read: false,
        type: 'WARNING',
        related_expense_ids: ['exp-1']
      }
    ];
    setupMock(mockNotifications, 1);
    
    render(
      <NotificationBell 
        userId="user-1" 
        onNotificationClick={mockOnNotificationClick} 
      />
    );
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    // Check notification content
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();

    // Click the notification
    const notifElement = screen.getByText('Test Title').closest('div')?.parentElement;
    if (notifElement) {
      fireEvent.click(notifElement);
    }

    // Assert handlers were called
    expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
    expect(mockOnNotificationClick).toHaveBeenCalledWith(['exp-1']);
    
    // Dropdown should be closed after click
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });
});
