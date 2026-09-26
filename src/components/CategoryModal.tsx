import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { SegmentedControl } from './ui/SegmentedControl';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateUUID } from '../utils/uuid';
import type { Category } from '../types';
import { EXPENSE_ICONS, INCOME_ICONS, AVAILABLE_COLORS } from '../constants/categories';

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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto" zIndex="z-[60]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SegmentedControl
            value={type}
            onChange={(val) => {
              setType(val);
              if (val === 'expense' && !(icon in EXPENSE_ICONS)) setIcon('Tag');
              if (val === 'income' && !(icon in INCOME_ICONS)) setIcon('DollarSign');
            }}
            options={[
              { value: 'expense', label: t('settings.expense'), activeColor: 'slate' },
              { value: 'income', label: t('settings.income'), activeColor: 'slate' }
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">{t('settings.category_name')}</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Supermercado" focusColor={type === 'income' ? 'emerald' : 'rose'} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('categories.icon')}</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {Object.entries(type === 'income' ? INCOME_ICONS : EXPENSE_ICONS).map(([key, Icon]) => (
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
            <label className="block text-sm font-medium text-slate-400 mb-2">{t('categories.color')}</label>
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

          <Button type="submit" variant="primary" fullWidth className="mt-4">{editingCategory ? 'Salvar Alterações' : t('settings.add')}</Button>
        </form>
          </Modal>
  );
}

