import type { Investment, InvestmentCategory, InvestmentTransaction } from '../types';

export interface InvestmentMetrics {
  totalContributions: number;
  totalWithdrawals: number;
  netInvested: number;
  totalYield: number;
  currentBalance: number;
  yieldPercentage: number;
  targetProgress: number | null;
}

export interface PortfolioSummary {
  totalNetWorth: number;
  totalNetInvested: number;
  totalYield: number;
  overallYieldPercentage: number;
  byCategory: {
    category: InvestmentCategory;
    balance: number;
    percentage: number;
  }[];
}

/**
 * Determines whether an investment transaction represents an actual checking-account
 * cash-flow event (Deposit/Contribution or Withdrawal), excluding initial balance snapshots
 * and compound yield adjustments.
 */
export function isCashFlowInvestmentTransaction(tx: InvestmentTransaction): boolean {
  if (tx.type !== 'contribution' && tx.type !== 'withdrawal') return false;
  if (tx.notes === 'investments.note_initial_balance' || tx.notes === 'Saldo inicial') {
    return false;
  }
  return true;
}

/**
 * Extracts the "YYYY-MM" month string from an investment transaction ISO date.
 */
export function getInvestmentTransactionMonth(tx: InvestmentTransaction): string {
  const date = new Date(tx.date);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateInvestmentMetrics(
  transactions: InvestmentTransaction[],
  targetAmount?: number | null
): InvestmentMetrics {
  let totalContributions = 0;
  let totalWithdrawals = 0;
  let totalYield = 0;
  let currentBalance = 0;

  for (const tx of transactions) {
    if (tx.type === 'contribution') {
      totalContributions += tx.amount;
      currentBalance += tx.amount;
    } else if (tx.type === 'withdrawal') {
      totalWithdrawals += tx.amount;
      currentBalance -= tx.amount;
    } else if (tx.type === 'yield') {
      totalYield += tx.amount;
      currentBalance += tx.amount;
    }
  }

  // Round to 2 decimal places to avoid floating point issues
  totalContributions = Math.round(totalContributions * 100) / 100;
  totalWithdrawals = Math.round(totalWithdrawals * 100) / 100;
  totalYield = Math.round(totalYield * 100) / 100;
  currentBalance = Math.max(0, Math.round(currentBalance * 100) / 100);

  const netInvested = Math.max(0, Math.round((totalContributions - totalWithdrawals) * 100) / 100);

  const yieldPercentage =
    netInvested > 0
      ? Math.round((totalYield / netInvested) * 10000) / 100
      : 0;

  const targetProgress =
    targetAmount && targetAmount > 0
      ? Math.min(100, Math.round((currentBalance / targetAmount) * 1000) / 10)
      : null;

  return {
    totalContributions,
    totalWithdrawals,
    netInvested,
    totalYield,
    currentBalance,
    yieldPercentage,
    targetProgress,
  };
}

/**
 * Calculates aggregated portfolio net worth, net invested, yield, and category allocation breakdown.
 */
export function calculatePortfolioSummary(
  investments: Investment[],
  transactions: InvestmentTransaction[]
): PortfolioSummary {
  let totalNetWorth = 0;
  let totalNetInvested = 0;
  let totalYield = 0;

  const categoryTotals: Record<InvestmentCategory, number> = {
    emergency: 0,
    fixed_income: 0,
    variable_income: 0,
    crypto: 0,
    other: 0,
  };

  for (const inv of investments) {
    const invTxs = transactions.filter((t) => t.investment_id === inv.id);
    const metrics = calculateInvestmentMetrics(invTxs, inv.target_amount);

    totalNetWorth += metrics.currentBalance;
    totalNetInvested += metrics.netInvested;
    totalYield += metrics.totalYield;
    categoryTotals[inv.category] = (categoryTotals[inv.category] || 0) + metrics.currentBalance;
  }

  totalNetWorth = Math.round(totalNetWorth * 100) / 100;
  totalNetInvested = Math.round(totalNetInvested * 100) / 100;
  totalYield = Math.round(totalYield * 100) / 100;

  const overallYieldPercentage =
    totalNetInvested > 0
      ? Math.round((totalYield / totalNetInvested) * 10000) / 100
      : 0;

  const byCategory = (Object.entries(categoryTotals) as [InvestmentCategory, number][])
    .filter(([, balance]) => balance > 0)
    .map(([category, balance]) => ({
      category,
      balance: Math.round(balance * 100) / 100,
      percentage: totalNetWorth > 0 ? Math.round((balance / totalNetWorth) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.balance - a.balance);

  return {
    totalNetWorth,
    totalNetInvested,
    totalYield,
    overallYieldPercentage,
    byCategory,
  };
}
