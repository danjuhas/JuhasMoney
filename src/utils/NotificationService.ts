import type { AppNotification, Expense, CreditCard } from '../types';
import { isActiveInMonth, isExpensePaid } from './transactions';
import { formatCurrency } from './format';
import i18n from '../lib/i18n';

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

  syncUpcomingExpenses(userId: string, expenses: Expense[], currency: string = 'BRL', cards: CreditCard[] = []) {
    this.cleanOldNotifications(userId);
    const notifications = this.getNotifications(userId);

    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const activeExpenses = expenses.filter(e => 
      e.type !== 'income' && 
      isActiveInMonth(e, monthStr, cards) && 
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
        if (offset === 0) label = i18n.t('notifications.today');
        else if (offset === 1) label = i18n.t('notifications.tomorrow');
        else label = i18n.t('notifications.in_days', { count: offset });

        const id = `due-${offset}days-${targetDateStr}`;
        const existingIdx = newNotifications.findIndex(n => n.id === id);
        
        const totalAmount = expensesDue.reduce((acc, curr) => acc + curr.amount, 0);
        const formattedAmount = formatCurrency(totalAmount, currency);
        
        const title = expensesDue.length === 1 
          ? i18n.t('notifications.bill_due_single', { when: label })
          : i18n.t('notifications.bill_due_multiple', { count: expensesDue.length, when: label });
        
        const message = expensesDue.length === 1 
          ? i18n.t('notifications.bill_desc_single', { description: expensesDue[0].description, amount: formattedAmount, when: label })
          : i18n.t('notifications.bill_desc_multiple', { amount: formattedAmount, when: label });

        const related_expense_ids = expensesDue.map(e => e.id);

        if (existingIdx >= 0) {
          if (newNotifications[existingIdx].message !== message || JSON.stringify(newNotifications[existingIdx].related_expense_ids) !== JSON.stringify(related_expense_ids)) {
            newNotifications[existingIdx].title = title;
            newNotifications[existingIdx].message = message;
            newNotifications[existingIdx].related_expense_ids = related_expense_ids;
            newNotifications[existingIdx].is_read = false;
            newNotifications[existingIdx].hidden = false;
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
  },


  syncBestBuyDay(userId: string, cards: CreditCard[]) {
    this.cleanOldNotifications(userId);
    const notifications = this.getNotifications(userId);
    let newNotifications = [...notifications];
    let updated = false;

    const today = new Date().getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const cardsOnBestDay = cards.filter(c => c.closing_day === today);

    for (const card of cardsOnBestDay) {
      const id = `best-buy-${card.id}-${todayStr}`;
      const existingIdx = newNotifications.findIndex(n => n.id === id);

      if (existingIdx === -1) {
        newNotifications.push({
          id,
          user_id: userId,
          title: i18n.t('notifications.best_buy_day_title'),
          message: i18n.t('notifications.best_buy_day_desc', { cardName: card.name }),
          is_read: false,
          created_at: new Date().toISOString(),
          type: 'INFO',
          hidden: false
        });
        updated = true;
      }
    }

    if (updated) {
      newNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.saveNotifications(userId, newNotifications);
    }
  },

  syncPastPending(userId: string, expenses: Expense[]) {
    this.cleanOldNotifications(userId);
    const notifications = this.getNotifications(userId);
    let newNotifications = [...notifications];
    let updated = false;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let pendingCount = 0;
    
    for (const exp of expenses) {
      const expDate = new Date(exp.created_at);
      const startMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (exp.is_fixed) {
        let cm = startMonth;
        while (cm < currentMonthStr) {
          if (exp.end_month && cm > exp.end_month) break;
          if (!exp.excluded_months?.includes(cm)) {
            if (!exp.paid_months?.includes(cm)) {
              pendingCount++;
            }
          }
          let y = parseInt(cm.slice(0, 4));
          let m = parseInt(cm.slice(5, 7));
          m++; if (m > 12) { m = 1; y++; }
          cm = `${y}-${String(m).padStart(2, '0')}`;
        }
      } else {
        if (startMonth < currentMonthStr && !exp.is_paid) {
          pendingCount++;
        }
      }
    }

    const id = `past-pending-alert`;
    const existingIdx = newNotifications.findIndex(n => n.id === id);
    
    if (pendingCount > 0) {
      const title = i18n.t('notifications.past_pending_title');
      const message = i18n.t('notifications.past_pending_desc', { count: pendingCount });
      
      if (existingIdx >= 0) {
        if (newNotifications[existingIdx].message !== message) {
          newNotifications[existingIdx].message = message;
          newNotifications[existingIdx].is_read = false;
          newNotifications[existingIdx].hidden = false;
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
          type: 'WARNING',
          hidden: false
        });
        updated = true;
      }
    } else {
      // Remove it if everything is cleared
      if (existingIdx >= 0 && !newNotifications[existingIdx].hidden) {
         newNotifications[existingIdx].hidden = true;
         updated = true;
      }
    }

    if (updated) {
      newNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.saveNotifications(userId, newNotifications);
    }
  }
};

