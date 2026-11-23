import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Plus,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Target,
  Sparkles,
  PieChart as PieChartIcon,
  Edit2,
  Trash2,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { InvestmentDetailsModal } from './InvestmentDetailsModal';
import { usePreferences } from '../contexts/PreferencesContext';
import { formatCurrency } from '../utils/format';
import {
  calculateInvestmentMetrics,
  calculatePortfolioSummary,
} from '../utils/investments';
import type {
  Investment,
  InvestmentCategory,
  InvestmentTransaction,
  InvestmentTransactionType,
} from '../types';

interface InvestmentsOverviewProps {
  investments: Investment[];
  transactions: InvestmentTransaction[];
  addInvestment: (
    payload: Omit<Investment, 'id' | 'user_id' | 'created_at'>,
    initialBalance?: number
  ) => Promise<void>;
  updateInvestment: (
    id: string,
    updates: Partial<Omit<Investment, 'id' | 'user_id' | 'created_at'>>
  ) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addInvestmentTransaction: (payload: {
    investment_id: string;
    type: InvestmentTransactionType;
    amount: number;
    date?: string;
    notes?: string;
  }) => Promise<void>;
  adjustInvestmentBalance: (
    investmentId: string,
    newTotalBalance: number,
    notes?: string
  ) => Promise<void>;
  deleteInvestmentTransaction: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber / Gold
  '#3b82f6', // Royal Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
];

const CATEGORY_COLORS: Record<InvestmentCategory, string> = {
  emergency: '#10b981',
  fixed_income: '#0ea5e9',
  variable_income: '#8b5cf6',
  crypto: '#f59e0b',
  other: '#64748b',
};

const CATEGORIES: InvestmentCategory[] = [
  'emergency',
  'fixed_income',
  'variable_income',
  'crypto',
  'other',
];

export function InvestmentsOverview({
  investments,
  transactions,
  addInvestment,
  updateInvestment,
  deleteInvestment,
  addInvestmentTransaction,
  adjustInvestmentBalance,
  deleteInvestmentTransaction,
}: InvestmentsOverviewProps) {
  const { t } = useTranslation();
  const { preferences } = usePreferences();

  // Create / Edit Asset Box Modal State
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('emergency');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // Quick Action Modal State (Contribute / Withdraw / Update Balance)
  const [actionTarget, setActionTarget] = useState<{
    investment: Investment;
    mode: 'contribute' | 'withdraw' | 'update_balance';
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Details & Delete Confirmation Modal State
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const portfolio = useMemo(
    () => calculatePortfolioSummary(investments, transactions),
    [investments, transactions]
  );

  const selectedInvestment = useMemo(
    () => investments.find((i) => i.id === selectedInvestmentId) || null,
    [investments, selectedInvestmentId]
  );

  const handleOpenBoxModal = (inv?: Investment) => {
    if (inv) {
      setEditingInvestment(inv);
      setName(inv.name);
      setCategory(inv.category);
      setColor(inv.color);
      setTargetAmount(inv.target_amount ? String(inv.target_amount) : '');
      setInitialBalance('');
    } else {
      setEditingInvestment(null);
      setName('');
      setCategory('emergency');
      setColor(PRESET_COLORS[0]);
      setInitialBalance('');
      setTargetAmount('');
    }
    setIsBoxModalOpen(true);
  };

  const handleSaveBox = async () => {
    if (!name.trim()) return;

    const parsedTarget = targetAmount ? parseFloat(targetAmount.replace(',', '.')) : null;
    const validTarget = parsedTarget && parsedTarget > 0 ? parsedTarget : null;

    if (editingInvestment) {
      await updateInvestment(editingInvestment.id, {
        name: name.trim(),
        category,
        color,
        target_amount: validTarget,
      });
    } else {
      const parsedInitial = initialBalance ? parseFloat(initialBalance.replace(',', '.')) : 0;
      const validInitial = parsedInitial && parsedInitial > 0 ? parsedInitial : 0;
      await addInvestment(
        {
          name: name.trim(),
          category,
          color,
          target_amount: validTarget,
        },
        validInitial
      );
    }

    setIsBoxModalOpen(false);
  };

  const handleOpenActionModal = (
    investment: Investment,
    mode: 'contribute' | 'withdraw' | 'update_balance'
  ) => {
    const invTxs = transactions.filter((tx) => tx.investment_id === investment.id);
    const { currentBalance } = calculateInvestmentMetrics(invTxs);

    setActionTarget({ investment, mode });
    setActionAmount(mode === 'update_balance' ? String(currentBalance) : '');
    setActionNotes('');
    setActionError(null);
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;

    const parsed = parseFloat(actionAmount.replace(',', '.'));
    if (isNaN(parsed) || (actionTarget.mode !== 'update_balance' && parsed <= 0) || parsed < 0) {
      setActionError(t('investments.error_invalid_amount'));
      return;
    }

    const invTxs = transactions.filter((tx) => tx.investment_id === actionTarget.investment.id);
    const { currentBalance } = calculateInvestmentMetrics(invTxs);

    if (actionTarget.mode === 'withdraw' && parsed > currentBalance) {
      setActionError(t('investments.error_insufficient_balance'));
      return;
    }

    if (actionTarget.mode === 'contribute') {
      await addInvestmentTransaction({
        investment_id: actionTarget.investment.id,
        type: 'contribution',
        amount: parsed,
        notes: actionNotes.trim() || undefined,
      });
    } else if (actionTarget.mode === 'withdraw') {
      await addInvestmentTransaction({
        investment_id: actionTarget.investment.id,
        type: 'withdrawal',
        amount: parsed,
        notes: actionNotes.trim() || undefined,
      });
    } else if (actionTarget.mode === 'update_balance') {
      await adjustInvestmentBalance(
        actionTarget.investment.id,
        parsed,
        actionNotes.trim() || undefined
      );
    }

    setActionTarget(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-sky-400" />
          {t('investments.title')}
        </h2>
        <Button onClick={() => handleOpenBoxModal()} variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>{t('investments.new_investment')}</span>
        </Button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          padding="md"
          className="bg-gradient-to-br from-sky-900/50 via-slate-800 to-slate-800 border-sky-500/30"
        >
          <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider block mb-1">
            {t('investments.total_net_worth')}
          </span>
          <p className="text-3xl font-extrabold text-white tracking-tight truncate">
            {formatCurrency(portfolio.totalNetWorth, preferences.currency)}
          </p>
        </Card>

        <Card padding="md">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {t('investments.total_invested')}
          </span>
          <p className="text-2xl font-bold text-slate-100 tracking-tight truncate">
            {formatCurrency(portfolio.totalNetInvested, preferences.currency)}
          </p>
        </Card>

        <Card padding="md">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('investments.total_yield')}
            </span>
            <Badge variant={portfolio.totalYield >= 0 ? 'emerald' : 'rose'}>
              {portfolio.totalYield >= 0 ? '+' : ''}
              {portfolio.overallYieldPercentage}%
            </Badge>
          </div>
          <p
            className={`text-2xl font-bold tracking-tight truncate ${
              portfolio.totalYield >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {portfolio.totalYield >= 0 ? '+ ' : ''}
            {formatCurrency(portfolio.totalYield, preferences.currency)}
          </p>
        </Card>
      </div>

      {/* Asset Allocation Section (Only shown when there is positive balance) */}
      {portfolio.byCategory.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              {t('investments.allocation')}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolio.byCategory.map((item) => ({
                      name: t(`investments.cat_${item.category}`),
                      value: item.balance,
                      color: CATEGORY_COLORS[item.category],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {portfolio.byCategory.map((item) => (
                      <Cell
                        key={item.category}
                        fill={CATEGORY_COLORS[item.category]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => formatCurrency(Number(val) || 0, preferences.currency)}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {portfolio.byCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                    />
                    <span className="text-slate-300 font-medium">
                      {t(`investments.cat_${item.category}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-100 font-semibold">
                      {formatCurrency(item.balance, preferences.currency)}
                    </span>
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Investments / Asset Boxes Grid */}
      {investments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/50 border border-dashed border-slate-700 rounded-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
            <PiggyBank className="w-8 h-8 text-sky-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">{t('investments.empty_title')}</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6 max-w-md">
            {t('investments.empty_desc')}
          </p>
          <Button onClick={() => handleOpenBoxModal()} variant="primary">
            <Plus className="w-4 h-4" />
            {t('investments.create_first')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((inv) => {
            const invTxs = transactions.filter((tx) => tx.investment_id === inv.id);
            const metrics = calculateInvestmentMetrics(invTxs, inv.target_amount);

            return (
              <Card
                key={inv.id}
                padding="md"
                onClick={() => setSelectedInvestmentId(inv.id)}
                role="button"
                className="relative overflow-hidden transition-all hover:border-slate-600 cursor-pointer flex flex-col justify-between gap-4"
              >
                {/* Top Accent Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: inv.color }}
                />

                <div>
                  <div className="flex justify-between items-start gap-2 mb-3 pt-1">
                    <div>
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300 mb-1.5">
                        {t(`investments.cat_${inv.category}`)}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug">{inv.name}</h3>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenBoxModal(inv)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
                        title={t('item.edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                        title={t('item.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Current Balance */}
                  <div className="mb-3">
                    <span className="text-xs text-slate-400 block">
                      {t('investments.current_balance')}
                    </span>
                    <p className="text-2xl font-extrabold text-white tracking-tight">
                      {formatCurrency(metrics.currentBalance, preferences.currency)}
                    </p>
                  </div>

                  {/* Invested vs Yield */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block">{t('investments.invested')}</span>
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(metrics.netInvested, preferences.currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">{t('investments.yield')}</span>
                      <span
                        className={`font-semibold ${
                          metrics.totalYield >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {metrics.totalYield >= 0 ? '+' : ''}
                        {formatCurrency(metrics.totalYield, preferences.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Optional Target Progress Bar */}
                  {inv.target_amount && inv.target_amount > 0 && metrics.targetProgress !== null && (
                    <div className="mb-2">
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-sky-400" />
                          {t('investments.goal_progress', {
                            target: formatCurrency(inv.target_amount, preferences.currency),
                          })}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {metrics.targetProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${metrics.targetProgress}%`,
                            backgroundColor: inv.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions Footer */}
                <div
                  className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-700/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleOpenActionModal(inv, 'contribute')}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('investments.contribute')}</span>
                  </button>
                  <button
                    onClick={() => handleOpenActionModal(inv, 'withdraw')}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{t('investments.withdraw')}</span>
                  </button>
                  <button
                    onClick={() => handleOpenActionModal(inv, 'update_balance')}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-medium transition-colors"
                    title={t('investments.update_balance')}
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('investments.update_balance')}</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Asset Box */}
      <Modal
        isOpen={isBoxModalOpen}
        onClose={() => setIsBoxModalOpen(false)}
        maxWidth="md"
        className="p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          {editingInvestment
            ? t('investments.edit_investment')
            : t('investments.new_investment')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t('investments.name_label')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('investments.name_placeholder')}
              focusColor="emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t('investments.category_label')}
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as InvestmentCategory)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`investments.cat_${cat}`)}
                </option>
              ))}
            </Select>
          </div>

          {!editingInvestment && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t('investments.initial_balance')}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                focusColor="emerald"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t('investments.target_amount')}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              focusColor="emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              {t('investments.color_label')}
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setIsBoxModalOpen(false)}>
            {t('dashboard.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSaveBox}>
            {t('dashboard.save')}
          </Button>
        </div>
      </Modal>

      {/* Modal: Contribute / Withdraw / Update Balance */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        maxWidth="sm"
        className="p-6"
      >
        {actionTarget && (
          <>
            <div className="flex items-center gap-2.5 mb-2">
              {actionTarget.mode === 'contribute' && (
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              )}
              {actionTarget.mode === 'withdraw' && (
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
              )}
              {actionTarget.mode === 'update_balance' && (
                <Sparkles className="w-5 h-5 text-sky-400" />
              )}
              <h3 className="text-lg font-bold text-white">
                {t(`investments.modal_${actionTarget.mode}_title`)}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">{actionTarget.investment.name}</p>

            {actionTarget.mode === 'update_balance' && (
              <p className="text-xs text-slate-300 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 mb-4">
                {t('investments.modal_update_balance_desc')}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {actionTarget.mode === 'update_balance'
                    ? t('investments.new_total_balance_label')
                    : t('investments.amount_label')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={actionAmount}
                  onChange={(e) => {
                    setActionAmount(e.target.value);
                    setActionError(null);
                  }}
                  placeholder="0.00"
                  focusColor={actionTarget.mode === 'withdraw' ? 'rose' : 'emerald'}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {t('investments.notes_label')}
                </label>
                <Input
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={t('investments.notes_placeholder')}
                />
              </div>

              {actionError && (
                <p className="text-xs text-rose-400 font-medium">{actionError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setActionTarget(null)}>
                {t('dashboard.cancel')}
              </Button>
              <Button
                variant={actionTarget.mode === 'withdraw' ? 'danger' : 'primary'}
                onClick={handleConfirmAction}
              >
                {t('dashboard.save')}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal: Investment History & Details */}
      <InvestmentDetailsModal
        investment={selectedInvestment}
        transactions={transactions}
        onClose={() => setSelectedInvestmentId(null)}
        onEditInvestment={(inv) => handleOpenBoxModal(inv)}
        onDeleteInvestment={(id) => setDeleteConfirmId(id)}
        onDeleteTransaction={deleteInvestmentTransaction}
        onOpenActionModal={handleOpenActionModal}
      />

      {/* Modal: Confirm Delete Asset Box */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="sm"
        className="p-6 text-center"
      >
        <h3 className="text-lg font-bold text-white mb-2">
          {t('investments.delete_title')}
        </h3>
        <p className="text-sm text-slate-400 mb-6">{t('investments.delete_desc')}</p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            {t('modal.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (deleteConfirmId) {
                await deleteInvestment(deleteConfirmId);
                setDeleteConfirmId(null);
              }
            }}
          >
            {t('modal.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
