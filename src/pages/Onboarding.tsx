import { generateUUID } from '../utils/uuid';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTransactions } from '../hooks/useTransactions';
import { supabase } from '../lib/supabase';
import { Infinity, Plus, X } from 'lucide-react';
import { CategoryModal } from '../components/CategoryModal';
import { getCategoryStyle } from '../constants/categories';

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences, updatePreferences } = usePreferences();
  
  const [userId, setUserId] = useState<string | null>(null);
  const { categories, addCategory, deleteCategory, upsertExpenses } = useTransactions(userId);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [name, setName] = useState(preferences.name || '');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setUserId(session.user.id);
        if (!preferences.name && session.user.user_metadata?.name) {
          setName(session.user.user_metadata.name);
        }
      }
    });
  }, [navigate, preferences.name]);

  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(preferences.language || 'pt');
  const [currency, setCurrency] = useState(preferences.currency || 'BRL');
  
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const [incomeAmount, setIncomeAmount] = useState('');
  
  const handleNext = async () => {
    try {
      if (step === 1) {
        // Save basic preferences
        await updatePreferences({ name, language, currency });
        
        // Default categories
        if (userId && categories.length === 0) {
          addCategory({ id: generateUUID(), user_id: userId, name: i18n.t('onboarding.cat_housing'), type: 'expense', icon: 'Home', color: 'bg-indigo-500' });
          addCategory({ id: generateUUID(), user_id: userId, name: i18n.t('onboarding.cat_food'), type: 'expense', icon: 'ShoppingCart', color: 'bg-orange-500' });
          addCategory({ id: generateUUID(), user_id: userId, name: i18n.t('onboarding.cat_transport'), type: 'expense', icon: 'Car', color: 'bg-sky-500' });
          addCategory({ id: generateUUID(), user_id: userId, name: i18n.t('onboarding.cat_salary'), type: 'income', icon: 'Briefcase', color: 'bg-emerald-500' });
        }
        setStep(2);
      } else if (step === 2) {
        setStep(3);
      } else if (step === 3) {
        if (incomeAmount && userId) {
          const amount = parseInt(incomeAmount || '0', 10) / 100;
          upsertExpenses([{
            id: generateUUID(),
            user_id: userId,
            description: i18n.t('onboarding.salary_desc'),
            amount: amount,
            type: 'income',
            created_at: new Date().toISOString(),
            is_fixed: true,
            due_day: 1,
            is_paid: false
          }]);
        }
        await finishOnboarding();
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + (err.message || String(err)));
      console.error(err);
    }
  };

  const finishOnboarding = async () => {
    await updatePreferences({ onboarding_completed: true });
    navigate('/');
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
        <div className="flex justify-center mb-6">
          <Infinity className="h-10 w-10 text-emerald-500" />
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
                onChange={(e) => {
                  setLanguage(e.target.value);
                  i18n.changeLanguage(e.target.value);
                }}
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

            <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all">
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
                    <button 
                      onClick={() => deleteCategory(cat.id)}
                      className="ml-1 p-0.5 hover:bg-black/20 rounded-full transition-colors"
                      title="Remover categoria"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            <button onClick={() => setIsCategoryModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-600 rounded-xl text-sm font-medium text-emerald-400 hover:bg-slate-800 hover:border-slate-500 transition-colors mb-4">
              <Plus className="w-4 h-4" />
              Adicionar nova categoria
            </button>

            <div className="flex flex-col gap-3">
              <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all">
                {t('onboarding.next')}
              </button>
              <button onClick={handleBack} className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-all">
                {i18n.language === 'en' ? 'Back' : i18n.language === 'es' ? 'Volver' : 'Voltar'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-white text-center">{t('onboarding.income_title')}</h2>
            <p className="text-slate-400 text-center text-sm">{t('onboarding.income_desc')}</p>
            
            <div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-lg">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmountInput(incomeAmount)}
                  onChange={(e) => setIncomeAmount(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-12 pr-4 py-4 text-2xl bg-slate-800 border-slate-700 text-slate-100 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 border transition-colors"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleNext} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/25 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all">
                {t('onboarding.finish')}
              </button>
              <button onClick={finishOnboarding} className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-all">
                {t('onboarding.skip')}
              </button>
              <button onClick={handleBack} className="w-full flex justify-center py-3 px-4 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-900 transition-all">
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
