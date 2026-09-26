import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { generateUUID } from '../utils/uuid';
import type { Expense, Category, CreditCard } from '../types';
import { useTranslation } from 'react-i18next';
import { CreditCard as CreditCardIcon, AlertCircle } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../utils/format';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expensesToUpsert: Expense[]) => void;
  userId: string | null;
  categories: Category[];
  cards: CreditCard[];
  preferences: any;
  initialCardId?: string;
  editingExpense?: Expense | null;
};

export function CreditCardTransactionModal({
  isOpen,
  onClose,
  onSave,
  userId,
  categories,
  cards,
  preferences,
  initialCardId,
  editingExpense
}: Props) {
  const { t } = useTranslation();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
  };

  const formatAmountInput = (val: string) => {
    const num = parseInt(val || '0', 10);
    return (num / 100).toLocaleString(t('dashboard.locale') || 'pt-BR', { minimumFractionDigits: 2 });
  };

  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setDescription(editingExpense.description);
        setAmount(Math.round(editingExpense.amount * 100).toString());
        setCategoryId(editingExpense.category_id || '');
        setCreditCardId(editingExpense.credit_card_id || initialCardId || '');
        setPurchaseDate(editingExpense.created_at.split('T')[0]);
        setInstallments(1); // Usually we don't edit installments count once created, or it's represented by group_id
      } else {
        setDescription('');
        setAmount('');
        setCategoryId('');
        setCreditCardId(initialCardId || '');
        setInstallments(1);
        setPurchaseDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, editingExpense, initialCardId]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAmount('');
      setCategoryId('');
      setCreditCardId(initialCardId || '');
      setInstallments(1);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (cards.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" className="p-6 text-center" zIndex="z-[70]">

          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">{t('dashboard.no_card_title')}</h2>
          <p className="text-slate-400 mb-6">{t('dashboard.no_card_desc')}</p>
          <Button variant="secondary" onClick={onClose} fullWidth>Entendi</Button>
      </Modal>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const numAmount = parseInt(amount || '0', 10) / 100;
    if (!description || !amount || isNaN(numAmount) || numAmount <= 0) {
      setError(t('dashboard.fill_error'));
      return;
    }

    if (!creditCardId) {
      setError(t('dashboard.card_error'));
      return;
    }
    
    setError('');
    const expenses: Expense[] = [];
    const groupId = installments > 1 ? generateUUID() : undefined;
    const amountPerInstallment = numAmount / installments;
    
    // Create N expenses
    const baseDate = new Date(purchaseDate);
    
    for (let i = 0; i < installments; i++) {
      // For each installment, we shift the "purchase date" conceptually by 1 month so it hits the next bill
      // Wait, getEffectiveMonth uses the purchase date. 
      // If we just add +i months to the purchaseDate, it will naturally fall into the Nth bill!
      const currentInstDate = new Date(baseDate);
      currentInstDate.setMonth(currentInstDate.getMonth() + i);
      
      const desc = installments > 1 ? `${description} (${i + 1}/${installments})` : description;

      expenses.push({
        id: generateUUID(),
        user_id: userId,
        description: desc,
        amount: amountPerInstallment,
        category_id: categoryId || undefined,
        credit_card_id: creditCardId,
        type: 'expense',
        is_paid: false, // Credit card bills are paid on the dashboard
        is_fixed: false, // Credit card installments are NOT "is_fixed" in the recurring sense, they are exact entries
        created_at: currentInstDate.toISOString(),
        installments: installments > 1 ? { current: i + 1, total: installments } : undefined,
        group_id: groupId
      });
    }

    onSave(expenses);
    
    // Reset
    setDescription('');
    setAmount('');
    setInstallments(1);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" className="p-6" zIndex="z-[70]">

        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <div className="bg-purple-500/20 text-purple-400 p-2 rounded-xl">
            <CreditCardIcon className="w-5 h-5" />
          </div>
          Compra no Cartão
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            {error}
          </div>
        )}

                <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-6 mb-6 rounded-2xl border flex flex-col items-center justify-center transition-colors bg-purple-500/10 border-purple-500/20">
            <div className="flex items-center gap-2 max-w-full">
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(amount)}
                onChange={handleAmountChange}
                className="bg-transparent text-center text-4xl sm:text-5xl font-bold outline-none w-full min-w-[50px] text-purple-400 placeholder-purple-500/30"
                placeholder="0,00"
                required
              />
              {getCurrencySymbol(preferences.currency || 'BRL').position === 'right' && (
                <span className="text-2xl font-bold text-purple-500/80">
                  {getCurrencySymbol(preferences.currency || 'BRL').symbol}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('dashboard.purchase_date')}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setPurchaseDate(d.toISOString().split('T')[0]);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {t('dashboard.yesterday')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setPurchaseDate(d.toISOString().split('T')[0]);
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                {t('dashboard.today')}
              </button>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} focusColor="purple" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.description')}</label>
            <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} translate="no" placeholder={t('dashboard.description_placeholder')} focusColor="purple" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.category_optional')}</label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} translate="no" focusColor="purple">
              <option value="">Selecione...</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.card')}</label>
              <Select value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} focusColor="purple" required>
                <option value="">{t('dashboard.card_select')}</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            {!editingExpense && (<div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t('dashboard.installments_count')}</label>
              <Select value={installments} onChange={e => setInstallments(Number(e.target.value))} focusColor="purple">
                {[...Array(24)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}x</option>
                ))}
              </Select>
            </div>)}
          </div>
          
          {installments > 1 && (parseInt(amount || '0', 10) / 100) > 0 && (
             <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-sm text-purple-300 text-center">
               {t('dashboard.installments_preview', { count: installments })} <strong>{formatCurrency((parseInt(amount || '0', 10) / 100) / installments, preferences.currency)}</strong>
             </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button className="flex-1" variant="secondary" onClick={onClose}>{t('dashboard.cancel')}</Button>
            <Button type="submit" className="flex-1 bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/25 border-0">{t('dashboard.save')}</Button>
          </div>
        </form>
      </Modal>
  );
}
