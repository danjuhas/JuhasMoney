import type { Expense, CreditCard } from '../types';

/**
 * Calculates the effective billing month ("YYYY-MM") for a credit card purchase.
 * 
 * Logic:
 * A card has a closing_day (e.g., 25) and a due_day (e.g., 5).
 * - The cycle closing in month M on closing_day matures on due_day.
 * - If due_day < closing_day, the due date is in month M+1.
 * - If due_day > closing_day, the due date is in month M.
 * 
 * If a purchase is made on day D:
 * - If D < closing_day, it falls into the cycle closing THIS month.
 * - If D >= closing_day, it falls into the cycle closing NEXT month.
 */
export function getEffectiveMonth(purchaseDate: string | Date, closingDay: number, dueDay: number): string {
  const date = new Date(purchaseDate);
  const purchaseYear = date.getUTCFullYear();
  const purchaseMonth = date.getUTCMonth(); // 0-11
  const purchaseDay = date.getUTCDate();

  // Determine the month the bill closes
  let billClosingMonth = purchaseMonth;
  let billClosingYear = purchaseYear;

  if (purchaseDay >= closingDay) {
    // Falls into next month's closing cycle
    billClosingMonth += 1;
    if (billClosingMonth > 11) {
      billClosingMonth = 0;
      billClosingYear += 1;
    }
  }

  // Determine the due month based on closing month
  let billDueMonth = billClosingMonth;
  let billDueYear = billClosingYear;

  if (dueDay < closingDay) {
    // Due date rolls over to the month after closing
    billDueMonth += 1;
    if (billDueMonth > 11) {
      billDueMonth = 0;
      billDueYear += 1;
    }
  }

  // Format as YYYY-MM
  const mm = String(billDueMonth + 1).padStart(2, '0');
  return `${billDueYear}-${mm}`;
}

export type DashboardItem = 
  | { type: 'expense'; expense: Expense }
  | { type: 'credit_card_bill'; card: CreditCard; expenses: Expense[]; total: number; is_paid: boolean; month: string };

export function groupExpensesIntoBills(
  expenses: Expense[], 
  cards: CreditCard[], 
  selectedMonth: string
): DashboardItem[] {
  const items: DashboardItem[] = [];
  const billsMap = new Map<string, { card: CreditCard, expenses: Expense[], total: number }>();

  for (const expense of expenses) {
    if (!expense.credit_card_id) {
      items.push({ type: 'expense', expense });
      continue;
    }

    const card = cards.find(c => c.id === expense.credit_card_id);
    if (!card) {
      // Fallback if card is deleted
      items.push({ type: 'expense', expense });
      continue;
    }

    // Group inside the bill
    if (!billsMap.has(card.id)) {
      billsMap.set(card.id, { card, expenses: [], total: 0 });
    }
    const bill = billsMap.get(card.id)!;
    bill.expenses.push(expense);
    bill.total += expense.amount;
  }

  // Convert map to array items
  for (const bill of billsMap.values()) {
    // Check if the whole bill is paid. A bill is paid if ALL its expenses are paid.
    // If the bill has 0 expenses, it shouldn't exist anyway.
    const is_paid = bill.expenses.length > 0 && bill.expenses.every(e => e.is_paid || (e.paid_months && e.paid_months.includes(selectedMonth)));
    items.push({
      type: 'credit_card_bill',
      card: bill.card,
      expenses: bill.expenses,
      total: bill.total,
      is_paid,
      month: selectedMonth
    });
  }

  return items;
}
