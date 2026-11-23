import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { X, ArrowUpRight, ArrowDownRight, Sparkles, Trash2, Edit2, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '../contexts/PreferencesContext';
import { formatCurrency } from '../utils/format';
import { calculateInvestmentMetrics } from '../utils/investments';
import type { Investment, InvestmentTransaction } from '../types';

interface InvestmentDetailsModalProps {
  investment: Investment | null;
  transactions: InvestmentTransaction[];
  onClose: () => void;
  onEditInvestment: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: string) => void;
  onDeleteTransaction: (txId: string) => void;
  onOpenActionModal: (investment: Investment, mode: 'contribute' | 'withdraw' | 'update_balance') => void;
}

export function InvestmentDetailsModal({
  investment,
  transactions,
  onClose,
  onEditInvestment,
  onDeleteInvestment,
  onDeleteTransaction,
  onOpenActionModal,
}: InvestmentDetailsModalProps) {
  const { t } = useTranslation();
  const { preferences } = usePreferences();

  if (!investment) return null;

  const invTransactions = transactions
    .filter((tx) => tx.investment_id === investment.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const metrics = calculateInvestmentMetrics(invTransactions, investment.target_amount);

  return (
    <Modal isOpen={!!investment} onClose={onClose} maxWidth="lg" className="p-6">
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-10 rounded-full shrink-0"
            style={{ backgroundColor: investment.color }}
          />
          <div>
            <h3 className="text-xl font-bold text-slate-100">{investment.name}</h3>
            <span className="text-xs text-slate-400 font-medium">
              {t(`investments.cat_${investment.category}`)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onClose();
              onEditInvestment(investment);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title={t('item.edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onClose();
              onDeleteInvestment(investment.id);
            }}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
            title={t('item.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-5">
        <div className="flex justify-between items-baseline mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('investments.current_balance')}
          </span>
          <span className="text-2xl font-extrabold text-white">
            {formatCurrency(metrics.currentBalance, preferences.currency)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/70">
          <div>
            <span className="text-xs text-slate-400 block">{t('investments.invested')}</span>
            <span className="text-sm font-semibold text-slate-200">
              {formatCurrency(metrics.netInvested, preferences.currency)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">{t('investments.yield')}</span>
            <span
              className={`text-sm font-semibold ${
                metrics.totalYield >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.totalYield >= 0 ? '+' : ''}
              {formatCurrency(metrics.totalYield, preferences.currency)} ({metrics.yieldPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            onClose();
            onOpenActionModal(investment, 'contribute');
          }}
        >
          <Plus className="w-4 h-4" />
          {t('investments.contribute')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            onClose();
            onOpenActionModal(investment, 'withdraw');
          }}
        >
          <ArrowDownRight className="w-4 h-4 text-rose-400" />
          {t('investments.withdraw')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            onClose();
            onOpenActionModal(investment, 'update_balance');
          }}
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          {t('investments.update_balance')}
        </Button>
      </div>

      {/* History List */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          {t('investments.history_title')}
        </h4>
        {invTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm bg-slate-800/40 rounded-2xl border border-slate-800">
            {t('investments.no_history')}
          </div>
        ) : (
          <ul className="divide-y divide-slate-800 max-h-64 overflow-y-auto pr-1">
            {invTransactions.map((tx) => {
              const isPositive =
                tx.type === 'contribution' || (tx.type === 'yield' && tx.amount >= 0);
              const dateFormatted = new Date(tx.date).toLocaleDateString(
                t('dashboard.locale') || 'pt-BR'
              );

              return (
                <li
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'contribution'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : tx.type === 'withdrawal'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-sky-500/15 text-sky-400'
                      }`}
                    >
                      {tx.type === 'contribution' && <ArrowUpRight className="w-4 h-4" />}
                      {tx.type === 'withdrawal' && <ArrowDownRight className="w-4 h-4" />}
                      {tx.type === 'yield' && <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">
                          {t(`investments.tx_${tx.type}`)}
                        </span>
                        <span className="text-xs text-slate-500">{dateFormatted}</span>
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-slate-400 truncate">
                          {t(tx.notes)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        tx.type === 'withdrawal' || tx.amount < 0
                          ? 'rose'
                          : tx.type === 'yield'
                          ? 'amber'
                          : 'emerald'
                      }
                    >
                      {tx.type === 'withdrawal' ? '- ' : isPositive ? '+ ' : ''}
                      {formatCurrency(Math.abs(tx.amount), preferences.currency)}
                    </Badge>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title={t('item.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
