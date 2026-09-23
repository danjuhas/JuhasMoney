import { useMemo } from 'react';
import type { Expense, Category } from '../types';
import { isActiveInMonth } from '../utils/transactions';

export function useSpendingEvolution(
  expenses: Expense[],
  categories: Category[],
  selectedMonth: string,
  searchTerm: string
) {
  return useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { chartData: [], total: 0, average: 0, trend: 0, hasData: false };
    }

    const lowerTerm = searchTerm.toLowerCase();

    // Gerar os últimos 6 meses ancorados no selectedMonth
    const [year, month] = selectedMonth.split('-').map(Number);
    const months: string[] = [];
    const monthNames: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(mStr);
      
      // Nome curto do mês em português (Ex: "Jan", "Fev")
      const monthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      monthNames.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));
    }

    // Filtrar despesas (ignorando receitas) que deem match na descrição ou categoria
    const matchedExpenses = expenses.filter(exp => {
      if (exp.type === 'income') return false; 
      
      const matchDesc = exp.description.toLowerCase().includes(lowerTerm);
      const cat = categories.find(c => c.id === exp.category_id);
      const matchCat = cat ? cat.name.toLowerCase().includes(lowerTerm) : false;
      
      return matchDesc || matchCat;
    });

    let total = 0;
    const chartData = months.map((mStr, idx) => {
      const amount = matchedExpenses.reduce((acc, exp) => {
        if (isActiveInMonth(exp, mStr)) {
          return acc + exp.amount;
        }
        return acc;
      }, 0);
      
      total += amount;
      return {
        monthStr: mStr,
        monthName: monthNames[idx],
        amount
      };
    });

    const average = total / 6;
    
    // Tendência: (Último mês - Média) / Média
    const lastMonthAmount = chartData[5].amount;
    let trend = 0;
    if (average > 0) {
      trend = ((lastMonthAmount - average) / average) * 100;
    } else if (lastMonthAmount > 0) {
      trend = 100; // Se a média era 0 e agora tem gasto, 100% de aumento
    }

    const hasData = total > 0;

    return { chartData, total, average, trend, hasData };
  }, [expenses, categories, selectedMonth, searchTerm]);
}

