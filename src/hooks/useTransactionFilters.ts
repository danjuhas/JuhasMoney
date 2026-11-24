import { useState, useMemo, useEffect } from 'react';
import type { Expense, Category, CreditCard, Investment, InvestmentTransaction } from '../types';
import { isActiveInMonth, isExpensePaid } from '../utils/transactions';
import { groupExpensesIntoBills, type DashboardItem } from '../utils/creditCards';
import { isCashFlowInvestmentTransaction, getInvestmentTransactionMonth } from '../utils/investments';
export type SortOption = 'default' | 'date_desc' | 'date_asc' | 'name_asc' | 'amount_desc' | 'amount_asc';

export function useTransactionFilters(
  expenses: Expense[],
  categories: Category[],
  selectedMonth: string,
  cards: CreditCard[] = [],
  investments: Investment[] = [],
  investmentTransactions: InvestmentTransaction[] = []
) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const isFilterActive = filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || sortBy !== 'default';

  // Cross-filter validation
  useEffect(() => {
    if (filterCategory !== 'all' && filterType !== 'all') {
      const selectedCat = categories.find(c => c.id === filterCategory);
      if (selectedCat && selectedCat.type !== filterType) {
        setFilterCategory('all');
      }
    }
  }, [filterType, filterCategory, categories]);

  // Step 1: Month filter
  const monthExpenses = useMemo(() => {
    return expenses.filter(exp => isActiveInMonth(exp, selectedMonth, cards));
  }, [expenses, selectedMonth, cards]);

  // Step 1b: Cash-flow investment transactions (contributions & withdrawals, excluding initial balance & yields)
  const cashFlowInvTxs = useMemo(() => {
    return investmentTransactions.filter(isCashFlowInvestmentTransaction);
  }, [investmentTransactions]);

  const monthInvestmentTxs = useMemo(() => {
    return cashFlowInvTxs.filter(tx => getInvestmentTransactionMonth(tx) === selectedMonth);
  }, [cashFlowInvTxs, selectedMonth]);

  // Step 2: Calculate Totals (always based on month only, ignoring filters)
  const totals = useMemo(() => {
    const totalIncomes = monthExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
    const totalExpenses = monthExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
    
    const monthContributions = monthInvestmentTxs.reduce(
      (acc, tx) => (tx.type === 'contribution' ? acc + tx.amount : acc),
      0
    );
    const monthWithdrawals = monthInvestmentTxs.reduce(
      (acc, tx) => (tx.type === 'withdrawal' ? acc + tx.amount : acc),
      0
    );
    // Net invested in the month: positive means net outflow into investments, negative means net withdrawal back to checking
    const totalInvestedMonth = monthContributions - monthWithdrawals;

    // Calculate accumulated balance from past months
    let accumulatedPaid = 0;
    let accumulatedProjected = 0;

    for (const exp of expenses) {
      const expDate = new Date(exp.created_at);
      const startMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;

      if (exp.is_fixed) {
        let currentMonthStr = startMonth;
        // Check all months from start until before selectedMonth
        while (currentMonthStr < selectedMonth) {
          if (exp.end_month && currentMonthStr > exp.end_month) break;
          
          if (!exp.excluded_months?.includes(currentMonthStr)) {
            const amount = exp.type === 'income' ? exp.amount : -exp.amount;
            accumulatedProjected += amount; // Always expected
            
            if (exp.paid_months?.includes(currentMonthStr)) {
              accumulatedPaid += amount; // Actually paid
            }
          }
          
          // Increment month
          let year = parseInt(currentMonthStr.slice(0, 4));
          let month = parseInt(currentMonthStr.slice(5, 7));
          month++;
          if (month > 12) { month = 1; year++; }
          currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        }
      } else {
        if (startMonth < selectedMonth) {
          const amount = exp.type === 'income' ? exp.amount : -exp.amount;
          accumulatedProjected += amount; // Always expected
          
          if (exp.is_paid) {
            accumulatedPaid += amount; // Actually paid
          }
        }
      }
    }

    // Past months investment cash-flow impact (contributions reduce checking balance, withdrawals increase it)
    for (const tx of cashFlowInvTxs) {
      const txMonth = getInvestmentTransactionMonth(tx);
      if (txMonth < selectedMonth) {
        const impact = tx.type === 'withdrawal' ? tx.amount : -tx.amount;
        accumulatedPaid += impact;
        accumulatedProjected += impact;
      }
    }
    
    // Projeção futura total (Incomes - Expenses - Contributions + Withdrawals)
    const projectedBalance = accumulatedProjected + totalIncomes - totalExpenses - totalInvestedMonth;
    
    // Saldo físico atual
    const paidIncomes = monthExpenses.reduce((acc, curr) => (curr.type === 'income' && isExpensePaid(curr, selectedMonth)) ? acc + curr.amount : acc, 0);
    const paidExpenses = monthExpenses.reduce((acc, curr) => (curr.type !== 'income' && isExpensePaid(curr, selectedMonth)) ? acc + curr.amount : acc, 0);
    const currentBalance = accumulatedPaid + paidIncomes - paidExpenses - totalInvestedMonth;
    
    const totalPending = monthExpenses.reduce((acc, curr) => {
      if (curr.type === 'income') return acc;
      return isExpensePaid(curr, selectedMonth) ? acc : acc + curr.amount;
    }, 0);

    return { 
      totalIncomes, 
      totalExpenses, 
      totalPending,
      totalInvestedMonth,
      accumulatedBalance: accumulatedPaid,
      currentBalance,
      projectedBalance
    };
  }, [monthExpenses, expenses, selectedMonth, monthInvestmentTxs, cashFlowInvTxs]);

  // Step 3: Apply User Filters (Type, Status, Category)
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter(expense => {
      if (filterType !== 'all' && (expense.type || 'expense') !== filterType) return false;
      
      const isPaid = isExpensePaid(expense, selectedMonth);
      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'pending' && isPaid) return false;
      
      if (filterCategory !== 'all' && expense.category_id !== filterCategory) return false;
      
      return true;
    });
  }, [monthExpenses, filterType, filterStatus, filterCategory, selectedMonth]);

  // Step 4: Sort
  const finalExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'default') {
        const aPaid = isExpensePaid(a, selectedMonth);
        const bPaid = isExpensePaid(b, selectedMonth);

        if (aPaid !== bPaid) return aPaid ? 1 : -1;

        if (!aPaid) {
          const aDue = a.due_day || 99;
          const bDue = b.due_day || 99;
          if (aDue !== bDue) return aDue - bDue;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      if (sortBy === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.description.localeCompare(b.description);
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [filteredExpenses, sortBy, selectedMonth]);

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setSortBy('default');
  };

  const dashboardItems = useMemo(() => {
    const grouped: DashboardItem[] = groupExpensesIntoBills(finalExpenses, cards, selectedMonth);

    // Include month's investment contributions & withdrawals in the transaction list
    // Respect user filters: investment cash-flows are completed movements without regular expense categories
    const shouldIncludeInvTxs =
      filterCategory === 'all' && filterStatus !== 'pending';

    if (shouldIncludeInvTxs) {
      for (const tx of monthInvestmentTxs) {
        if (filterType === 'income' && tx.type !== 'withdrawal') continue;
        if (filterType === 'expense' && tx.type !== 'contribution') continue;

        const inv = investments.find((i) => i.id === tx.investment_id);
        if (inv) {
          grouped.push({
            type: 'investment_transaction',
            transaction: tx,
            investment: inv,
          });
        }
      }
    }
    
    const isItemPaid = (item: DashboardItem) => {
      if (item.type === 'expense') return isExpensePaid(item.expense, selectedMonth);
      if (item.type === 'investment_transaction') return true;
      return item.is_paid;
    };
    
    const getItemDueDay = (item: DashboardItem) => {
      if (item.type === 'expense') return item.expense.due_day || 99;
      if (item.type === 'investment_transaction') return new Date(item.transaction.date).getDate();
      return item.card.due_day;
    };
    
    const getItemDate = (item: DashboardItem) => {
      if (item.type === 'expense') return new Date(item.expense.created_at).getTime();
      if (item.type === 'investment_transaction') return new Date(item.transaction.date).getTime();
      return Math.max(...item.expenses.map((e) => new Date(e.created_at).getTime()));
    };
    
    const getItemName = (item: DashboardItem) => {
      if (item.type === 'expense') return item.expense.description;
      if (item.type === 'investment_transaction') return item.investment.name;
      return item.card.name;
    };
    
    const getItemAmount = (item: DashboardItem) => {
      if (item.type === 'expense') return item.expense.amount;
      if (item.type === 'investment_transaction') return item.transaction.amount;
      return item.total;
    };

    return grouped.sort((a, b) => {
      if (sortBy === 'default') {
        const aPaid = isItemPaid(a);
        const bPaid = isItemPaid(b);

        if (aPaid !== bPaid) return aPaid ? 1 : -1;

        if (!aPaid) {
          const aDue = getItemDueDay(a);
          const bDue = getItemDueDay(b);
          if (aDue !== bDue) return aDue - bDue;
        }

        return getItemDate(b) - getItemDate(a);
      }
      
      if (sortBy === 'date_desc') return getItemDate(b) - getItemDate(a);
      if (sortBy === 'date_asc') return getItemDate(a) - getItemDate(b);
      if (sortBy === 'name_asc') return getItemName(a).localeCompare(getItemName(b));
      if (sortBy === 'amount_desc') return getItemAmount(b) - getItemAmount(a);
      if (sortBy === 'amount_asc') return getItemAmount(a) - getItemAmount(b);
      return 0;
    });
  }, [finalExpenses, cards, selectedMonth, sortBy, monthInvestmentTxs, investments, filterCategory, filterStatus, filterType]);
  return {
    dashboardItems,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    sortBy,
    setSortBy,
    isFilterActive,
    clearFilters,
    filteredExpenses: monthExpenses, // Returning month expenses here in case something needs it
    finalExpenses,
    totals
  };
}
