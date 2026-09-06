import type { AppNotification, Expense } from '../types';
import { isActiveInMonth, isExpensePaid } from './transactions';

const NOTIFICATIONS_KEY_PREFIX = 'juhas_notifications_';

export const NotificationService = {
  getStorageKey(userId: string) {
    return `${NOTIFICATIONS_KEY_PREFIX}${userId}`;
  },

  getNotifications(userId: string): AppNotification[] {
    const data = localStorage.getItem(this.getStorageKey(userId));
    return data ? JSON.parse(data) : [];
  },

  saveNotifications(userId: string, notifications: AppNotification[]) {
    localStorage.setItem(this.getStorageKey(userId), JSON.stringify(notifications));
  },

  cleanOldNotifications(userId: string) {
    const notifications = this.getNotifications(userId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = notifications.filter((notif) => {
      const createdAt = new Date(notif.created_at);
      return createdAt >= thirtyDaysAgo;
    });

    if (filtered.length !== notifications.length) {
      this.saveNotifications(userId, filtered);
    }
  },

  syncUpcomingExpenses(userId: string, expenses: Expense[]) {
    this.cleanOldNotifications(userId);
    const notifications = this.getNotifications(userId);

    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const activeExpenses = expenses.filter(e => 
      e.type !== 'income' && 
      isActiveInMonth(e, monthStr) && 
      !isExpensePaid(e, monthStr) && 
      e.due_day !== undefined
    );

    let updated = false;
    let newNotifications = [...notifications];

    for (let offset = 0; offset <= 3; offset++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + offset);
      
      const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      const targetDay = targetDate.getDate();

      const expensesDue = activeExpenses.filter(e => e.due_day === targetDay);

      if (expensesDue.length > 0) {
        let label = '';
        if (offset === 0) label = 'hoje';
        else if (offset === 1) label = 'amanhã';
        else label = `em ${offset} dias`;

        const id = `due-${offset}days-${targetDateStr}`;
        const existingIdx = newNotifications.findIndex(n => n.id === id);
        
        const totalAmount = expensesDue.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2);
        const title = expensesDue.length === 1 
          ? `Conta vence ${label}!` 
          : `${expensesDue.length} contas vencem ${label}!`;
        
        const message = expensesDue.length === 1 
          ? `${expensesDue[0].description} no valor de R$ ${totalAmount} vence ${label}.`
          : `Você tem contas totalizando R$ ${totalAmount} vencendo ${label}.`;

        const related_expense_ids = expensesDue.map(e => e.id);

        if (existingIdx >= 0) {
          if (newNotifications[existingIdx].message !== message || JSON.stringify(newNotifications[existingIdx].related_expense_ids) !== JSON.stringify(related_expense_ids)) {
            newNotifications[existingIdx].title = title;
            newNotifications[existingIdx].message = message;
            newNotifications[existingIdx].related_expense_ids = related_expense_ids;
            newNotifications[existingIdx].is_read = false;
            updated = true;
          }
        } else {
          newNotifications.push({
            id,
            user_id: userId,
            title,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            type: offset === 0 ? 'WARNING' : 'INFO',
            reference_date: targetDateStr,
            related_expense_ids
          });
          updated = true;
        }
      }
    }

    if (updated) {
      newNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.saveNotifications(userId, newNotifications);
    }
  }
};

