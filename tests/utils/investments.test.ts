import { describe, it, expect } from 'vitest';
import {
  calculateInvestmentMetrics,
  calculatePortfolioSummary,
  isCashFlowInvestmentTransaction,
  getInvestmentTransactionMonth,
} from '../../src/utils/investments';
import type { Investment, InvestmentTransaction } from '../../src/types';

describe('investments utility', () => {
  describe('calculateInvestmentMetrics', () => {
    it('should return zeros when there are no transactions', () => {
      const metrics = calculateInvestmentMetrics([]);
      expect(metrics).toEqual({
        totalContributions: 0,
        totalWithdrawals: 0,
        netInvested: 0,
        totalYield: 0,
        currentBalance: 0,
        yieldPercentage: 0,
        targetProgress: null,
      });
    });

    it('should accurately calculate contributions, withdrawals, positive yield, and target progress', () => {
      const txs: InvestmentTransaction[] = [
        {
          id: 'tx-1',
          investment_id: 'inv-1',
          user_id: 'u-1',
          type: 'contribution',
          amount: 1500,
          date: '2026-10-01T12:00:00Z',
          created_at: '2026-10-01T12:00:00Z',
        },
        {
          id: 'tx-2',
          investment_id: 'inv-1',
          user_id: 'u-1',
          type: 'withdrawal',
          amount: 500,
          date: '2026-10-15T12:00:00Z',
          created_at: '2026-10-15T12:00:00Z',
        },
        {
          id: 'tx-3',
          investment_id: 'inv-1',
          user_id: 'u-1',
          type: 'yield',
          amount: 100,
          date: '2026-11-01T12:00:00Z',
          created_at: '2026-11-01T12:00:00Z',
        },
      ];

      const metrics = calculateInvestmentMetrics(txs, 2200);
      expect(metrics.totalContributions).toBe(1500);
      expect(metrics.totalWithdrawals).toBe(500);
      expect(metrics.netInvested).toBe(1000);
      expect(metrics.totalYield).toBe(100);
      expect(metrics.currentBalance).toBe(1100);
      expect(metrics.yieldPercentage).toBe(10); // 100 / 1000 = 10%
      expect(metrics.targetProgress).toBe(50); // 1100 / 2200 = 50%
    });

    it('should handle negative yield (market dip in variable income / crypto)', () => {
      const txs: InvestmentTransaction[] = [
        {
          id: 'tx-1',
          investment_id: 'inv-crypto',
          user_id: 'u-1',
          type: 'contribution',
          amount: 2000,
          date: '2026-10-01T12:00:00Z',
          created_at: '2026-10-01T12:00:00Z',
        },
        {
          id: 'tx-2',
          investment_id: 'inv-crypto',
          user_id: 'u-1',
          type: 'yield',
          amount: -300,
          date: '2026-11-01T12:00:00Z',
          created_at: '2026-11-01T12:00:00Z',
        },
      ];

      const metrics = calculateInvestmentMetrics(txs);
      expect(metrics.netInvested).toBe(2000);
      expect(metrics.totalYield).toBe(-300);
      expect(metrics.currentBalance).toBe(1700);
      expect(metrics.yieldPercentage).toBe(-15);
    });

    it('should cap target progress at 100%', () => {
      const txs: InvestmentTransaction[] = [
        {
          id: 'tx-1',
          investment_id: 'inv-1',
          user_id: 'u-1',
          type: 'contribution',
          amount: 6000,
          date: '2026-10-01T12:00:00Z',
          created_at: '2026-10-01T12:00:00Z',
        },
      ];

      const metrics = calculateInvestmentMetrics(txs, 5000);
      expect(metrics.targetProgress).toBe(100);
    });
  });

  describe('calculatePortfolioSummary', () => {
    it('should aggregate total net worth, invested amount, yield, and category allocation', () => {
      const investments: Investment[] = [
        {
          id: 'inv-1',
          user_id: 'u-1',
          name: 'Emergency Reserve',
          category: 'emergency',
          color: '#10b981',
          created_at: '2026-10-01T12:00:00Z',
        },
        {
          id: 'inv-2',
          user_id: 'u-1',
          name: 'Bitcoin',
          category: 'crypto',
          color: '#f59e0b',
          created_at: '2026-10-01T12:00:00Z',
        },
      ];

      const txs: InvestmentTransaction[] = [
        {
          id: 'tx-1',
          investment_id: 'inv-1',
          user_id: 'u-1',
          type: 'contribution',
          amount: 7000,
          date: '2026-10-01T12:00:00Z',
          created_at: '2026-10-01T12:00:00Z',
        },
        {
          id: 'tx-2',
          investment_id: 'inv-1',
          user_id: 'u-1',
          type: 'yield',
          amount: 500,
          date: '2026-11-01T12:00:00Z',
          created_at: '2026-11-01T12:00:00Z',
        },
        {
          id: 'tx-3',
          investment_id: 'inv-2',
          user_id: 'u-1',
          type: 'contribution',
          amount: 2000,
          date: '2026-10-01T12:00:00Z',
          created_at: '2026-10-01T12:00:00Z',
        },
        {
          id: 'tx-4',
          investment_id: 'inv-2',
          user_id: 'u-1',
          type: 'yield',
          amount: 500,
          date: '2026-11-01T12:00:00Z',
          created_at: '2026-11-01T12:00:00Z',
        },
      ];

      const summary = calculatePortfolioSummary(investments, txs);
      expect(summary.totalNetWorth).toBe(10000); // 7500 + 2500
      expect(summary.totalNetInvested).toBe(9000); // 7000 + 2000
      expect(summary.totalYield).toBe(1000); // 500 + 500
      expect(summary.byCategory).toEqual([
        { category: 'emergency', balance: 7500, percentage: 75 },
        { category: 'crypto', balance: 2500, percentage: 25 },
      ]);
    });
  });

  describe('isCashFlowInvestmentTransaction & getInvestmentTransactionMonth', () => {
    it('should return false for initial balance snapshots and yield transactions', () => {
      const initialTx: InvestmentTransaction = {
        id: '1',
        investment_id: 'inv-1',
        user_id: 'u-1',
        type: 'contribution',
        amount: 5000,
        date: '2026-11-01T12:00:00Z',
        notes: 'investments.note_initial_balance',
        created_at: '2026-11-01T12:00:00Z',
      };
      const yieldTx: InvestmentTransaction = {
        id: '2',
        investment_id: 'inv-1',
        user_id: 'u-1',
        type: 'yield',
        amount: 200,
        date: '2026-11-15T12:00:00Z',
        notes: 'investments.note_yield_positive',
        created_at: '2026-11-15T12:00:00Z',
      };

      expect(isCashFlowInvestmentTransaction(initialTx)).toBe(false);
      expect(isCashFlowInvestmentTransaction(yieldTx)).toBe(false);
    });

    it('should return true for regular contributions and withdrawals and extract YYYY-MM correctly', () => {
      const contributionTx: InvestmentTransaction = {
        id: '3',
        investment_id: 'inv-1',
        user_id: 'u-1',
        type: 'contribution',
        amount: 800,
        date: '2026-11-10T12:00:00Z',
        notes: 'Monthly savings',
        created_at: '2026-11-10T12:00:00Z',
      };
      const withdrawalTx: InvestmentTransaction = {
        id: '4',
        investment_id: 'inv-1',
        user_id: 'u-1',
        type: 'withdrawal',
        amount: 300,
        date: '2026-11-20T12:00:00Z',
        created_at: '2026-11-20T12:00:00Z',
      };

      expect(isCashFlowInvestmentTransaction(contributionTx)).toBe(true);
      expect(isCashFlowInvestmentTransaction(withdrawalTx)).toBe(true);
      expect(getInvestmentTransactionMonth(contributionTx)).toBe('2026-11');
    });
  });
});
