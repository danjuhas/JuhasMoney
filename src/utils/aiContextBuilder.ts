import type {
  Category,
  CreditCard,
  Expense,
  Investment,
  InvestmentTransaction,
} from '../types';
import { isActiveInMonth, isExpensePaid } from './transactions';
import { calculatePortfolioSummary } from './investments';

export interface CategorySpendingSummary {
  name: string;
  amount: number;
  percentageOfExpenses: number;
  previousMonthAmount: number;
  changePercent: number | null;
}

export interface CardBillSummary {
  name: string;
  currentBill: number;
  limit: number | null;
  limitUsagePercent: number | null;
  closingDay: number;
  dueDay: number;
}

export interface HistoricalMonthSummary {
  month: string;
  totalIncomes: number;
  totalExpenses: number;
  netBalance: number;
}

export interface SanitizedExpenseItem {
  description: string;
  amount: number;
  category: string;
  isFixed: boolean;
  isPaid: boolean;
  cardName?: string;
  installments?: string;
}

export interface FinancialContextSnapshot {
  selectedMonth: string;
  currency: string;
  summary: {
    totalIncomes: number;
    totalExpenses: number;
    totalPending: number;
    totalInvestedMonth: number;
    currentBalance: number;
    projectedBalance: number;
    fixedExpensesTotal: number;
    variableExpensesTotal: number;
    savingsRatePercent: number | null;
    transactionCount: number;
  };
  categoriesBreakdown: CategorySpendingSummary[];
  recentMonthsHistory: HistoricalMonthSummary[];
  creditCards: CardBillSummary[];
  activeInstallments: {
    description: string;
    monthlyAmount: number;
    progress: string;
    remainingMonths: number;
  }[];
  investments: {
    totalNetWorth: number;
    totalNetInvested: number;
    totalYield: number;
    overallYieldPercentage: number;
    allocation: { category: string; balance: number; percentage: number }[];
  };
  topExpenses: SanitizedExpenseItem[];
}

export interface BuildFinancialContextInput {
  selectedMonth: string;
  currency: string;
  allExpenses: Expense[];
  monthExpenses: Expense[];
  categories: Category[];
  cards: CreditCard[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  totals: {
    totalIncomes: number;
    totalExpenses: number;
    totalPending: number;
    totalInvestedMonth: number;
    currentBalance: number;
    projectedBalance: number;
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getOffsetMonth(monthStr: string, offsetMonths: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1 + offsetMonths, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Builds a deterministic, privacy-safe financial snapshot for AI reasoning.
 * All financial arithmetic is pre-computed in TypeScript so the LLM never has to sum raw records.
 */
export function buildFinancialContextSnapshot(
  input: BuildFinancialContextInput
): FinancialContextSnapshot {
  const {
    selectedMonth,
    currency,
    allExpenses,
    monthExpenses,
    categories,
    cards,
    investments,
    investmentTransactions,
    totals,
  } = input;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const cardMap = new Map(cards.map((c) => [c.id, c.name]));

  const onlyExpenses = monthExpenses.filter((e) => e.type !== 'income');

  const fixedExpensesTotal = round2(
    onlyExpenses.reduce((acc, e) => (e.is_fixed ? acc + e.amount : acc), 0)
  );
  const variableExpensesTotal = round2(
    onlyExpenses.reduce((acc, e) => (!e.is_fixed ? acc + e.amount : acc), 0)
  );

  const savingsRatePercent =
    totals.totalIncomes > 0
      ? round2(((totals.totalIncomes - totals.totalExpenses) / totals.totalIncomes) * 100)
      : null;

  // Previous month expenses for category delta calculation
  const prevMonth = getOffsetMonth(selectedMonth, -1);
  const prevMonthExpenses = allExpenses.filter(
    (e) => e.type !== 'income' && isActiveInMonth(e, prevMonth, cards)
  );

  const prevCategoryTotals = new Map<string, number>();
  for (const exp of prevMonthExpenses) {
    const name = exp.category_id ? categoryMap.get(exp.category_id) ?? 'Uncategorized' : 'Uncategorized';
    prevCategoryTotals.set(name, (prevCategoryTotals.get(name) ?? 0) + exp.amount);
  }

  const currentCategoryTotals = new Map<string, number>();
  for (const exp of onlyExpenses) {
    const name = exp.category_id ? categoryMap.get(exp.category_id) ?? 'Uncategorized' : 'Uncategorized';
    currentCategoryTotals.set(name, (currentCategoryTotals.get(name) ?? 0) + exp.amount);
  }

  const categoriesBreakdown: CategorySpendingSummary[] = Array.from(
    currentCategoryTotals.entries()
  )
    .map(([name, amount]) => {
      const roundedAmount = round2(amount);
      const prevAmount = round2(prevCategoryTotals.get(name) ?? 0);
      const changePercent =
        prevAmount > 0 ? round2(((roundedAmount - prevAmount) / prevAmount) * 100) : null;
      const percentageOfExpenses =
        totals.totalExpenses > 0 ? round2((roundedAmount / totals.totalExpenses) * 100) : 0;

      return {
        name,
        amount: roundedAmount,
        percentageOfExpenses,
        previousMonthAmount: prevAmount,
        changePercent,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Recent 3 months history (including selectedMonth)
  const recentMonthsHistory: HistoricalMonthSummary[] = [-2, -1, 0].map((offset) => {
    const mStr = getOffsetMonth(selectedMonth, offset);
    const active = allExpenses.filter((e) => isActiveInMonth(e, mStr, cards));
    const inc = round2(
      active.reduce((acc, e) => (e.type === 'income' ? acc + e.amount : acc), 0)
    );
    const exp = round2(
      active.reduce((acc, e) => (e.type !== 'income' ? acc + e.amount : acc), 0)
    );
    return {
      month: mStr,
      totalIncomes: inc,
      totalExpenses: exp,
      netBalance: round2(inc - exp),
    };
  });

  // Credit cards summary for selectedMonth
  const creditCards: CardBillSummary[] = cards.map((card) => {
    const cardExpenses = onlyExpenses.filter((e) => e.credit_card_id === card.id);
    const currentBill = round2(cardExpenses.reduce((acc, e) => acc + e.amount, 0));
    const limit = typeof card.limit === 'number' && card.limit > 0 ? round2(card.limit) : null;
    const limitUsagePercent = limit ? round2((currentBill / limit) * 100) : null;

    return {
      name: card.name,
      currentBill,
      limit,
      limitUsagePercent,
      closingDay: card.closing_day,
      dueDay: card.due_day,
    };
  });

  // Active installments in selectedMonth
  const activeInstallments = onlyExpenses
    .filter((e) => e.installments && e.installments.total > 1)
    .map((e) => ({
      description: e.description,
      monthlyAmount: round2(e.amount),
      progress: `${e.installments!.current}/${e.installments!.total}`,
      remainingMonths: Math.max(0, e.installments!.total - e.installments!.current),
    }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
    .slice(0, 10);

  // Top 10 expenses in selectedMonth (privacy-safe: no IDs or user metadata)
  const topExpenses: SanitizedExpenseItem[] = [...onlyExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((e) => ({
      description: e.description,
      amount: round2(e.amount),
      category: e.category_id ? categoryMap.get(e.category_id) ?? 'Uncategorized' : 'Uncategorized',
      isFixed: Boolean(e.is_fixed),
      isPaid: isExpensePaid(e, selectedMonth),
      ...(e.credit_card_id && cardMap.has(e.credit_card_id)
        ? { cardName: cardMap.get(e.credit_card_id) }
        : {}),
      ...(e.installments
        ? { installments: `${e.installments.current}/${e.installments.total}` }
        : {}),
    }));

  // Investments portfolio summary
  const portfolio = calculatePortfolioSummary(investments, investmentTransactions);

  return {
    selectedMonth,
    currency,
    summary: {
      totalIncomes: round2(totals.totalIncomes),
      totalExpenses: round2(totals.totalExpenses),
      totalPending: round2(totals.totalPending),
      totalInvestedMonth: round2(totals.totalInvestedMonth),
      currentBalance: round2(totals.currentBalance),
      projectedBalance: round2(totals.projectedBalance),
      fixedExpensesTotal,
      variableExpensesTotal,
      savingsRatePercent,
      transactionCount: monthExpenses.length,
    },
    categoriesBreakdown,
    recentMonthsHistory,
    creditCards,
    activeInstallments,
    investments: {
      totalNetWorth: portfolio.totalNetWorth,
      totalNetInvested: portfolio.totalNetInvested,
      totalYield: portfolio.totalYield,
      overallYieldPercentage: portfolio.overallYieldPercentage,
      allocation: portfolio.byCategory.map((b) => ({
        category: b.category,
        balance: b.balance,
        percentage: b.percentage,
      })),
    },
    topExpenses,
  };
}

/**
 * Generates a lightweight fingerprint of the financial snapshot to cache AI insights
 * and avoid redundant API requests when the user's data has not changed.
 */
export function computeContextFingerprint(snapshot: FinancialContextSnapshot): string {
  const { summary, selectedMonth, currency, categoriesBreakdown, creditCards } = snapshot;
  const catSig = categoriesBreakdown.map((c) => `${c.name}:${c.amount}`).join('|');
  const cardSig = creditCards.map((c) => `${c.name}:${c.currentBill}`).join('|');
  return [
    selectedMonth,
    currency,
    summary.totalIncomes,
    summary.totalExpenses,
    summary.totalPending,
    summary.totalInvestedMonth,
    summary.transactionCount,
    catSig,
    cardSig,
  ].join('#');
}
