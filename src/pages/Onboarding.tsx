import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Infinity, Plus, X, Trash2 } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTransactions } from '../hooks/useTransactions';
import { generateUUID } from '../utils/uuid';
import { supabase } from '../lib/supabase';
import { CategoryModal } from '../components/CategoryModal';
import { getCategoryStyle } from '../constants/categories';
import type { Expense } from '../types';

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { preferences, updatePreferences } = usePreferences();
  

  // Global
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null));
  }, []);

  const [step, setStep] = useState(1);
  
  // Step 1
  const name = preferences.name || '';
  const [language, setLanguage] = useState(i18n.language || 'pt');
  const [currency, setCurrency] = useState(preferences.currency || 'BRL');
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const { categories, addCategory, deleteCategory, upsertExpenses } = useTransactions(userId || '');

  // Step 3: Income
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDay, setIncomeDay] = useState('5');
  
  // Step 4: Fixed Expenses
  const [draftExpenseName, setDraftExpenseName] = useState('');
  const [draftExpenseAmount, setDraftExpenseAmount] = useState('');
  const [draftExpenseDay, setDraftExpenseDay] = useState('');
  const [onboardingExpenses, setOnboardingExpenses] = useState<Array<{ id: string, name: string, amount: number, day: number }>>([]);

  useEffect(() => {
    if (preferences.onboarding_completed) {
      navigate('/');
    }
  }, [preferences.onboarding_completed, navigate]);

  useEffect(() => {
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleNext = async () => {
    try {
      if (step === 1) {
        await updatePreferences({ name, language, currency });
        if (userId && categories.length === 0) {
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_housing'), type: 'expense', icon: 'Home', color: 'bg-indigo-500' });
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_food'), type: 'expense', icon: 'ShoppingCart', color: 'bg-orange-500' });
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_transport'), type: 'expense', icon: 'Car', color: 'bg-sky-500' });
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_salary'), type: 'income', icon: 'Briefcase', color: 'bg-emerald-500' });
        }
        setStep(2);
      } else if (step === 2) {
        setStep(3);
      } else if (step === 3) {
        setStep(4);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + (err.message || String(err)));
    }
  };

  const handleAddDraftExpense = () => {
    if (!draftExpenseName || !draftExpenseAmount || !draftExpenseDay) return;
    const amountNum = parseInt(draftExpenseAmount || '0', 10) / 100;
    if (amountNum <= 0) return;
    
    setOnboardingExpenses(prev => [...prev, {
      id: generateUUID(),
      name: draftExpenseName,
      amount: amountNum,
      day: parseInt(draftExpenseDay, 10) || 1
    }]);
    
    setDraftExpenseName('');
    setDraftExpenseAmount('');
    setDraftExpenseDay('');
  };

  const finishOnboarding = async () => {
    try {
      let expensesToUpsert: Expense[] = [];
      const currentMonth = new Date().toISOString().split('-').slice(0, 2).join('-');
      
      // Smart Add if something is in draft when clicking finish
      const finalExpenses = [...onboardingExpenses];
      if (draftExpenseName && draftExpenseAmount) {
        const amountNum = parseInt(draftExpenseAmount || '0', 10) / 100;
        if (amountNum > 0) {
           finalExpenses.push({
             id: generateUUID(),
             name: draftExpenseName,
             amount: amountNum,
             day: parseInt(draftExpenseDay || '1', 10)
           });
        }
      }

      if (userId) {
        // 1. Add Income if exists
        const incAmt = parseInt(incomeAmount || '0', 10) / 100;
        if (incAmt > 0) {
          expensesToUpsert.push({
            id: generateUUID(),
            user_id: userId,
            description: t('onboarding.salary_desc'),
            amount: incAmt,
            type: 'income',
            created_at: `${currentMonth}-01T12:00:00.000Z`,
            is_fixed: true,
            due_day: parseInt(incomeDay || '1', 10),
            is_paid: false
          });
        }
        
        // 2. Add Fixed Expenses
        finalExpenses.forEach(exp => {
           expensesToUpsert.push({
              id: exp.id,
              user_id: userId,
              description: exp.name,
              amount: exp.amount,
              type: 'expense',
              created_at: `${currentMonth}-01T12:00:00.000Z`,
              is_fixed: true,
              due_day: exp.day,
              is_paid: false
           });
        });
        
        if (expensesToUpsert.length > 0) {
          await upsertExpenses(expensesToUpsert);
        }
      }
      
      await updatePreferences({ onboarding_completed: true });
      navigate('/');
    } catch (err: any) {
       console.error(err);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const formatAmountInput = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = parseInt(raw, 10) || 0;
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-slate-900 py-8 px-6 shadow-xl border border-slate-800 sm:rounded-2xl">
        <div className="flex flex-col items-center mb-8">
          <Infinity className="h-10 w-10 text-emerald-500 mb-6" />
          
          {/* Progress Indicator */}
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : s < step ? 'w-2 bg-emerald-500/50' : 'w-2 bg-slate-800'}`} />
            ))}
          </div>
        </div>
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-white text-center">
              {name ? t('onboarding.welcome_name', { name }) : t('onboarding.welcome')}
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t('onboarding.language')}</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-100 shadow-sm p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="pt">Português (BR)</option>
                <option value="en">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t('onboarding.currency')}</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-100 shadow-sm p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar (US$)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
              {t('onboarding.next')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-white text-center">{t('onboarding.categories_title')}</h2>
            <p className="text-slate-400 text-center text-sm">{t('onboarding.categories_desc')}</p>
            
            <div className="flex flex-wrap gap-2 justify-center py-4">
              {categories.map(cat => {
                const { Icon: IconComponent, bgColor, textColor } = getCategoryStyle(cat);
                return (
                  <span key={cat.id} className={`inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
                    {IconComponent && <IconComponent className="w-4 h-4" />}
                    {cat.name}
                    <button onClick={() => deleteCategory(cat.id)} className="ml-1 p-0.5 hover:bg-black/20 rounded-full transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            <button 
              onClick={() => setIsCategoryModalOpen(true)} 
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors mb-4 border border-slate-700"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              {i18n.language === 'en' ? 'Create custom category' : i18n.language === 'es' ? 'Crear categoría personalizada' : 'Criar categoria personalizada'}
            </button>

            <div className="flex flex-col gap-3">
              <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
                {t('onboarding.next')}
              </button>
              <button onClick={handleBack} className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {i18n.language === 'en' ? 'Back' : i18n.language === 'es' ? 'Volver' : 'Voltar'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-white text-center">{t('onboarding.income_title')}</h2>
            <p className="text-slate-400 text-center text-sm">{t('onboarding.income_desc')}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('onboarding.salary_value')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmountInput(incomeAmount)}
                    onChange={(e) => setIncomeAmount(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-800 border-slate-700 text-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 border transition-colors"
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('onboarding.payment_day')}</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={incomeDay}
                  onChange={(e) => setIncomeDay(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-800 border-slate-700 text-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 border transition-colors"
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
                {incomeAmount ? t('onboarding.next') : t('onboarding.skip')}
              </button>
              <button onClick={handleBack} className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {i18n.language === 'en' ? 'Back' : i18n.language === 'es' ? 'Volver' : 'Voltar'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{t('onboarding.fixed_expenses_title')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('onboarding.fixed_expenses_desc')}</p>
            </div>
            
            {/* List of added expenses */}
            {onboardingExpenses.length > 0 && (
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {onboardingExpenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{exp.name}</p>
                      <p className="text-xs text-slate-400">Dia {exp.day}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-rose-400">{(exp.amount).toLocaleString('pt-BR', { style: 'currency', currency })}</span>
                      <button onClick={() => setOnboardingExpenses(prev => prev.filter(e => e.id !== exp.id))} className="text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Form */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('onboarding.expense_name')}</label>
                <input
                  type="text"
                  value={draftExpenseName}
                  onChange={(e) => setDraftExpenseName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  placeholder={t("onboarding.expense_name_ph")}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t('onboarding.value')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmountInput(draftExpenseAmount)}
                    onChange={(e) => setDraftExpenseAmount(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="0,00"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t('onboarding.day')}</label>
                  <input
                    type="number"
                    min="1" max="31"
                    value={draftExpenseDay}
                    onChange={(e) => setDraftExpenseDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder={t("onboarding.due_ph")}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddDraftExpense}
                disabled={!draftExpenseName || !draftExpenseAmount || !draftExpenseDay}
                className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('onboarding.add_to_list')}
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button onClick={finishOnboarding} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
                {onboardingExpenses.length > 0 || draftExpenseName ? t('onboarding.finish_save') : t('onboarding.skip_finish')}
              </button>
              <button onClick={handleBack} className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {i18n.language === 'en' ? 'Back' : i18n.language === 'es' ? 'Volver' : 'Voltar'}
              </button>
            </div>
          </div>
        )}

      </div>
      
      {userId && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={addCategory}
          userId={userId}
        />
      )}
    </div>
  );
}
