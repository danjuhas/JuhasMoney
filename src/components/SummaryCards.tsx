import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../utils/format';
import { usePreferences } from '../contexts/PreferencesContext';



interface SummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalPendente: number;
}

export function SummaryCards({ totalReceitas, totalDespesas, saldo, totalPendente }: SummaryCardsProps) {
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-slate-800 border border-slate-700/60 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.incomes')}</h2>
         <p className="text-lg sm:text-2xl font-bold tracking-tight text-emerald-400 truncate" title={totalReceitas.toString()}>
            + {formatCurrency(totalReceitas, preferences.currency)}
         </p>
      </div>
      <div className="bg-slate-800 border border-slate-700/60 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.expenses')}</h2>
         <p className="text-lg sm:text-2xl font-bold tracking-tight text-rose-400 truncate" title={totalDespesas.toString()}>
            - {formatCurrency(totalDespesas, preferences.currency)}
         </p>
      </div>
      <div className="bg-slate-800 border border-slate-700/60 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.balance')}</h2>
         <p className={`text-lg sm:text-2xl font-bold tracking-tight truncate ${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} title={saldo.toString()}>
            {saldo >= 0 ? '+ ' : ''}{formatCurrency(saldo, preferences.currency)}
         </p>
      </div>
      <div className="bg-slate-800 border border-slate-700/60 shadow-lg shadow-black/20 rounded-2xl p-4 flex flex-col justify-center">
         <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('summary.pending')}</h2>
         <p className="text-lg sm:text-2xl font-bold tracking-tight text-rose-400 truncate" title={totalPendente.toString()}>
            - {formatCurrency(totalPendente, preferences.currency)}
         </p>
      </div>
    </div>
  );
}

