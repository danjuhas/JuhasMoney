import { useTranslation } from 'react-i18next';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import { isActiveInMonth } from '../utils/transactions';
import type { Expense, Category } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { formatCurrency } from '../utils/format';

type Props = {
  expenses: Expense[];
  allExpenses: Expense[];
  selectedMonth: string;
  categories: Category[];
  totalReceitas: number;
  totalDespesas: number;
};

// Pastel colors for the donut chart
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AnalyticsOverview = ({
  expenses, allExpenses, selectedMonth, categories, totalReceitas, totalDespesas }: Props) => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const expenseData = useMemo(() => {
    // Filter only expenses (not income)
    const onlyExpenses = expenses.filter(e => e.type !== 'income');
    
    // Aggregate by category
    const categoryTotals = onlyExpenses.reduce((acc, curr) => {
      const catId = curr.category_id || 'uncategorized';
      acc[catId] = (acc[catId] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Map to array for Recharts
    let data = Object.entries(categoryTotals).map(([catId, amount]) => {
      if (catId === 'uncategorized') {
        return { name: 'Sem categoria', value: amount };
      }
      const category = categories.find(c => c.id === catId);
      return { name: category ? category.name : 'Desconhecida', value: amount };
    });

    // Sort by amount descending
    data.sort((a, b) => b.value - a.value);

    // Group small ones into "Outros" if there are more than 5
    if (data.length > 5) {
      const top5 = data.slice(0, 5);
      const others = data.slice(5).reduce((sum, item) => sum + item.value, 0);
      data = [...top5, { name: 'Outros', value: others }];
    }

    return data;
  }, [expenses, categories]);

  const topExpenses = useMemo(() => {
    return expenses
      .filter(e => e.type !== 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [expenses]);

  const historicalData = useMemo(() => {
    const data = [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    
    // Go back 5 months + current month = 6 months total
    date.setMonth(date.getMonth() - 5);
    
    for (let i = 0; i < 6; i++) {
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthExpenses = allExpenses.filter(e => isActiveInMonth(e, monthStr));
      const totalInc = monthExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
      const totalExp = monthExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
      
      const monthName = date.toLocaleDateString(t('dashboard.locale') || 'pt-BR', { month: 'short' });
      const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
      
      data.push({
        name: label,
        Receitas: totalInc,
        Despesas: totalExp
      });
      
      date.setMonth(date.getMonth() + 1);
    }
    return data;
  }, [allExpenses, selectedMonth, t]);

  const progressPercent = totalReceitas > 0 ? Math.min((totalDespesas / totalReceitas) * 100, 100) : (totalDespesas > 0 ? 100 : 0);
  const isOverBudget = totalDespesas > totalReceitas;
  const progressColor = progressPercent >= 80 ? 'bg-red-500' : (progressPercent > 50 ? 'bg-yellow-500' : 'bg-emerald-500');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChartIcon className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-800">{t('analytics.insights_month')}</h2>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Income vs Expense Progress */}
        <div className="flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('analytics.income_commitment')}</h3>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {totalReceitas > 0 ? `${progressPercent.toFixed(1)}%` : t('analytics.no_income')}
              </p>
              <p className="text-xs text-gray-400">{t('analytics.of_income_spent')}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${progressColor}`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          {isOverBudget && (
            <p className="text-xs text-red-500 mt-2 font-medium">
              Atenção: Suas despesas superaram suas receitas este mês!
            </p>
          )}
        </div>

        {/* Donut Chart */}
        <div className="h-48 relative">
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => 
                    formatCurrency(Number(value), preferences.currency)
                  }
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p className="text-sm">{t('analytics.no_expenses_recorded')}</p>
            </div>
          )}
        </div>

        {/* Top 3 Expenses */}
        {topExpenses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              {t('analytics.top_expenses') || 'Top 3 Maiores Despesas'}
            </h3>
            <div className="space-y-3">
              {topExpenses.map((exp, idx) => (
                <div key={exp.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium">{idx + 1}</span>
                    <span className="text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">{exp.description}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(exp.amount, preferences.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical 6 Months */}
        <div className="mt-4 w-full">
          <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {t('analytics.historical') || 'Evolução (6 Meses)'}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => val > 0 ? (val > 1000 ? `${(val/1000).toFixed(1)}k` : val) : ''} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  formatter={(value: any) => formatCurrency(Number(value), preferences.currency)}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Receitas" name={t('dashboard.incomes') || 'Receitas'} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" name={t('dashboard.expenses') || 'Despesas'} fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
};
