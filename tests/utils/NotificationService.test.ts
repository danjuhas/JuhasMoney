import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from '../../src/utils/NotificationService';
import type { Expense } from '../../src/types';

describe('NotificationService', () => {
  const userId = 'test-user-123';
  const mockStorageKey = `juhas_notifications_${userId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    // Mock current date to 2026-09-17 (mid-month for testing)
    vi.setSystemTime(new Date('2026-09-17T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty array when no notifications exist', () => {
    const notifications = NotificationService.getNotifications(userId);
    expect(notifications).toEqual([]);
  });

  it('should save and retrieve notifications correctly', () => {
    const mockNotification = {
      id: 'test-1',
      user_id: userId,
      title: 'Test',
      message: 'Test Message',
      is_read: false,
      created_at: new Date().toISOString(),
      type: 'INFO' as const
    };

    NotificationService.saveNotifications(userId, [mockNotification]);
    const retrieved = NotificationService.getNotifications(userId);
    
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe('test-1');
  });

  it('should clean up notifications older than 30 days', () => {
    const thirtyOneDaysAgo = new Date('2026-08-16T12:00:00Z');
    const twentyDaysAgo = new Date('2026-08-28T12:00:00Z');

    const oldNotification = { id: 'old', created_at: thirtyOneDaysAgo.toISOString() };
    const recentNotification = { id: 'recent', created_at: twentyDaysAgo.toISOString() };

    NotificationService.saveNotifications(userId, [oldNotification, recentNotification] as any);
    
    NotificationService.cleanOldNotifications(userId);
    
    const remaining = NotificationService.getNotifications(userId);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('recent');
  });

  describe('syncUpcomingExpenses', () => {
    it('should generate WARNING notification for expense due today', () => {
      const expenses: Expense[] = [
        {
          id: 'exp-1',
          user_id: userId,
          description: 'Electricity',
          amount: 150,
          type: 'expense',
          category_id: 'cat-1',
          created_at: '2026-09-01T00:00:00Z',
          due_day: 17, // Matches mocked today
        }
      ];

      NotificationService.syncUpcomingExpenses(userId, expenses);
      const notifications = NotificationService.getNotifications(userId);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('WARNING');
      expect(notifications[0].title).toBe('Conta vence hoje!');
      expect(notifications[0].message).toContain('Electricity');
      expect(notifications[0].related_expense_ids).toEqual(['exp-1']);
      expect(notifications[0].is_read).toBe(false);
    });

    it('should generate INFO notification for expense due tomorrow', () => {
      const expenses: Expense[] = [
        {
          id: 'exp-2',
          user_id: userId,
          description: 'Water',
          amount: 50,
          type: 'expense',
          category_id: 'cat-1',
          created_at: '2026-09-01T00:00:00Z',
          due_day: 18, // Matches mocked tomorrow
        }
      ];

      NotificationService.syncUpcomingExpenses(userId, expenses);
      const notifications = NotificationService.getNotifications(userId);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('INFO');
      expect(notifications[0].title).toBe('Conta vence amanhã!');
    });

    it('should group multiple expenses due on the same day', () => {
      const expenses: Expense[] = [
        { id: 'e1', user_id: userId, description: 'E1', amount: 100, type: 'expense', category_id: 'c', created_at: '2026-09-01', due_day: 17 },
        { id: 'e2', user_id: userId, description: 'E2', amount: 200, type: 'expense', category_id: 'c', created_at: '2026-09-01', due_day: 17 },
      ];

      NotificationService.syncUpcomingExpenses(userId, expenses);
      const notifications = NotificationService.getNotifications(userId);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('2 contas vencem hoje!');
      expect(notifications[0].message).toContain('300.00'); // 100 + 200
      expect(notifications[0].related_expense_ids).toEqual(['e1', 'e2']);
    });

    it('should ignore paid expenses in current month', () => {
      const expenses: Expense[] = [
        {
          id: 'exp-paid',
          user_id: userId,
          description: 'Internet',
          amount: 100,
          type: 'expense',
          category_id: 'cat-1',
          created_at: '2026-09-01T00:00:00Z',
          due_day: 17,
          is_paid: true
        }
      ];

      NotificationService.syncUpcomingExpenses(userId, expenses);
      const notifications = NotificationService.getNotifications(userId);

      expect(notifications).toHaveLength(0);
    });

    it('should ignore income transactions', () => {
      const expenses: Expense[] = [
        {
          id: 'inc-1',
          user_id: userId,
          description: 'Salary',
          amount: 5000,
          type: 'income',
          category_id: 'cat-inc',
          created_at: '2026-09-01T00:00:00Z',
          due_day: 17,
        }
      ];

      NotificationService.syncUpcomingExpenses(userId, expenses);
      const notifications = NotificationService.getNotifications(userId);

      expect(notifications).toHaveLength(0); // Should not notify for incomes
    });
  });
});
