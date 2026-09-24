import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import type { Expense, Category } from '../types';
import { useSpendingEvolution } from '../hooks/useSpendingEvolution';
import { formatCurrency } from '../utils/format';
import { usePreferences } from '../contexts/PreferencesContext';

interface SpendingEvolutionProps {
  allExpenses: Expense[];
  categories: Category[];
  selectedMonth: string;
}

export function SpendingEvolution({ allExpenses, categories, selectedMonth }: SpendingEvolutionProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const { preferences } = usePreferences();
  
  const { chartData, total, average, trend, hasData } = useSpendingEvolution(
    allExpenses,
    categories,
    selectedMonth,
    searchTerm
  );

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-3 shadow-xl backdrop-blur-sm">
          <p className="text-slate-300 text-sm mb-1">{label}</p>
          <p className="text-emerald-400 font-semibold">
            {formatCurrency(payload[0].value, preferences.currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{t('analytics.spending_evolution')}</h3>
      
      <div className="relative mb-6 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('analytics.search_placeholder')}
          className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder:text-slate-500 transition-all shadow-inner"
        />
      </div>

      {!searchTerm || searchTerm.trim().length < 2 ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
          <Search className="h-8 w-8 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 text-sm">
            {t('analytics.type_to_search')}
          </p>
        </div>
      ) : !hasData ? (
        <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
          <p className="text-slate-400 text-sm">
            {t('analytics.no_history', { term: searchTerm })}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{t('analytics.total_6m')}</p>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(total, preferences.currency)}</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{t('analytics.monthly_avg')}</p>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(average, preferences.currency)}</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/30">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{t('analytics.trend')}</p>
              <div className="flex items-center mt-1">
                {trend > 5 ? (
                  <div className="flex items-center text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-lg text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    +{trend.toFixed(1)}%
                  </div>
                ) : trend < -5 ? (
                  <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg text-sm font-semibold">
                    <TrendingDown className="h-4 w-4 mr-1.5" />
                    {trend.toFixed(1)}%
                  </div>
                ) : (
                  <div className="flex items-center text-slate-400 bg-slate-700/30 px-2.5 py-1 rounded-lg text-sm font-semibold">
                    <Minus className="h-4 w-4 mr-1.5" />
                    {t('analytics.stable')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="w-full pb-2">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    width={35}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={formatYAxis}
                  />
                  <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    fill="#f43f5e" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
