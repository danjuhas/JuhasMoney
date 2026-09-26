import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { SegmentedControl } from './ui/SegmentedControl';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { generateUUID } from '../utils/uuid';
import { getCurrencySymbol } from '../utils/format';
import type { Expense, Category, CreditCard } from '../types';
import { useTranslation } from 'react-i18next';
import { TrendingDown, TrendingUp } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expensesToUpsert: Expense[], targetMonthStr?: string) => void;
  userId: string | null;
  selectedMonth: string;
  categories: Category[];
  cards: CreditCard[];
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
  initialType = 'expense',
  // @ts-ignore
  cards
}: Props) {
  const { t } = useTranslation();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [creditCardId, setCreditCardId] = useState<string | null>(null);
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
      setCreditCardId(editingExpense.credit_card_id || null);
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
    if (!userId || !description || numericAmount < 0) return;

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
      credit_card_id: creditCardId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: true,
            due_day: parsedDueDay,
            is_paid: false,
            paid_months: [],
            excluded_months: [],
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
      credit_card_id: creditCardId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: false, // Override applies only to this month
            due_day: parsedDueDay,
            is_paid: false,
            paid_months: [],
            excluded_months: [],
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
      credit_card_id: creditCardId || undefined, 
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
        const groupId = generateUUID();
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
      credit_card_id: creditCardId || undefined,
            created_at: `${targetMonth}-${tDay}T12:00:00.000Z`,
            is_fixed: false,
            due_day: parseInt(tDay, 10),
            is_paid: false,
            group_id: groupId,
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
      credit_card_id: creditCardId || undefined,
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
    return (num / 100).toLocaleString(t('dashboard.locale') || 'pt-BR', { minimumFractionDigits: 2 });
  };


  const textIcon = transactionType === 'income' ? 'text-emerald-400' : 'text-rose-400';
  const textIconTint = transactionType === 'income' ? 'text-emerald-500/80' : 'text-rose-500/80';
  const bgIconTint = transactionType === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20';
  const bgTint = transactionType === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const borderTint = transactionType === 'income' ? 'border-emerald-500/20' : 'border-rose-500/20';
  const placeholderTint = transactionType === 'income' ? 'placeholder-emerald-500/30' : 'placeholder-rose-500/30';
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" className="p-6 max-h-[90vh] overflow-y-auto" zIndex="z-[70]">
<h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <div className={`${bgIconTint} ${textIcon} p-2 rounded-xl`}>
              {transactionType === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            {editingExpense
              ? (transactionType === 'income' ? t('dashboard.edit_income') : t('dashboard.edit_expense'))
              : (transactionType === 'income' ? t('dashboard.new_income') : (transactionMode === 'fixed' ? t('dashboard.new_fixed_expense') : t('dashboard.new_expense')))}
          </h2>

          <form onSubmit={handleAddExpense} className="space-y-5">
            {!editingExpense && transactionMode === 'fixed' && (
              <SegmentedControl
                value={transactionType}
                onChange={(val) => {
                  setTransactionType(val);
                  setCategoryId('');
                }}
                className="border border-slate-700"
                options={[
                  { value: 'income', label: t('settings.income'), activeColor: 'emerald' },
                  { value: 'expense', label: t('settings.expense'), activeColor: 'rose' }
                ]}
              />
            )}
            
            {/* Valor em Destaque */}
            <div className={`p-6 mb-6 rounded-2xl border flex flex-col items-center justify-center transition-colors ${bgTint} ${borderTint}`}>
              <div className="flex items-center gap-2 max-w-full">
                {getCurrencySymbol(preferences.currency || 'BRL').position === 'left' && (
                  <span className={`text-2xl font-bold ${textIconTint}`}>
                    {getCurrencySymbol(preferences.currency || 'BRL').symbol}
                  </span>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmountInput(amount)}
                  onChange={handleAmountChange}
                  className={`bg-transparent text-center text-4xl sm:text-5xl font-bold outline-none w-full min-w-[50px] ${textIcon} ${placeholderTint}`}
                  placeholder="0,00"
                  required
                />
                {getCurrencySymbol(preferences.currency || 'BRL').position === 'right' && (
                  <span className={`text-2xl font-bold ${textIconTint}`}>
                    {getCurrencySymbol(preferences.currency || 'BRL').symbol}
                  </span>
                )}
              </div>
            </div>

                        <div className="space-y-4">
              {transactionMode === 'quick' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('dashboard.date')}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setTransactionDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {t('dashboard.yesterday')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        setTransactionDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {t('dashboard.today')}
                    </button>
                    <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} focusColor="rose" required />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.description')}</label>
                <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} translate="no" placeholder={t('dashboard.description_placeholder')} focusColor={transactionType === 'income' ? 'emerald' : 'rose'} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.category_optional')}</label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} translate="no" focusColor={transactionType === 'income' ? 'emerald' : 'rose'}>
                  <option value="">{t('dashboard.no_category')}</option>
                  {categories
                    .filter(c => c.type === transactionType)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </Select>
              </div>


              
              
              {transactionMode === 'quick' && !editingExpense && transactionType === 'expense' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.installments')}</label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                      type="button"
                      onClick={() => setIsInstallment(!isInstallment)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        isInstallment ? 'bg-rose-500' : 'bg-slate-700'
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
              {!editingExpense && transactionMode === 'quick' && isInstallment && transactionType === 'expense' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.months_quantity')}</label>
                  <Input type="number" min="2" value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} placeholder="Ex: 3" focusColor="rose" required />
                </div>
              )}

              {transactionMode === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{transactionType === 'income' ? t('dashboard.payment_day') : t('dashboard.due_day')}</label>
                  <Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Ex: 5" focusColor={transactionType === 'income' ? 'emerald' : 'rose'} required />
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

            <div className="pt-4 flex gap-3">
              <Button className="flex-1" variant="secondary" onClick={onClose}>{t('dashboard.cancel')}</Button>
              <Button className="flex-1" type="submit" variant={transactionType === 'income' ? 'primary' : 'danger'}>
                {editingExpense ? t('dashboard.save') : t('dashboard.add')}
              </Button>
            </div>
          </form>
      </Modal>
  );
}
