import { X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: 'all' | 'income' | 'expense';
  setFilterType: (val: 'all' | 'income' | 'expense') => void;
  filterStatus: 'all' | 'paid' | 'pending';
  setFilterStatus: (val: 'all' | 'paid' | 'pending') => void;
}

export function FilterModal({ isOpen, onClose, filterType, setFilterType, filterStatus, setFilterStatus }: FilterModalProps) {
  if (!isOpen) return null;

  const isFilterActive = filterType !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
  };

  return (
    <div className="fixed inset-0 bg-transparent flex flex-col justify-end sm:justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] ring-1 ring-gray-900/5 w-full max-w-md transform transition-all animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo de Lançamento</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`} onClick={() => setFilterType('all')}>Todos</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'income' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`} onClick={() => setFilterType('income')}>Receitas</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`} onClick={() => setFilterType('expense')}>Despesas</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`} onClick={() => setFilterStatus('all')}>Todos</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === 'paid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} onClick={() => setFilterStatus('paid')}>Concluídos</button>
              <button className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === 'pending' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`} onClick={() => setFilterStatus('pending')}>Pendentes</button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            {isFilterActive && (
              <button onClick={clearFilters} className="flex-1 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors">
                Limpar
              </button>
            )}
            <button onClick={onClose} className="flex-[2] py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors">
              Mostrar Resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

