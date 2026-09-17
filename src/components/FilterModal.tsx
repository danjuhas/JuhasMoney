import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Category } from '../types';
import type { SortOption } from '../hooks/useTransactionFilters';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: 'all' | 'income' | 'expense';
  setFilterType: (val: 'all' | 'income' | 'expense') => void;
  filterStatus: 'all' | 'paid' | 'pending';
  setFilterStatus: (val: 'all' | 'paid' | 'pending') => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  categories: Category[];
  clearFilters: () => void;
}

export function FilterModal({ 
  isOpen, onClose, 
  filterType, setFilterType, 
  filterStatus, setFilterStatus,
  filterCategory, setFilterCategory,
  sortBy, setSortBy,
  categories, clearFilters
}: FilterModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const isFilterActive = filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || sortBy !== 'default';

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex flex-col justify-end sm:justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md transform transition-all animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-100">{t('filter.filters')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">{t('filter.transaction_type')}</h3>
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all' ? 'bg-slate-700 shadow text-slate-100' : 'text-slate-500 hover:text-slate-400'}`} onClick={() => setFilterType('all')}>{t('filter.all')}</button>
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'income' ? 'bg-slate-700 shadow text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`} onClick={() => setFilterType('income')}>{t('filter.incomes')}</button>
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-slate-700 shadow text-rose-400' : 'text-slate-500 hover:text-slate-400'}`} onClick={() => setFilterType('expense')}>{t('filter.expenses')}</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">{t('filter.status')}</h3>
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-slate-700 shadow text-slate-100' : 'text-slate-500 hover:text-slate-400'}`} onClick={() => setFilterStatus('all')}>{t('filter.all')}</button>
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'paid' ? 'bg-slate-700 shadow text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`} onClick={() => setFilterStatus('paid')}>{t('filter.completed')}</button>
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-slate-700 shadow text-rose-400' : 'text-slate-500 hover:text-slate-400'}`} onClick={() => setFilterStatus('pending')}>{t('filter.pending')}</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">{t('dashboard.filter_category')}</h3>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-800 border-slate-700 text-slate-100 rounded-xl shadow-sm p-3 border outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">{t('dashboard.all_categories')}</option>
              {categories
                .filter(c => filterType === 'all' || c.type === filterType)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">{t('dashboard.sort_by')}</h3>
            <div className="flex flex-col gap-2">
              {[
                { id: 'default', label: 'dashboard.sort_default' },
                { id: 'date_desc', label: 'dashboard.sort_date_desc' },
                { id: 'date_asc', label: 'dashboard.sort_date_asc' },
                { id: 'name_asc', label: 'dashboard.sort_name_asc' },
                { id: 'amount_desc', label: 'dashboard.sort_amount_desc' },
                { id: 'amount_asc', label: 'dashboard.sort_amount_asc' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    sortBy === opt.id 
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-transparent text-slate-400 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
          </div>

        </div>
        
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 mt-auto shrink-0 flex gap-3 rounded-b-2xl">
          {isFilterActive && (
            <button onClick={clearFilters} className="flex-1 py-3 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl font-medium transition-colors">
              {t('filter.clear')}
            </button>
          )}
          <button onClick={onClose} className="flex-[2] py-3 text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-colors">
            {t('filter.show_results')}
          </button>
        </div>
      </div>
    </div>
  );
}
