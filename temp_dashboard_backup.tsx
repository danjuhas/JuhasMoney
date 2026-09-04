import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Expense, Category } from '../types';
import { LogOut, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Calendar, CheckCircle, Circle, Tags } from 'lucide-react';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [dueDay, setDueDay] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [applyToFuture, setApplyToFuture] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const mockUser = localStorage.getItem('juhas_mock_user');
    if (!mockUser) {
      navigate('/login');
    } else {
      setUserId(mockUser);
      fetchExpenses(mockUser);
    }
  };

  const fetchExpenses = async (uid: string) => {
    setLoading(true);
    // Mock fetching from local storage
    const localData = localStorage.getItem(`juhas_expenses_${uid}`);
    if (localData) {
      setExpenses(JSON.parse(localData));
    } else {
      setExpenses([]);
    }
    
    const localCategories = localStorage.getItem(`juhas_categories_${uid}`);
    if (localCategories) {
      setCategories(JSON.parse(localCategories));
    } else {
      setCategories([]);
    }
    setLoading(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newCategoryName.trim()) return;

    const newCat: Category = {
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      name: newCategoryName.trim(),
      type: newCategoryType,
    };

    const newCategories = [...categories, newCat];
    setCategories(newCategories);
    localStorage.setItem(`juhas_categories_${userId}`, JSON.stringify(newCategories));
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string) => {
    if (!userId) return;
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    localStorage.setItem(`juhas_categories_${userId}`, JSON.stringify(newCategories));
    if (categoryId === id) setCategoryId('');
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amount || '0', 10) / 100;
    if (!userId || !description || numericAmount <= 0) return;

    let newExpenses = [...expenses];
    const parsedDueDay = dueDay ? parseInt(dueDay, 10) : undefined;

    if (editingId) {
      const originalExpense = expenses.find(e => e.id === editingId);
      const isDifferentMonth = originalExpense && !originalExpense.created_at.startsWith(selectedMonth);

      if (originalExpense && originalExpense.is_fixed && isDifferentMonth) {
        if (applyToFuture) {
          const [year, month] = selectedMonth.split('-');
          const m = parseInt(month, 10);
          const y = parseInt(year, 10);
          const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
          
          const updatedOriginal = {
            ...originalExpense,
            end_month: prevMonth
          };
          const newFixedExpense: Expense = {
            id: Math.random().toString(36).substring(7),
            user_id: userId,
            description,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: true,
            due_day: parsedDueDay,
          };
          newExpenses = expenses.map(e => e.id === editingId ? updatedOriginal : e);
          newExpenses = [newFixedExpense, ...newExpenses];
        } else {
          // We are editing a fixed expense from a different (future) month. Create a one-off override.
          const updatedOriginal = {
            ...originalExpense,
            excluded_months: [...(originalExpense.excluded_months || []), selectedMonth]
          };
          const overrideExpense: Expense = {
            id: Math.random().toString(36).substring(7),
            user_id: userId,
            description,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: false, // Override applies only to this month
            due_day: parsedDueDay,
          };
          newExpenses = expenses.map(e => e.id === editingId ? updatedOriginal : e);
          newExpenses = [overrideExpense, ...newExpenses];
        }
      } else {
        // Normal edit of the base expense
        newExpenses = expenses.map(exp => 
          exp.id === editingId 
            ? { ...exp, description, amount: numericAmount, type: transactionType,
            category_id: categoryId || undefined, is_fixed: isFixed, due_day: isFixed ? parsedDueDay : undefined }
            : exp
        );
      }
    } else {
      if (isInstallment) {
        const count = parseInt(installmentsCount, 10) || 1;
        const generatedExpenses: Expense[] = [];
        for (let i = 0; i < count; i++) {
          const [yearStr, monthStr] = selectedMonth.split('-');
          const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + i, 1);
          const targetMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          generatedExpenses.push({
            id: Math.random().toString(36).substring(7) + i,
            user_id: userId,
            description: `${description} (${i + 1}/${count})`,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${targetMonth}-01T12:00:00.000Z`,
            is_fixed: false,
            due_day: parsedDueDay,
            is_paid: false,
          });
        }
        newExpenses = [...generatedExpenses, ...expenses];
      } else {
        const newExpense: Expense = {
          id: Math.random().toString(36).substring(7),
          user_id: userId,
          description,
          amount: numericAmount,
          type: transactionType,
            category_id: categoryId || undefined,
          created_at: `${selectedMonth}-01T12:00:00.000Z`,
          is_fixed: isFixed,
          due_day: isFixed ? parsedDueDay : undefined,
          is_paid: !isFixed,
        };
        newExpenses = [newExpense, ...expenses];
      }
    }
    
    setExpenses(newExpenses);
    localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));

    handleCancelEdit();
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingId(expense.id);
    setDescription(expense.description);
    setAmount(Math.round(expense.amount * 100).toString());
    setTransactionType(expense.type || 'expense');
    setCategoryId(expense.category_id || '');
    setIsFixed(expense.is_fixed || false);
    setDueDay(expense.due_day ? expense.due_day.toString() : '');
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setTransactionType('expense');
    setCategoryId('');
    setIsFixed(false);
    setIsInstallment(false);
    setInstallmentsCount('');
    setDueDay('');
    setApplyToFuture(false);
    setIsModalOpen(false);
  };

  const openModal = (type: 'income' | 'expense') => {
    handleCancelEdit();
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    let newExpenses;
    const expenseToDelete = expenses.find(e => e.id === id);
    const isDifferentMonth = expenseToDelete && !expenseToDelete.created_at.startsWith(selectedMonth);

    if (expenseToDelete && expenseToDelete.is_fixed && isDifferentMonth) {
      const updated = {
        ...expenseToDelete,
        excluded_months: [...(expenseToDelete.excluded_months || []), selectedMonth]
      };
      newExpenses = expenses.map(e => e.id === id ? updated : e);
    } else {
      newExpenses = expenses.filter(e => e.id !== id);
    }
    setExpenses(newExpenses);
    if (userId) {
      localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));
    }
  };
  const handleTogglePaid = (expense: Expense) => {
    const newExpenses = expenses.map(e => {
      if (e.id === expense.id) {
        if (e.is_fixed) {
          const paidMonths = e.paid_months || [];
          const isPaid = paidMonths.includes(selectedMonth);
          return {
            ...e,
            paid_months: isPaid
              ? paidMonths.filter(m => m !== selectedMonth)
              : [...paidMonths, selectedMonth]
          };
        } else {
          return { ...e, is_paid: !e.is_paid };
        }
      }
      return e;
    });
    setExpenses(newExpenses);
    if (userId) {
      localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('juhas_mock_user');
    navigate('/login');
  };

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-');
    let m = parseInt(month, 10);
    let y = parseInt(year, 10);
    if (m === 1) {
      m = 12;
      y -= 1;
    } else {
      m -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-');
    let m = parseInt(month, 10);
    let y = parseInt(year, 10);
    if (m === 12) {
      m = 1;
      y += 1;
    } else {
      m += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setAmount(digits);
  };

  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.created_at);
    const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (exp.is_fixed) {
      if (exp.excluded_months?.includes(selectedMonth)) return false;
      if (exp.end_month && selectedMonth > exp.end_month) return false;
      return expMonth <= selectedMonth;
    }
    return expMonth === selectedMonth;
  });

  const isExpensePaid = (exp: Expense, monthStr: string) => {
    if (exp.is_fixed) {
      return exp.paid_months?.includes(monthStr) || false;
    }
    return exp.is_paid || false;
  };

  const totalReceitas = filteredExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
  const totalDespesas = filteredExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
  const saldo = totalReceitas - totalDespesas;
  
  const totalPendente = filteredExpenses.reduce((acc, curr) => {
    if (curr.type === 'income') return acc;
    return isExpensePaid(curr, selectedMonth) ? acc : acc + curr.amount;
  }, 0);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const aPaid = isExpensePaid(a, selectedMonth);
    const bPaid = isExpensePaid(b, selectedMonth);

    // 1. Pending on top, Paid on bottom
    if (aPaid !== bPaid) {
      return aPaid ? 1 : -1;
    }

    // 2. If both are pending, sort by due date first
    if (!aPaid) {
      const aDue = a.due_day || 99; // 99 pushes it to the bottom of the pending list if no due date
      const bDue = b.due_day || 99;
      if (aDue !== bDue) {
        return aDue - bDue;
      }
    }

    // 3. Fallback to creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const finalExpenses = sortedExpenses.filter(expense => {
    if (filterType !== 'all' && (expense.type || 'expense') !== filterType) return false;
    const isPaid = isExpensePaid(expense, selectedMonth);
    if (filterStatus === 'paid' && !isPaid) return false;
    if (filterStatus === 'pending' && isPaid) return false;
    return true;
  });

  const editingExpense = expenses.find(e => e.id === editingId);
  const isEditingFutureFixed = editingExpense && editingExpense.is_fixed && !editingExpense.created_at.startsWith(selectedMonth);

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">JuhasMoney</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <Tags className="h-4 w-4 mr-1" />
                Categorias
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Adicionar Gasto Form */}
          <div className="md:col-span-1">
            <div className="flex flex-col gap-3 mb-6">
              <button onClick={() => openModal('income')} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center font-medium shadow-sm transition-colors">
                <Plus className="w-5 h-5 mr-1" /> Nova Receita
              </button>
              <button onClick={() => openModal('expense')} className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 flex items-center justify-center font-medium shadow-sm transition-colors">
                <Plus className="w-5 h-5 mr-1" /> Nova Despesa
              </button>
            </div>

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
                 <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
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
          </div>

          {/* Lista de Gastos */}
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 h-full">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-lg font-medium text-gray-900">Meus Lançamentos</h2>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCurrentMonth}
                    disabled={isCurrentMonth}
                    className={`p-2 rounded-lg transition-colors ${
                      isCurrentMonth
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                    title="Voltar para mês atual"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={handlePreviousMonth}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                      title="Mês anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="w-36 text-center font-medium text-sm text-gray-800 capitalize">
                      {formatMonthYear(selectedMonth)}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                      title="Próximo mês"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Filters */}
              {filteredExpenses.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex bg-gray-100 p-1 rounded-lg w-max">
                    <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFilterType('all')}>Todos</button>
                    <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFilterType('income')}>Receitas</button>
                    <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFilterType('expense')}>Despesas</button>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-lg w-max">
                    <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFilterStatus('all')}>Todos</button>
                    <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'paid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFilterStatus('paid')}>Concluídos</button>
                    <button className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setFilterStatus('pending')}>Pendentes</button>
                  </div>
                </div>
              )}

              
              {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Nenhum lançamento registrado ainda neste mês.
                </div>
              ) : finalExpenses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>Nenhum resultado encontrado para os filtros selecionados.</p>
                  <button onClick={() => { setFilterType('all'); setFilterStatus('all'); }} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">Limpar filtros</button>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {finalExpenses.map((expense) => (
                      <li key={expense.id} className="py-4 flex justify-between items-center">
                        <div className="flex items-center flex-1 min-w-0">
                          <button
                            onClick={() => handleTogglePaid(expense)}
                            className="mr-3 text-gray-400 hover:text-green-500 focus:outline-none transition-colors"
                            title={isExpensePaid(expense, selectedMonth) ? 'Desmarcar' : (expense.type === 'income' ? 'Marcar como recebido' : 'Marcar como pago')}
                          >
                            {isExpensePaid(expense, selectedMonth) ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isExpensePaid(expense, selectedMonth) ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {expense.description}
                              {expense.is_fixed && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 no-underline">Fixa</span>}
                              {expense.due_day && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 no-underline">Vence dia {expense.due_day}</span>}
                              {expense.category_id && categories.find(c => c.id === expense.category_id) && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 no-underline">
                                  {categories.find(c => c.id === expense.category_id)?.name}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {new Date(expense.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`text-sm font-semibold mr-2 ${expense.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                              {expense.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(expense.amount)}
                           </span>
                           <button
                             onClick={() => handleEditExpense(expense)}
                             className="text-blue-500 hover:text-blue-700 p-1"
                             title="Editar"
                           >
                             <Pencil className="h-4 w-4" />
                           </button>
                           <button
                             onClick={() => handleDeleteExpense(expense.id)}
                             className="text-red-500 hover:text-red-700 p-1"
                             title="Excluir"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={handleCancelEdit}>
          <div 
            className="bg-white rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] ring-1 ring-gray-900/5 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId
                    ? (transactionType === 'income' ? 'Editar Receita' : 'Editar Despesa')
                    : (transactionType === 'income' ? 'Nova Receita' : 'Nova Despesa')}
                </h2>
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    required
                    placeholder={transactionType === 'income' ? 'Ex: Ordenado' : 'Ex: Almoço'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria (opcional)</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="">Sem categoria</option>
                    {categories.filter(cat => cat.type === transactionType).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor (€)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount ? (parseInt(amount, 10) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={handleAmountChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    required
                    placeholder="0,00"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center">
                    <input
                      id="isFixed"
                      type="checkbox"
                      checked={isFixed}
                      onChange={(e) => {
                        setIsFixed(e.target.checked);
                        if (e.target.checked) setIsInstallment(false);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isFixed" className="ml-2 block text-sm text-gray-900">
                      Lançamento fixo (contínuo)
                    </label>
                  </div>
                  
                  {!editingId && transactionType === 'expense' && (
                    <div className="flex items-center">
                      <input
                        id="isInstallment"
                        type="checkbox"
                        checked={isInstallment}
                        onChange={(e) => {
                          setIsInstallment(e.target.checked);
                          if (e.target.checked) setIsFixed(false);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isInstallment" className="ml-2 block text-sm text-gray-900">
                        Repetir por meses (Parcelado)
                      </label>
                    </div>
                  )}
                </div>

                {(isFixed || isInstallment) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dia de Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                      required={isFixed || isInstallment}
                      placeholder="Ex: 5"
                    />
                  </div>
                )}
                
                {isInstallment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade de Meses</label>
                    <input
                      type="number"
                      min="2"
                      max="120"
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                      required={isInstallment}
                      placeholder="Ex: 3"
                    />
                  </div>
                )}
                {isEditingFutureFixed && (
                  <div className="flex items-center">
                    <input
                      id="applyToFuture"
                      type="checkbox"
                      checked={applyToFuture}
                      onChange={(e) => setApplyToFuture(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="applyToFuture" className="ml-2 block text-sm text-gray-900">
                      Aplicar para este e os próximos meses
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {editingId ? 'Salvar' : 'Adicionar'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] ring-1 ring-gray-900/5 w-full max-w-md max-h-[90vh] flex flex-col transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Categorias</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" checked={newCategoryType === 'expense'} onChange={() => setNewCategoryType('expense')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                    <span className="ml-2 text-sm text-gray-900">Despesa</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" checked={newCategoryType === 'income'} onChange={() => setNewCategoryType('income')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                    <span className="ml-2 text-sm text-gray-900">Receita</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    required
                  />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
                    Adicionar
                  </button>
                </div>
              </form>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Suas Categorias</h3>
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma categoria criada.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                    {categories.map(cat => (
                      <li key={cat.id} className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cat.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
</main>
    </div>
  );
}

