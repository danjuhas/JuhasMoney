import type { Expense } from '../types';

export function isActiveInMonth(exp: Expense, monthStr: string): boolean {
  const expDate = new Date(exp.created_at);
  const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
  
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
