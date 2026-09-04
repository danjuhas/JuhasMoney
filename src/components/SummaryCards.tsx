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
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{t('summary.incomes')}</h2>
         <p className="text-lg sm:text-xl font-bold text-green-600 truncate" title={totalReceitas.toString()}>
            {formatCurrency(totalReceitas, preferences.currency)}
         </p>
      </div>
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{t('summary.expenses')}</h2>
         <p className="text-lg sm:text-xl font-bold text-red-600 truncate" title={totalDespesas.toString()}>
            {formatCurrency(totalDespesas, preferences.currency)}
         </p>
      </div>
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{t('summary.balance')}</h2>
         <p className={`text-lg sm:text-xl font-bold truncate ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`} title={saldo.toString()}>
            {formatCurrency(saldo, preferences.currency)}
         </p>
      </div>
      <div className="bg-white shadow rounded-xl p-4 flex flex-col justify-center border border-gray-50 hover:shadow-md transition-shadow">
         <h2 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{t('summary.pending')}</h2>
         <p className="text-lg sm:text-xl font-bold text-orange-600 truncate" title={totalPendente.toString()}>
            {formatCurrency(totalPendente, preferences.currency)}
         </p>
      </div>
    </div>
  );
}

