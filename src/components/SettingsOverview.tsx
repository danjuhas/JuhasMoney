import { useState, useEffect } from 'react';
import { Settings, LogOut, Tags, Trash2, Calendar, Edit2, Plus, User } from 'lucide-react';
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
  
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(preferences.name || '');

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email);
      });
    });
  }, []);

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
        
        {/* Minha Conta Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="font-medium text-slate-100">Minha Conta</h3>
          </div>
          
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <span className="text-xl font-bold text-emerald-400">
                  {preferences.name ? preferences.name.substring(0, 2).toUpperCase() : userEmail ? userEmail.substring(0, 2).toUpperCase() : 'US'}
                </span>
              </div>
              
              {/* User Info */}
              <div className="flex-1 overflow-hidden">
                {isEditingName ? (
                  <form className="flex gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    updatePreferences({ name: editNameValue });
                    setIsEditingName(false);
                  }}>
                    <input 
                      type="text" 
                      value={editNameValue} 
                      onChange={(e) => setEditNameValue(e.target.value)} 
                      className="bg-slate-900 border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-sm border focus:ring-1 focus:ring-emerald-500 outline-none w-full max-w-[220px]"
                      autoFocus
                    />
                    <button type="submit" className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 font-medium transition-colors">Salvar</button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="text-xs text-slate-400 hover:text-white px-2 transition-colors">Cancelar</button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white truncate">{preferences.name || 'Usuário'}</h3>
                    <button onClick={() => { setEditNameValue(preferences.name || ''); setIsEditingName(true); }} className="text-slate-500 hover:text-emerald-400 p-1 transition-colors" title="Editar nome">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-slate-400 truncate mt-0.5">{userEmail}</p>
              </div>
            </div>

            <hr className="border-slate-700/50" />

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
            }} className="space-y-3">
              <h4 className="text-sm font-medium text-slate-200">{t('settings.change_password')}</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  name="new_password"
                  placeholder={t('settings.new_password_placeholder')}
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg shadow-sm focus:ring-1 focus:ring-emerald-500 sm:text-sm px-4 py-2.5 border outline-none transition-all"
                  required
                  minLength={6}
                />
                <button type="submit" className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 text-sm font-medium transition-all">
                  {t('settings.update')}
                </button>
              </div>
            </form>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('settings.sign_out')}
              </button>
            </div>
          </div>
        </section>
        
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
              <span className="sm:hidden">{t('settings.new_short')}</span>
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
                            <span translate="no" className="text-sm font-medium text-slate-200 block">{cat.name}</span>
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
                      <span translate="no" className="text-sm font-medium text-slate-100">{expense.description}</span>
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
