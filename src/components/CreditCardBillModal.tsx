import { useState, useEffect } from 'react';
import { CreditCard as CardIcon, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Expense, Category, CreditCard } from '../types';
import { isActiveInMonth } from '../utils/transactions';
import { formatCurrency } from '../utils/format';
import { TransactionItem } from './TransactionItem';
import { useTranslation } from 'react-i18next';

interface Props {
  cardId: string | null;
  onClose: () => void;
  expenses: Expense[];
  categories: Category[];
  cards: CreditCard[];
  initialMonth: string;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  preferences: any;
}

export function CreditCardBillModal({
  cardId,
  onClose,
  expenses,
  categories,
  cards,
  initialMonth,
  onDeleteExpense,
  onEditExpense,
  preferences
}: Props) {
  const { t } = useTranslation();
  const [modalMonth, setModalMonth] = useState(initialMonth);

  // Sync initialMonth when opened
  useEffect(() => {
    if (cardId) {
      setModalMonth(initialMonth);
    }
  }, [cardId, initialMonth]);

  if (!cardId) return null;

  const [year, month] = modalMonth.split('-');
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

  const date = new Date(Date.UTC(y, m - 1, 1));
  const monthLabel = date.toLocaleDateString(t('dashboard.locale') || 'pt-BR', { month: 'long', year: 'numeric' });

  const cardExpenses = expenses.filter(e => e.credit_card_id === cardId && isActiveInMonth(e, modalMonth, cards)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalFatura = cardExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const isPaid = cardExpenses.length > 0 && cardExpenses.every(e => e.is_paid);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] p-6 relative z-10 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CardIcon className="w-6 h-6 text-purple-400" />
            {t('dashboard.bill_details')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Month Navigation & Summary */}
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 shrink-0 border border-slate-700 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setModalMonth(prevMonth)}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-full transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="capitalize">{monthLabel}</span>
            </div>
            
            <button 
              onClick={() => setModalMonth(nextMonth)}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-full transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center pt-2 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-1">{t('dashboard.bill_total')}</p>
            <h3 className={`text-2xl font-bold tracking-tight ${isPaid ? 'text-emerald-400' : 'text-slate-100'}`}>
              {formatCurrency(totalFatura, preferences?.currency)}
            </h3>
            {isPaid && <span className="text-xs text-emerald-500 font-medium mt-1 uppercase tracking-wider">{t('dashboard.bill_paid')}</span>}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 space-y-2">
          {cardExpenses.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('dashboard.bill_empty')}</p>
          ) : (
            cardExpenses.map(expense => (
              <TransactionItem
                key={expense.id}
                expense={expense}
                isPaid={expense.is_paid || false}
                category={categories.find(c => c.id === expense.category_id)}
                onTogglePaid={() => {}} 
                onEdit={(exp) => onEditExpense(exp)}
                onDelete={onDeleteExpense}
                hideActions={true}
                hideCheckbox={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
