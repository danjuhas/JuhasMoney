import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateUUID } from '../utils/uuid';
import type { Category } from '../types';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants/categories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  editingCategory?: Category | null;
  userId: string;
}

export function CategoryModal({ isOpen, onClose, onSave, editingCategory, userId }: CategoryModalProps) {
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('bg-slate-500');

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setName(editingCategory.name);
        setType(editingCategory.type);
        setIcon(editingCategory.icon || 'Tag');
        setColor(editingCategory.color || (editingCategory.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'));
      } else {
        setName('');
        setType('expense');
        setIcon('Tag');
        setColor('bg-slate-500');
      }
    }
  }, [isOpen, editingCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingCategory?.id || generateUUID(),
      user_id: userId,
      name: name.trim(),
      type,
      icon,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/50 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === 'expense' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('settings.expense')}
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === 'income' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('settings.income')}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('settings.category_name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              required
              placeholder="Ex: Supermercado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Ícone</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    icon === key ? 'bg-slate-700 ring-2 ring-emerald-500 text-emerald-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {['bg-slate-500', ...AVAILABLE_COLORS].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} border-2 transition-all ${
                    color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/25 mt-4"
          >
            {editingCategory ? 'Salvar Alterações' : t('settings.add')}
          </button>
        </form>
      </div>
    </div>
  );
}

