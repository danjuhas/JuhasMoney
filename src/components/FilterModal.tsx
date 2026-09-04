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
    <div className="fixed inset-0 bg-transparent flex flex-col justify-end sm:justify-center items-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] ring-1 ring-gray-900/5 w-full max-w-md transform transition-all animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">{t('filter.filters')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('filter.transaction_type')}</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`} onClick={() => setFilterType('all')}>{t('filter.all')}</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`} onClick={() => setFilterType('income')}>{t('filter.incomes')}</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`} onClick={() => setFilterType('expense')}>{t('filter.expenses')}</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">{t('filter.status')}</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`} onClick={() => setFilterStatus('all')}>{t('filter.all')}</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === 'paid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} onClick={() => setFilterStatus('paid')}>{t('filter.completed')}</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`} onClick={() => setFilterStatus('pending')}>{t('filter.pending')}</button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            {isFilterActive && (
              <button onClick={clearFilters} className="flex-1 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
                {t('filter.clear')}
              </button>
            )}
            <button onClick={onClose} className="flex-[2] py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors">
              {t('filter.show_results')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

