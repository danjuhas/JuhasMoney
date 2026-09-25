import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { usePreferences } from '../contexts/PreferencesContext';

interface SummaryCardsProps {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  totalPending: number;
  accumulatedBalance?: number;
  projectedBalance?: number;
}

export function SummaryCards({ totalIncomes, totalExpenses, balance, totalPending, accumulatedBalance = 0, projectedBalance = 0 }: SummaryCardsProps) {
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  
  const isProjectedPositive = projectedBalance >= 0;
  
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      
      {/* Saldo Destaque (Full Width) */}
      <div className="col-span-2 bg-slate-800 border border-slate-700 shadow-lg shadow-black/20 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden">
         <div className="flex justify-between items-start mb-2">
           <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('summary.balance')}</h2>
           {accumulatedBalance !== 0 && (
             <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded-full" title={t('summary.accumulated_tooltip', { amount: formatCurrency(accumulatedBalance, preferences.currency) })}>
               <Info className="w-3 h-3" />
               <span>{t('summary.accumulated')}</span>
             </div>
           )}
         </div>
         <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight truncate ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={balance.toString()}>
            {balance >= 0 ? '+ ' : ''}{formatCurrency(balance, preferences.currency)}
         </p>
         
         <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-400 uppercase font-medium">{t('summary.projected')}</span>
            <span className={`text-sm font-bold ${isProjectedPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isProjectedPositive ? '+' : ''}{formatCurrency(projectedBalance, preferences.currency)}
            </span>
         </div>
      </div>

      {/* Receitas e Despesas */}
      <div className="bg-slate-800 border border-slate-700 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.incomes')}</h2>
         <p className="text-lg sm:text-2xl font-bold tracking-tight text-emerald-400 truncate" title={totalIncomes.toString()}>
            + {formatCurrency(totalIncomes, preferences.currency)}
         </p>
      </div>
      <div className="bg-slate-800 border border-slate-700 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.expenses')}</h2>
         <p className="text-lg sm:text-2xl font-bold tracking-tight text-rose-400 truncate" title={totalExpenses.toString()}>
            - {formatCurrency(totalExpenses, preferences.currency)}
         </p>
      </div>

      {/* Total Pendente */}
      <div className="col-span-2 bg-slate-800 border border-slate-700 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.pending')}</h2>
         <p className="text-lg sm:text-2xl font-bold tracking-tight text-rose-400 truncate" title={totalPending.toString()}>
            - {formatCurrency(totalPending, preferences.currency)}
         </p>
      </div>
    </div>
  );
}

