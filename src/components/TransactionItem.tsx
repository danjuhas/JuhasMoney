import { formatCurrency } from '../utils/format';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTranslation } from 'react-i18next';

import { Pencil, Trash2, CheckCircle, Circle, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Expense, Category } from '../types';

interface TransactionItemProps {
  expense: Expense;
  isPaid: boolean;
  category?: Category;
  onTogglePaid: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isHighlighted?: boolean;
}

export function TransactionItem({
  expense,
  isPaid,
  category,
  onTogglePaid,
  onEdit,
  onDelete,
  isHighlighted = false
}: TransactionItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  const itemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isHighlighted && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  return (
    <li 
      ref={itemRef}
      className={`py-4 flex items-center gap-3 transition-all duration-500 px-2 -mx-2 rounded-xl ${
        isHighlighted 
          ? 'bg-gray-100 shadow-sm scale-[1.01]' 
          : 'hover:bg-gray-50/50'
      }`}
    >
      <button
        onClick={() => onTogglePaid(expense)}
        className="shrink-0 text-gray-300 hover:text-green-500 focus:outline-none transition-colors"
        title={isPaid ? t('item.mark_pending') : t('item.mark_paid')}
      >
        {isPaid ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <Circle className="h-6 w-6" />
        )}
      </button>
      
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Top Line: Title and Amount */}
        <div className="flex justify-between items-start gap-2">
          <p className={`text-base font-medium truncate ${isPaid ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {expense.description}
          </p>
          <span className={`text-base font-semibold shrink-0 ${expense.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
             {expense.type === 'income' ? '+' : '-'} {formatCurrency(expense.amount, preferences.currency)}
          </span>
        </div>

        {/* Bottom Line: Badges and Actions */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700">
                {category.name}
              </span>
            )}
            {expense.is_fixed && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{t('item.fixed')}</span>}
            {expense.due_day && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-red-50 text-red-700 border border-red-100">{t('item.day')} {expense.due_day}</span>}
            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline-block ml-1">
              {new Date(expense.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center shrink-0 ml-2 relative">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsMenuOpen(!isMenuOpen);
               }}
               className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
             >
               <MoreVertical className="h-5 w-5" />
             </button>
             
             {isMenuOpen && (
               <>
                 <div className="fixed inset-0 z-50" onClick={() => setIsMenuOpen(false)}></div>
                 <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                   <button
                     onClick={() => { setIsMenuOpen(false); onEdit(expense); }}
                     className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                   >
                     <Pencil className="h-4 w-4 text-gray-400" />
                     {t('item.edit')}
                   </button>
                   <button
                     onClick={() => { setIsMenuOpen(false); onDelete(expense.id); }}
                     className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                   >
                     <Trash2 className="h-4 w-4 text-red-400" />
                     {t('item.delete')}
                   </button>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>
    </li>
  );
}

