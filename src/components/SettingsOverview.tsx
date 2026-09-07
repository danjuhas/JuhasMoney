import { useState } from 'react';
import { Settings, LogOut, Tags, Trash2, Calendar, Edit2, Plus } from 'lucide-react';
import type { Category, Expense } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { formatCurrency } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { CategoryModal } from './CategoryModal';
import { getCategoryStyle } from '../constants/categories';

type Props = {
  categories: Category[];
  fixedExpenses: Expense[];
  openFixedModal: () => void;
  handleEditFixedExpense: (expense: Expense) => void;
  handleDeleteFixedExpense: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  handleSignOut: () => void;
  userId: string;
};

export const SettingsOverview = ({
  categories,
  fixedExpenses,
  openFixedModal,
  handleEditFixedExpense,
  handleDeleteFixedExpense,
  addCategory,
  updateCategory,
  deleteCategory,
  handleSignOut,
  userId
}: Props) => {
  const { preferences, updatePreferences } = usePreferences();
  const { t } = useTranslation();
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleOpenCategoryModal = (cat?: Category) => {
    setEditingCategory(cat || null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (cat: Category) => {
    if (editingCategory) {
      updateCategory(cat.id, { name: cat.name, type: cat.type, icon: cat.icon, color: cat.color });
    } else {
      addCategory(cat);
    }
  };

  return (
    <>
      <div className="bg-slate-800/60 rounded-2xl p-6 shadow-sm border border-slate-700/50 mt-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-100">{t('settings.title')}</h2>
      </div>

      <div className="space-y-10">
        
        {/* Preferências Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-medium text-slate-100">{t('settings.preferences')}</h3>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('settings.language')}</label>
              <select 
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value })}
                className="w-full bg-slate-900 border-slate-700 text-slate-100 rounded-md shadow-sm p-3 border outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-400 mb-1">{t('settings.currency')}</label>
              <select 
                value={preferences.currency}
                onChange={(e) => updatePreferences({ currency: e.target.value })}
                className="w-full bg-slate-900 border-slate-700 text-slate-100 rounded-md shadow-sm p-3 border outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </section>

        <hr className="border-slate-700/50" />

        {/* Categorias Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tags className="w-5 h-5 text-emerald-500" />
              <h3 className="font-medium text-slate-100">{t('settings.manage_categories')}</h3>
            </div>
            <button 
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-1 text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.add')}</span>
            </button>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500 italic">{t('settings.no_categories')}</p>
              ) : (
                <ul className="divide-y divide-slate-700/50 bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
                  {categories.map(cat => {
                    const { Icon: IconComponent, bgColor } = getCategoryStyle(cat);

                    return (
                      <li key={cat.id} className="flex justify-between items-center p-4 hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-200 block">{cat.name}</span>
                            <span className="text-xs text-slate-400">{cat.type === 'income' ? t('settings.income') : t('settings.expense')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenCategoryModal(cat)} 
                            className="text-slate-500 hover:text-blue-400 p-1.5 transition-colors"
                            title="Editar categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteCategory(cat.id)} 
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                            title="Excluir categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        <hr className="border-slate-700/50" />

        {/* Fixed Expenses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="font-medium text-slate-100">{t('settings.fixed_transactions')}</h3>
            </div>
            <button 
              onClick={openFixedModal}
              className="flex items-center gap-1 text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.new_fixed')}</span>
              <span className="sm:hidden">{t('settings.new_short')}</span>
            </button>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            {fixedExpenses.length === 0 ? (
              <p className="text-sm text-slate-500 italic">{t('settings.no_fixed')}</p>
            ) : (
              <ul className="divide-y divide-slate-700/50 bg-slate-800/80 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
                {fixedExpenses.map(expense => (
                  <li key={expense.id} className="flex justify-between items-center p-4 hover:bg-slate-700/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-100">{expense.description}</span>
                      <span className="text-xs text-slate-500">
                        {expense.type === 'income' ? 'Receita' : 'Despesa'} • Todo dia {expense.due_day || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${expense.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(expense.amount, preferences.currency)}
                      </span>
                      <button 
                        onClick={() => handleEditFixedExpense(expense)} 
                        className="text-slate-500 hover:text-emerald-400 p-1 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteFixedExpense(expense.id)} 
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <hr className="border-slate-700/50" />

        {/* Conta Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="w-5 h-5 text-slate-400" />
            <h3 className="font-medium text-slate-100">{t('settings.account')}</h3>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-6">
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const newPassword = (e.currentTarget.elements.namedItem('new_password') as HTMLInputElement).value;
              if (newPassword.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
              }
              const { supabase } = await import('../lib/supabase');
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) {
                alert('Erro ao alterar senha: ' + error.message);
              } else {
                alert('Senha alterada com sucesso!');
                (e.target as HTMLFormElement).reset();
              }
            }} className="space-y-4">
              <h4 className="text-sm font-medium text-slate-200">{t('settings.change_password')}</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  name="new_password"
                  placeholder={t('settings.new_password_placeholder')}
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-3 border outline-none"
                  required
                  minLength={6}
                />
                <button type="submit" className="bg-emerald-500 text-white px-5 py-2 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 text-sm font-medium transition-colors">
                  {t('settings.update')}
                </button>
              </div>
            </form>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('settings.logout')}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
    
    <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        userId={userId}
      />
    </>
  );
};
