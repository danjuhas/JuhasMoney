import { useTranslation } from 'react-i18next';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { Expense, Category } from '../types';

type Props = {
  expenses: Expense[];
  categories: Category[];
  totalReceitas: number;
  totalDespesas: number;
};

// Pastel colors for the donut chart
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AnalyticsOverview = ({
  expenses, categories, totalReceitas, totalDespesas }: Props) => {
  const { t } = useTranslation();
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

  const progressPercent = totalReceitas > 0 ? Math.min((totalDespesas / totalReceitas) * 100, 100) : (totalDespesas > 0 ? 100 : 0);
  const isOverBudget = totalDespesas > totalReceitas;

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
                {progressPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400">{t('analytics.of_income_spent')}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} 
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
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
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
        
      </div>
    </div>
  );
};
