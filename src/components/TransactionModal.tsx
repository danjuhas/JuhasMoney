import React, { useState, useEffect } from 'react';
import { generateUUID } from '../utils/uuid';
import { getCurrencySymbol } from '../utils/format';
import type { Expense, Category } from '../types';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expensesToUpsert: Expense[], targetMonthStr?: string) => void;
  userId: string | null;
  selectedMonth: string;
  categories: Category[];
  preferences: any;
  editingExpense: Expense | null;
  initialMode: 'quick' | 'fixed';
  initialType?: 'income' | 'expense';
};

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  userId,
  selectedMonth,
  categories,
  preferences,
  editingExpense,
  initialMode,
  initialType = 'expense'
}: Props) {
  const { t } = useTranslation();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [dueDay, setDueDay] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [applyToFuture, setApplyToFuture] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'quick' | 'fixed'>('quick');

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setDescription(editingExpense.description);
        setAmount(Math.round(editingExpense.amount * 100).toString());
        setTransactionType(editingExpense.type || 'expense');
        setCategoryId(editingExpense.category_id || '');
        setIsFixed(editingExpense.is_fixed || false);
        setDueDay(editingExpense.due_day ? editingExpense.due_day.toString() : '');
        setTransactionDate(editingExpense.created_at.split('T')[0]);
        setTransactionMode(editingExpense.is_fixed ? 'fixed' : 'quick');
      } else {
        setDescription('');
        setAmount('');
        setTransactionType(initialType);
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setCategoryId('');
        setIsFixed(initialMode === 'fixed');
        setTransactionMode(initialMode);
      }
      setIsInstallment(false);
      setInstallmentsCount('');
      setApplyToFuture(false);
    }
  }, [isOpen, editingExpense, initialMode]);

  if (!isOpen) return null;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amount || '0', 10) / 100;
    if (!userId || !description || numericAmount <= 0) return;

    let expensesToUpsert: Expense[] = [];
    const parsedDueDay = dueDay ? parseInt(dueDay, 10) : undefined;
    let targetMonthStr: string | undefined = undefined;

    if (editingExpense) {
      const isDifferentMonth = !editingExpense.created_at.startsWith(selectedMonth);

      if (editingExpense.is_fixed && isDifferentMonth) {
        if (applyToFuture) {
          const [year, month] = selectedMonth.split('-');
          const m = parseInt(month, 10);
          const y = parseInt(year, 10);
          const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
          
          const updatedOriginal = {
            ...editingExpense,
            end_month: prevMonth
          };
          const newFixedExpense: Expense = {
            id: generateUUID(),
            user_id: userId,
            description,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: true,
            due_day: parsedDueDay,
          };
          expensesToUpsert.push(updatedOriginal, newFixedExpense);
        } else {
          // We are editing a fixed expense from a different (future) month. Create a one-off override.
          const updatedOriginal = {
            ...editingExpense,
            excluded_months: [...(editingExpense.excluded_months || []), selectedMonth]
          };
          const overrideExpense: Expense = {
            id: generateUUID(),
            user_id: userId,
            description,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: false, // Override applies only to this month
            due_day: parsedDueDay,
          };
          expensesToUpsert.push(updatedOriginal, overrideExpense);
        }
      } else {
        // Normal edit of the base expense
        const [, , tDay] = transactionDate.split('-');
        const todayStr = new Date().toISOString().split('T')[0];
        const isFuture = transactionDate > todayStr;
        
        expensesToUpsert.push({
          ...editingExpense, 
          description, 
          amount: numericAmount, 
          type: transactionType,
          category_id: categoryId || undefined, 
          is_fixed: isFixed, 
          due_day: isFixed ? parsedDueDay : parseInt(tDay, 10),
          created_at: `${transactionDate}T${editingExpense.created_at.split('T')[1] || '12:00:00.000Z'}`,
          is_paid: isFuture ? false : editingExpense.is_paid
        });
      }
    } else {
      const [tYear, tMonth, tDay] = transactionDate.split('-');
      targetMonthStr = `${tYear}-${tMonth}`;
      
      if (isInstallment) {
        const count = parseInt(installmentsCount, 10) || 1;
        for (let i = 0; i < count; i++) {
          const date = new Date(parseInt(tYear, 10), parseInt(tMonth, 10) - 1 + i, 1);
          const targetMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          expensesToUpsert.push({
            id: generateUUID(),
            user_id: userId,
            description: `${description} (${i + 1}/${count})`,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${targetMonth}-${tDay}T12:00:00.000Z`,
            is_fixed: false,
            due_day: parsedDueDay,
            is_paid: false,
          });
        }
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const isFuture = transactionDate > todayStr;
        
        expensesToUpsert.push({
          id: generateUUID(),
          user_id: userId,
          description,
          amount: numericAmount,
          type: transactionType,
          category_id: categoryId || undefined,
          created_at: `${transactionDate}T12:00:00.000Z`,
          is_fixed: isFixed,
          due_day: isFixed ? parsedDueDay : parseInt(tDay, 10),
          is_paid: !isFixed && !isFuture,
        });
      }
    }
    
    onSave(expensesToUpsert, targetMonthStr);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
  };

  const formatAmountInput = (val: string) => {
    const num = parseInt(val || '0', 10);
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              {editingExpense
                ? (transactionType === 'income' ? t('dashboard.edit_income') : t('dashboard.edit_expense'))
                : (transactionType === 'income' ? t('dashboard.new_income') : t('dashboard.new_expense'))}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-300 text-2xl leading-none">&times;</button>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-5">
            {!editingExpense && transactionMode === 'fixed' && (
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType(initialType);
                    setCategoryId('');
                  }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    transactionType === 'expense' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('dashboard.expenses')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('income');
                    setCategoryId('');
                  }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    transactionType === 'income' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t('dashboard.incomes')}
                </button>
              </div>
            )}
            
            {/* Valor em Destaque */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden px-4">
              <div className="flex items-center gap-2 max-w-full">
                {getCurrencySymbol(preferences.currency || 'BRL').position === 'left' && (
                  <span className={`text-2xl font-bold ${transactionType === 'income' ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                    {getCurrencySymbol(preferences.currency || 'BRL').symbol}
                  </span>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmountInput(amount)}
                  onChange={handleAmountChange}
                  className={`bg-transparent text-center text-4xl font-bold outline-none w-full min-w-[50px] ${
                    transactionType === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  } placeholder-${transactionType === 'income' ? 'emerald' : 'rose'}-500/30`}
                  placeholder="0,00"
                  required
                />
                {getCurrencySymbol(preferences.currency || 'BRL').position === 'right' && (
                  <span className={`text-2xl font-bold ${transactionType === 'income' ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                    {getCurrencySymbol(preferences.currency || 'BRL').symbol}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.description')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-sm p-2.5 border outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  placeholder={t('dashboard.description_placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.category_optional')}</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-sm p-2.5 border outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">{t('dashboard.no_category')}</option>
                  {categories
                    .filter(c => c.type === transactionType)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              {transactionMode === 'quick' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.date')}</label>
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-sm p-2.5 border outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  {!editingExpense && transactionType === 'expense' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.installments')}</label>
                      <div className="flex items-center gap-3 h-[42px]">
                        <button
                          type="button"
                          onClick={() => setIsInstallment(!isInstallment)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                            isInstallment ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isInstallment ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-slate-300">{isInstallment ? t('dashboard.yes') : t('dashboard.no')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!editingExpense && transactionMode === 'quick' && isInstallment && transactionType === 'expense' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.months_quantity')}</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-sm p-2.5 border outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="Ex: 3"
                  />
                </div>
              )}

              {transactionMode === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.due_day')}</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-lg shadow-sm p-2.5 border outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ex: 5"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {t('dashboard.fixed_expense_help')}
                  </p>
                </div>
              )}
            </div>

            {editingExpense?.is_fixed && !editingExpense.created_at.startsWith(selectedMonth) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
                <p className="text-sm text-amber-200/80 mb-3">{t('dashboard.fixed_edit_warning')}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyToFuture(!applyToFuture)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      applyToFuture ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        applyToFuture ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-amber-200">{t('dashboard.apply_future')}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 text-sm font-bold transition-colors"
              >
                {editingExpense ? (
                  t('dashboard.save')
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {t('dashboard.add')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
