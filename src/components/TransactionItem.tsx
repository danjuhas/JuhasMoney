import { formatCurrency } from '../utils/format';
import { usePreferences } from '../contexts/PreferencesContext';
import { useTranslation } from 'react-i18next';
import { getCategoryStyle } from '../constants/categories';

import { Pencil, Trash2, CheckCircle, Circle, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { Expense, Category } from '../types';

interface TransactionItemProps {
  expense: Expense;
  isPaid: boolean;
  category?: Category;
  onTogglePaid: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function TransactionItem({
  expense,
  isPaid,
  category,
  onTogglePaid,
  onEdit,
  onDelete
}: TransactionItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { preferences } = usePreferences();
  const { t } = useTranslation();

  return (
    <li className="py-3.5 flex items-center gap-3 transition-colors group">
      <button
        onClick={() => onTogglePaid(expense)}
        className="shrink-0 focus:outline-none transition-colors mt-0.5 self-start"
        title={isPaid ? t('item.mark_pending') : t('item.mark_paid')}
      >
        {isPaid ? (
          <CheckCircle className="h-[22px] w-[22px] text-emerald-400 fill-emerald-900/50" strokeWidth={2} />
        ) : (
          <Circle className="h-[22px] w-[22px] text-slate-600 group-hover:text-slate-500 transition-colors" strokeWidth={1.5} />
        )}
      </button>
      
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Top Line: Title and Amount */}
        <div className="flex justify-between items-start gap-2">
          <p className={`text-base tracking-tight truncate ${isPaid ? 'text-slate-500 line-through font-normal' : 'text-slate-100 font-medium'}`}>
            {expense.description}
          </p>
          <span className={`text-base font-semibold tracking-tight shrink-0 ${expense.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
             {expense.type === 'income' ? '' : ''}{formatCurrency(expense.amount, preferences.currency)}
          </span>
        </div>

        {/* Bottom Line: Badges and Actions */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {category && (() => {
              const { Icon: IconComponent, bgColor, textColor } = getCategoryStyle(category);
              
              return (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal ${bgColor} ${textColor}`}>
                  {IconComponent && <IconComponent className="w-3 h-3" />}
                  {category.name}
                </span>
              );
            })()}

            {expense.due_day && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-slate-700/80 text-slate-300">{t('item.day')} {expense.due_day}</span>}

          </div>

          <div className="flex items-center shrink-0 ml-2 relative">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsMenuOpen(!isMenuOpen);
               }}
               className="p-1 text-slate-400 hover:text-slate-300 transition-colors rounded-full hover:bg-slate-700"
             >
               <MoreVertical className="h-5 w-5" />
             </button>
             
             {isMenuOpen && (
               <>
                 <div className="fixed inset-0 z-50" onClick={() => setIsMenuOpen(false)}></div>
                 <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                   <button
                     onClick={() => { setIsMenuOpen(false); onEdit(expense); }}
                     className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                   >
                     <Pencil className="h-4 w-4 text-slate-400" />
                     {t('item.edit')}
                   </button>
                   <button
                     onClick={() => { setIsMenuOpen(false); onDelete(expense.id); }}
                     className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                   >
                     <Trash2 className="h-4 w-4 text-rose-400" />
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

