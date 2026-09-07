import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: 'all' | 'income' | 'expense';
  setFilterType: (val: 'all' | 'income' | 'expense') => void;
  filterStatus: 'all' | 'paid' | 'pending';
  setFilterStatus: (val: 'all' | 'paid' | 'pending') => void;
}

export function FilterModal({ isOpen, onClose, filterType, setFilterType, filterStatus, setFilterStatus }: FilterModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const isFilterActive = filterType !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex flex-col justify-end sm:justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md transform transition-all animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-100">{t('filter.filters')}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
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

          <div className="pt-4 flex gap-3">
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
    </div>
  );
}

