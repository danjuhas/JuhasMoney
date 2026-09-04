import { generateUUID } from '../utils/uuid';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTransactions } from '../hooks/useTransactions';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { preferences, updatePreferences } = usePreferences();
  
  // We need userId to fetch/save transactions, but we assume they are logged in if they are here.
  const [userId, setUserId] = useState<string | null>(null);
  const { addCategory, upsertExpenses } = useTransactions(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
      else setUserId(session.user.id);
    });
  }, [navigate]);

  const [step, setStep] = useState(1);
  const [name, setName] = useState(preferences.name || '');
  const [language, setLanguage] = useState(preferences.language || 'pt');
  const [currency, setCurrency] = useState(preferences.currency || 'BRL');
  
  const [incomeAmount, setIncomeAmount] = useState('');
  
  const handleNext = async () => {
    try {
      if (step === 1) {
        // Save basic preferences
        await updatePreferences({ name, language, currency });
        
        // Default categories
        if (userId) {
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_housing'), type: 'expense' });
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_food'), type: 'expense' });
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_transport'), type: 'expense' });
          addCategory({ id: generateUUID(), user_id: userId, name: t('onboarding.cat_salary'), type: 'income' });
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
            description: t('onboarding.salary_desc'),
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

  const formatAmountInput = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const num = parseInt(raw, 10) || 0;
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-6 shadow sm:rounded-lg">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-bold text-gray-900 text-center">{t('onboarding.welcome')}</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.name_placeholder')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.language')}</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pt">Português (BR)</option>
                <option value="en">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.currency')}</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar (US$)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            <button onClick={handleNext} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {t('onboarding.next')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 text-center">{t('onboarding.categories_title')}</h2>
            <p className="text-gray-600 text-center text-sm">{t('onboarding.categories_desc')}</p>
            
            <div className="flex flex-wrap gap-2 justify-center py-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{t('onboarding.cat_housing')}</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{t('onboarding.cat_food')}</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{t('onboarding.cat_transport')}</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{t('onboarding.cat_salary')}</span>
            </div>

            <button onClick={handleNext} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {t('onboarding.next')}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 text-center">{t('onboarding.income_title')}</h2>
            <p className="text-gray-600 text-center text-sm">{t('onboarding.income_desc')}</p>
            
            <div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-lg">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmountInput(incomeAmount)}
                  onChange={(e) => setIncomeAmount(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-12 pr-4 py-4 text-2xl border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 border outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleNext} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                {t('onboarding.finish')}
              </button>
              <button onClick={finishOnboarding} className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                {t('onboarding.skip')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
