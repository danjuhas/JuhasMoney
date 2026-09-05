import { generateUUID } from '../utils/uuid';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Expense } from '../types';
import { Plus, ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react';
import { SummaryCards } from '../components/SummaryCards';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { SettingsOverview } from '../components/SettingsOverview';
import { FilterModal } from '../components/FilterModal';
import { TransactionItem } from '../components/TransactionItem';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { MobileNav } from '../components/MobileNav';
import { useTransactions } from '../hooks/useTransactions';
import { usePreferences } from '../contexts/PreferencesContext';
import { isActiveInMonth, isExpensePaid } from '../utils/transactions';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'settings'>('home');
  
  const { 
    expenses, 
    categories, 
    loading, 
    upsertExpenses, 
    addCategory, 
    deleteCategory, 
    deleteExpense, 
    togglePaid 
  } = useTransactions(userId);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'quick' | 'fixed'>('quick');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: string, deleteAll: boolean } | null>(null);
  
  const isFilterActive = filterType !== 'all' || filterStatus !== 'all';

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { preferences, loading: prefsLoading } = usePreferences();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!prefsLoading && userId && !preferences.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [prefsLoading, preferences.onboarding_completed, userId, navigate]);


  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      setUserId(session.user.id);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newCategoryName.trim()) return;

    addCategory({
      id: generateUUID(),
      user_id: userId,
      name: newCategoryName.trim(),
      type: newCategoryType,
    });
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    if (categoryId === id) setCategoryId('');
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amount || '0', 10) / 100;
    if (!userId || !description || numericAmount <= 0) return;

    let expensesToUpsert: Expense[] = [];
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
            id: generateUUID(),
            user_id: userId,
            description,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: true,
            due_day: parsedDueDay,
          };
          expensesToUpsert.push(updatedOriginal, newFixedExpense);
        } else {
          // We are editing a fixed expense from a different (future) month. Create a one-off override.
          const updatedOriginal = {
            ...originalExpense,
            excluded_months: [...(originalExpense.excluded_months || []), selectedMonth]
          };
          const overrideExpense: Expense = {
            id: generateUUID(),
            user_id: userId,
            description,
            amount: numericAmount,
            type: transactionType,
            category_id: categoryId || undefined,
            created_at: `${selectedMonth}-01T12:00:00.000Z`,
            is_fixed: false, // Override applies only to this month
            due_day: parsedDueDay,
          };
          expensesToUpsert.push(updatedOriginal, overrideExpense);
        }
      } else {
        // Normal edit of the base expense
        if (originalExpense) {
          expensesToUpsert.push({
            ...originalExpense, description, amount: numericAmount, type: transactionType,
            category_id: categoryId || undefined, is_fixed: isFixed, due_day: isFixed ? parsedDueDay : undefined
          });
        }
      }
    } else {
      if (isInstallment) {
        const count = parseInt(installmentsCount, 10) || 1;
        for (let i = 0; i < count; i++) {
          const [yearStr, monthStr] = selectedMonth.split('-');
          const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + i, 1);
          const targetMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          expensesToUpsert.push({
            id: generateUUID(),
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
      } else {
        expensesToUpsert.push({
          id: generateUUID(),
          user_id: userId,
          description,
          amount: numericAmount,
          type: transactionType,
          category_id: categoryId || undefined,
          created_at: `${selectedMonth}-01T12:00:00.000Z`,
          is_fixed: isFixed,
          due_day: isFixed ? parsedDueDay : undefined,
          is_paid: !isFixed,
        });
      }
    }
    
    upsertExpenses(expensesToUpsert);

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
    setTransactionMode(expense.is_fixed ? 'fixed' : 'quick');
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

  const openModal = (type: 'income' | 'expense', mode: 'quick' | 'fixed' = 'quick') => {
    handleCancelEdit();
    setTransactionType(type);
    setTransactionMode(mode);
    setIsFixed(mode === 'fixed');
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (id: string, deleteAll: boolean = false) => {
    deleteExpense(id, selectedMonth, deleteAll);
  };

  const handleTogglePaid = (expense: Expense) => {
    togglePaid(expense, selectedMonth);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => isActiveInMonth(exp, selectedMonth));
  }, [expenses, selectedMonth]);

  const { totalReceitas, totalDespesas, saldo, totalPendente } = React.useMemo(() => {
    const totalReceitas = filteredExpenses.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
    const totalDespesas = filteredExpenses.reduce((acc, curr) => curr.type !== 'income' ? acc + curr.amount : acc, 0);
    const saldo = totalReceitas - totalDespesas;
    const totalPendente = filteredExpenses.reduce((acc, curr) => {
      if (curr.type === 'income') return acc;
      return isExpensePaid(curr, selectedMonth) ? acc : acc + curr.amount;
    }, 0);
    return { totalReceitas, totalDespesas, saldo, totalPendente };
  }, [filteredExpenses, selectedMonth]);

  const sortedExpenses = React.useMemo(() => {
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
  }, [filteredExpenses, selectedMonth]);

  const finalExpenses = React.useMemo(() => {
    return sortedExpenses.filter(expense => {
      if (filterType !== 'all' && (expense.type || 'expense') !== filterType) return false;
      const isPaid = isExpensePaid(expense, selectedMonth);
      if (filterStatus === 'paid' && !isPaid) return false;
      if (filterStatus === 'pending' && isPaid) return false;
      return true;
    });
  }, [sortedExpenses, filterType, filterStatus, selectedMonth]);

  const editingExpense = expenses.find(e => e.id === editingId);
  const isEditingFutureFixed = editingExpense && editingExpense.is_fixed && !editingExpense.created_at.startsWith(selectedMonth);

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const monthName = date.toLocaleDateString(t('dashboard.locale') || 'pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}`;
  };
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === currentMonthStr;

  if (prefsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('dashboard.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">{t('dashboard.app_name')}</h1>
              <div className="hidden sm:flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {t('nav.home')}
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`text-sm font-medium transition-colors ${activeTab === 'insights' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {t('nav.insights')}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {t('nav.settings')}
                </button>
              </div>
            </div>
            {/* The right action buttons were removed as they are now in the Settings view */}
            <div className="flex items-center gap-4">
              
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 sm:py-8">
        
        {/* Global Controls (Month & Filters) */}
        {(activeTab === 'home' || activeTab === 'insights') && (
          <div className="flex justify-between items-center mb-6 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Left side: Month Nav + Desktop Current Month Button */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none">
              
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200 shadow-sm flex-1 sm:flex-none justify-between sm:justify-start">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm"
                  title={t('dashboard.prev_month')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="w-28 sm:w-36 text-center font-bold text-gray-800 text-sm sm:text-base whitespace-nowrap">
                  {formatMonthYear(selectedMonth)}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors shadow-sm"
                  title={t('dashboard.next_month')}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={handleCurrentMonth}
                disabled={isCurrentMonth}
                className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                  isCurrentMonth
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
                title={t('dashboard.back_to_current')}
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>

            {/* Right side: Mobile Current Month Button + Filter */}
            <div className="flex items-center gap-2 ml-3 sm:ml-4">
              <button
                onClick={handleCurrentMonth}
                disabled={isCurrentMonth}
                className={`sm:hidden flex p-2 rounded-lg transition-colors ${
                  isCurrentMonth
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
                title={t('dashboard.back_to_current')}
              >
                <Calendar className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setIsFilterModalOpen(true)} 
                className="relative p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
                title="Filtros"
              >
                <Filter className="h-5 w-5" />
                {isFilterActive && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-blue-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
          {/* Adicionar Gasto Form */}
          <div className={`md:col-span-1 ${activeTab !== 'home' ? 'hidden' : ''}`}>
            {/* Removed top buttons, using FAB */}
            <SummaryCards totalReceitas={totalReceitas} totalDespesas={totalDespesas} saldo={saldo} totalPendente={totalPendente} />
          </div>
          
          {/* Analytics (Insights Tab) */}
          <div className={`md:col-span-3 ${activeTab !== 'insights' ? 'hidden' : ''}`}>
            <AnalyticsOverview 
              expenses={filteredExpenses} allExpenses={expenses} selectedMonth={selectedMonth} 
              categories={categories} 
              totalReceitas={totalReceitas} 
              totalDespesas={totalDespesas} 
            />
          </div>

          {/* Settings (Ajustes Tab) */}
          <div className={`md:col-span-3 ${activeTab !== 'settings' ? 'hidden' : ''}`}>
            <SettingsOverview 
              categories={categories}
              fixedExpenses={expenses.filter(e => e.is_fixed)}
              openFixedModal={() => openModal('expense', 'fixed')}
              handleEditFixedExpense={handleEditExpense}
              handleDeleteFixedExpense={(id) => setDeleteConfirmId({ id, deleteAll: true })}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              newCategoryType={newCategoryType}
              setNewCategoryType={setNewCategoryType}
              handleAddCategory={handleAddCategory}
              handleDeleteCategory={handleDeleteCategory}
              handleSignOut={handleSignOut}
            />
          </div>

          {/* Lista de Gastos */}
          <div className={`md:col-span-2 ${activeTab !== 'home' ? 'hidden' : ''}`}>
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 h-full flex flex-col">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{t('dashboard.month_transactions')}</h3>
                {isFilterActive && (
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Filtrado
                  </span>
                )}
              </div>
              
              
              {loading ? (
                <div className="text-center py-10 text-gray-500">{t('dashboard.loading')}</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Nenhum lançamento registrado ainda neste mês.
                </div>
              ) : finalExpenses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>{t('dashboard.no_filter_results')}</p>
                  <button onClick={() => { setFilterType('all'); setFilterStatus('all'); }} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">{t('dashboard.clear_filters')}</button>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {finalExpenses.map((expense) => (
                      <TransactionItem
                        key={expense.id}
                        expense={expense}
                        isPaid={isExpensePaid(expense, selectedMonth)}
                        category={categories.find(c => c.id === expense.category_id)}
                        onTogglePaid={handleTogglePaid}
                        onEdit={handleEditExpense}
                        onDelete={(id) => setDeleteConfirmId({ id, deleteAll: false })}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={handleCancelEdit}>
          <div 
            className="bg-white rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] ring-1 ring-gray-900/5 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId
                    ? (transactionType === 'income' ? t('dashboard.edit_income') : t('dashboard.edit_expense'))
                    : (transactionType === 'income' ? t('dashboard.new_income') : t('dashboard.new_expense'))}
                </h2>
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                
                {!editingId && transactionMode === 'fixed' && (
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionType('expense');
                        setCategoryId('');
                      }}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        transactionType === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t('dashboard.expenses')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionType('income');
                        setCategoryId('');
                      }}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        transactionType === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t('dashboard.incomes')}
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('dashboard.description')}</label>
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
                  <label className="block text-sm font-medium text-gray-700">{t('dashboard.category_optional')}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="">{t('dashboard.no_category')}</option>
                    {categories.filter(cat => cat.type === transactionType).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('dashboard.value')}</label>
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
                  {/* In quick mode, we only optionally show installment for expenses */}
                  {transactionMode === 'quick' && !editingId && transactionType === 'expense' && (
                    <div className="flex items-center mt-2">
                      <input
                        id="isInstallment"
                        type="checkbox"
                        checked={isInstallment}
                        onChange={(e) => {
                          setIsInstallment(e.target.checked);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isInstallment" className="ml-2 block text-sm text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
                        {t('dashboard.repeat_purchase')}
                      </label>
                    </div>
                  )}
                </div>

                {(isFixed || isInstallment) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('dashboard.due_day')}</label>
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
                    <label className="block text-sm font-medium text-gray-700">{t('dashboard.months_quantity')}</label>
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
                      {t('dashboard.apply_future')}
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {editingId ? t('dashboard.save') : t('dashboard.add')}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {t('dashboard.cancel')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteExpense(deleteConfirmId.id, deleteConfirmId.deleteAll);
            setDeleteConfirmId(null);
          }
        }}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
      {/* Floating Action Button (FAB) */}
      {activeTab === 'home' && (
        <>
          <div className="fixed bottom-24 sm:bottom-6 right-6 flex flex-col items-end gap-3 z-40">
            {isFabMenuOpen && (
              <div className="flex flex-col gap-3 mb-2">
                <button 
                  onClick={() => { setIsFabMenuOpen(false); openModal('income'); }} 
                  className="flex items-center gap-3 bg-white shadow-lg pl-4 pr-2 py-2 rounded-full text-green-600 hover:bg-green-50 font-medium transition-colors"
                >
                   <span>{t('dashboard.new_income')}</span>
                   <div className="bg-green-100 p-2 rounded-full"><Plus className="h-5 w-5" /></div>
                </button>
                <button 
                  onClick={() => { setIsFabMenuOpen(false); openModal('expense'); }} 
                  className="flex items-center gap-3 bg-white shadow-lg pl-4 pr-2 py-2 rounded-full text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                   <span>{t('dashboard.new_expense')}</span>
                   <div className="bg-red-100 p-2 rounded-full"><Plus className="h-5 w-5" /></div>
                </button>
              </div>
            )}
            <button 
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className={`bg-blue-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-blue-700 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center ${isFabMenuOpen ? 'rotate-45 bg-gray-800 hover:bg-gray-900' : ''}`}
            >
              <Plus className="h-6 w-6 transition-transform" />
            </button>
          </div>
          {/* Overlay to close FAB when clicking outside */}
          {isFabMenuOpen && (
            <div 
              className="fixed inset-0 z-30"
              onClick={() => setIsFabMenuOpen(false)}
            />
          )}
        </>
      )}
</main>
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

