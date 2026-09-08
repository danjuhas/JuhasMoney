
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Expense } from '../types';
import { Plus, ChevronLeft, ChevronRight, Calendar, Filter, Infinity } from 'lucide-react';
import { SummaryCards } from '../components/SummaryCards';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { SettingsOverview } from '../components/SettingsOverview';
import { FilterModal } from '../components/FilterModal';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionItem } from '../components/TransactionItem';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { MobileNav } from '../components/MobileNav';
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { usePreferences } from '../contexts/PreferencesContext';
import { isExpensePaid } from '../utils/transactions';
import { useTranslation } from 'react-i18next';

import { useToast } from '../contexts/ToastContext';

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'settings'>('home');
  
  const { addToast } = useToast();

  const { 
    expenses, 
    categories, 
    loading, 
    upsertExpenses, 
    addCategory,
    updateCategory,
    deleteCategory, 
    deleteExpense, 
    togglePaid 
  } = useTransactions(userId, addToast);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'quick' | 'fixed'>('quick');
  const [initialType, setInitialType] = useState<'income' | 'expense'>('expense');



  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: string, deleteAll: boolean } | null>(null);

  const {
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    isFilterActive,
    clearFilters,
    filteredExpenses,
    finalExpenses,
    totals: { totalReceitas, totalDespesas, saldo, totalPendente }
  } = useTransactionFilters(expenses, selectedMonth);
  

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

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    addToast('Categoria excluída!');
  };

  const handleSaveModal = (expensesToUpsert: Expense[], targetMonthStr?: string) => {
    upsertExpenses(expensesToUpsert);
    if (targetMonthStr) {
      setSelectedMonth(targetMonthStr);
    }
    addToast('Salvo com sucesso!');
    handleCancelEdit();
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingId(expense.id);
    setTransactionMode(expense.is_fixed ? 'fixed' : 'quick');
    setInitialType(expense.type || 'expense');
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openModal = (type: 'income' | 'expense', mode: 'quick' | 'fixed' = 'quick') => {
    setTransactionMode(mode);
    setInitialType(type);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (id: string, deleteAll: boolean = false) => {
    deleteExpense(id, selectedMonth, deleteAll);
    addToast('Lançamento excluído com sucesso!');
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
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">{t('dashboard.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex justify-center sm:justify-between items-center">
          <div className="flex items-center gap-2.5 sm:gap-2">
            <Infinity className="w-10 h-10 sm:w-8 sm:h-8 text-emerald-500" />
            <h1 className="text-2xl sm:text-2xl font-bold tracking-tight text-white">{t('dashboard.app_name')}</h1>
          </div>
          {/* Top right actions */}
          <div className="hidden sm:flex items-center gap-3">
             <div className="bg-slate-800 p-1 rounded-full border border-slate-700/60 flex">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'home' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  {t('nav.home')}
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'insights' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  {t('nav.insights')}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  {t('nav.settings')}
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-40 sm:pb-24 pt-2">
        
        {/* Global Controls (Month & Filters) */}
        {(activeTab === 'home' || activeTab === 'insights') && (
          <div className="flex justify-between items-center mb-6 pt-2">
            {/* Left side: Month Nav + Desktop Current Month Button */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none">
              
              <div className="flex items-center gap-2 flex-1 sm:flex-none justify-between sm:justify-start">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-full text-slate-300 transition-colors shrink-0"
                  title={t('dashboard.prev_month')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="w-auto min-w-[130px] sm:min-w-[150px] text-center font-bold text-white text-lg sm:text-xl whitespace-nowrap tracking-tight capitalize">
                  {formatMonthYear(selectedMonth)}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-full text-slate-300 transition-colors shrink-0"
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
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-emerald-500 hover:bg-slate-800'
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
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-emerald-500 hover:bg-slate-800'
                }`}
                title={t('dashboard.back_to_current')}
              >
                <Calendar className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setIsFilterModalOpen(true)} 
                className="relative p-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
                title="Filtros"
              >
                <Filter className="h-5 w-5" />
                {isFilterActive && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
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
              addCategory={addCategory}
              updateCategory={updateCategory}
              deleteCategory={handleDeleteCategory}
              handleSignOut={handleSignOut}
              userId={userId || ''}
            />
          </div>

          {/* Lista de Gastos */}
          <div className={`md:col-span-2 ${activeTab !== 'home' ? 'hidden' : ''}`}>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 h-full flex flex-col">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-100">{t('dashboard.month_transactions')}</h3>
                {isFilterActive && (
                  <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    Filtrado
                  </span>
                )}
              </div>
              
              
              {loading ? (
                <div className="text-center py-10 text-slate-400">{t('dashboard.loading')}</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  Nenhum lançamento registrado ainda neste mês.
                </div>
              ) : finalExpenses.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p>{t('dashboard.no_filter_results')}</p>
                  <button onClick={() => { clearFilters() }} className="mt-4 text-emerald-500 hover:text-emerald-400 font-medium">{t('dashboard.clear_filters')}</button>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-slate-700/40">
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
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        onSave={handleSaveModal}
        userId={userId}
        selectedMonth={selectedMonth}
        categories={categories}
        preferences={preferences}
        editingExpense={expenses.find(e => e.id === editingId) || null}
        initialMode={transactionMode}
        initialType={initialType}
      />
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
              <div className="flex flex-col gap-3 mb-2 w-full">
                <button 
                  onClick={() => { setIsFabMenuOpen(false); openModal('income'); }} 
                  className="flex items-center justify-between gap-4 w-full bg-slate-800 border border-slate-700 shadow-md pl-4 pr-1.5 py-1.5 rounded-full text-slate-100 hover:bg-slate-700 transition-colors"
                >
                   <span className="font-medium">{t('dashboard.new_income')}</span>
                   <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-full shrink-0"><Plus className="h-5 w-5" /></div>
                </button>
                <button 
                  onClick={() => { setIsFabMenuOpen(false); openModal('expense'); }} 
                  className="flex items-center justify-between gap-4 w-full bg-slate-800 border border-slate-700 shadow-md pl-4 pr-1.5 py-1.5 rounded-full text-slate-100 hover:bg-slate-700 transition-colors"
                >
                   <span className="font-medium">{t('dashboard.new_expense')}</span>
                   <div className="bg-rose-500/20 text-rose-400 p-1.5 rounded-full shrink-0"><Plus className="h-5 w-5" /></div>
                </button>
              </div>
            )}
            <button 
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className={`bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center ${isFabMenuOpen ? 'rotate-45 bg-slate-800 hover:bg-slate-700 shadow-none' : ''}`}
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

