const fs = require('fs');

const summaryCardsCode = `import React from 'react';

interface SummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalPendente: number;
}

export function SummaryCards({ totalReceitas, totalDespesas, saldo, totalPendente }: SummaryCardsProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mt-6 space-y-4">
      <div>
         <h2 className="text-sm font-medium text-gray-500 mb-1">Receitas</h2>
         <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalReceitas)}
         </p>
      </div>
      <div className="pt-4 border-t border-gray-200">
         <h2 className="text-sm font-medium text-gray-500 mb-1">Despesas</h2>
         <p className="text-2xl font-bold text-red-600">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalDespesas)}
         </p>
      </div>
      <div className="pt-4 border-t border-gray-200">
         <h2 className="text-sm font-medium text-gray-500 mb-1">Saldo</h2>
         <p className={\`text-2xl font-bold \${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}\`}>
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(saldo)}
         </p>
      </div>
      <div className="pt-4 border-t border-gray-200">
         <h2 className="text-sm font-medium text-gray-500 mb-1">Despesas Pendentes</h2>
         <p className="text-lg font-bold text-orange-600">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalPendente)}
         </p>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/SummaryCards.tsx', summaryCardsCode);

const filterChipsCode = `import React from 'react';

interface FilterChipsProps {
  filterType: 'all' | 'income' | 'expense';
  setFilterType: (val: 'all' | 'income' | 'expense') => void;
  filterStatus: 'all' | 'paid' | 'pending';
  setFilterStatus: (val: 'all' | 'paid' | 'pending') => void;
}

export function FilterChips({ filterType, setFilterType, filterStatus, setFilterStatus }: FilterChipsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex bg-gray-100 p-1 rounded-lg w-max">
        <button className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-all \${filterType === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}\`} onClick={() => setFilterType('all')}>Todos</button>
        <button className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-all \${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}\`} onClick={() => setFilterType('income')}>Receitas</button>
        <button className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-all \${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}\`} onClick={() => setFilterType('expense')}>Despesas</button>
      </div>
      <div className="flex bg-gray-100 p-1 rounded-lg w-max">
        <button className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-all \${filterStatus === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}\`} onClick={() => setFilterStatus('all')}>Todos</button>
        <button className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-all \${filterStatus === 'paid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`} onClick={() => setFilterStatus('paid')}>Concluídos</button>
        <button className={\`px-3 py-1.5 rounded-md text-sm font-medium transition-all \${filterStatus === 'pending' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}\`} onClick={() => setFilterStatus('pending')}>Pendentes</button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/FilterChips.tsx', filterChipsCode);

let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dashboard = dashboard.replace('import { LogOut, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Calendar, CheckCircle, Circle, Tags } from \'lucide-react\';', 
\`import { LogOut, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Calendar, CheckCircle, Circle, Tags } from 'lucide-react';
import { SummaryCards } from '../components/SummaryCards';
import { FilterChips } from '../components/FilterChips';\`);

// Replace Summary Cards block
const summaryBlockRegex = /<div className="bg-white shadow rounded-lg p-6 mt-6 space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Lista de Gastos \*\/\}/;
dashboard = dashboard.replace(summaryBlockRegex, \`<SummaryCards totalReceitas={totalReceitas} totalDespesas={totalDespesas} saldo={saldo} totalPendente={totalPendente} />
          </div>

          {/* Lista de Gastos */}\`);

// Replace Filter Chips block
const filterChipsRegex = /\{\/\* Quick Filters \*\/\}\s*\{filteredExpenses\.length > 0 && \([\s\S]*?<\/div>\s*\)\}/;
dashboard = dashboard.replace(filterChipsRegex, \`{/* Quick Filters */}
              {filteredExpenses.length > 0 && (
                <FilterChips 
                  filterType={filterType} 
                  setFilterType={setFilterType} 
                  filterStatus={filterStatus} 
                  setFilterStatus={setFilterStatus} 
                />
              )}\`);

// Wrap expensive calculations in useMemo
dashboard = dashboard.replace(/const totalReceitas = [^\n]+;\n  const totalDespesas = [^\n]+;\n  const saldo = [^\n]+;\n  \n  const totalPendente = filteredExpenses\.reduce[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+;/m,
\`const { totalReceitas, totalDespesas, saldo, totalPendente } = React.useMemo(() => {
    const totalReceitas = filteredExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
    const totalDespesas = filteredExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
    const saldo = totalReceitas - totalDespesas;
    
    const totalPendente = filteredExpenses.reduce((acc, curr) => {
      if (curr.type === 'income') return acc;
      return isExpensePaid(curr, selectedMonth) ? acc : acc + curr.amount;
    }, 0);

    return { totalReceitas, totalDespesas, saldo, totalPendente };
  }, [filteredExpenses, selectedMonth]);\`);

dashboard = dashboard.replace(/const filteredExpenses = expenses\.filter[^\n]+\n[^\n]+\n[^\n]+\n    \n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+;/m,
\`const filteredExpenses = React.useMemo(() => expenses.filter(exp => {
    const expDate = new Date(exp.created_at);
    const expMonth = \`\${expDate.getFullYear()}-\${String(expDate.getMonth() + 1).padStart(2, '0')}\`;
    
    if (exp.is_fixed) {
      if (exp.excluded_months?.includes(selectedMonth)) return false;
      if (exp.end_month && selectedMonth > exp.end_month) return false;
      return expMonth <= selectedMonth;
    }
    return expMonth === selectedMonth;
  }), [expenses, selectedMonth]);\`);

dashboard = dashboard.replace(/const sortedExpenses = \[\.\.\.filteredExpenses\]\.sort[^\n]+\n[^\n]+\n[^\n]+\n\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n\n[^\n]+\n[^\n]+\n[^\n]+;/m,
\`const sortedExpenses = React.useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      const aPaid = isExpensePaid(a, selectedMonth);
      const bPaid = isExpensePaid(b, selectedMonth);

      if (aPaid !== bPaid) return aPaid ? 1 : -1;

      if (!aPaid) {
        const aDue = a.due_day || 99;
        const bDue = b.due_day || 99;
        if (aDue !== bDue) return aDue - bDue;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredExpenses, selectedMonth]);\`);

dashboard = dashboard.replace(/const finalExpenses = sortedExpenses\.filter[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+;/m,
\`const finalExpenses = React.useMemo(() => {
    return sortedExpenses.filter(expense => {
      if (filterType !== 'all' && (expense.type || 'expense') !== filterType) return false;
      const isPaid = isExpensePaid(expense, selectedMonth);
      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'pending' && isPaid) return false;
      return true;
    });
  }, [sortedExpenses, filterType, filterStatus, selectedMonth]);\`);

fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);
