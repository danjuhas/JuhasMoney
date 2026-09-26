import type { Expense, CreditCard } from '../types';
import { getEffectiveMonth } from './creditCards';

export function isActiveInMonth(exp: Expense, monthStr: string, cards: CreditCard[] = []): boolean {
  let expMonth: string;

  if (exp.credit_card_id) {
    const card = cards.find(c => c.id === exp.credit_card_id);
    if (card) {
      expMonth = getEffectiveMonth(exp.created_at, card.closing_day, card.due_day);
    } else {
      // Fallback if card was deleted
      const expDate = new Date(exp.created_at);
      expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
    }
  } else {
    const expDate = new Date(exp.created_at);
    expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
  }
  
  if (exp.is_fixed) {
    if (exp.excluded_months?.includes(monthStr)) return false;
    if (exp.end_month && monthStr > exp.end_month) return false;
    return expMonth <= monthStr;
  }
  return expMonth === monthStr;
}

export function isExpensePaid(exp: Expense, monthStr: string): boolean {
  if (exp.is_fixed) {
    return exp.paid_months?.includes(monthStr) || false;
  }
  return exp.is_paid || false;
}
