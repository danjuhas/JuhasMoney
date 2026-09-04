import { Settings, LogOut, Tags, Trash2, Calendar, Edit2, Plus } from 'lucide-react';
import type { Category, Expense } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { formatCurrency } from '../utils/format';
import { useTranslation } from 'react-i18next';

type Props = {
  categories: Category[];
  fixedExpenses: Expense[];
  openFixedModal: () => void;
  handleEditFixedExpense: (expense: Expense) => void;
  handleDeleteFixedExpense: (id: string) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  newCategoryType: 'income' | 'expense';
  setNewCategoryType: (type: 'income' | 'expense') => void;
  handleAddCategory: (e: React.FormEvent) => void;
  handleDeleteCategory: (id: string) => void;
  handleSignOut: () => void;
};

export const SettingsOverview = ({
  categories,
  fixedExpenses,
  openFixedModal,
  handleEditFixedExpense,
  handleDeleteFixedExpense,
  newCategoryName,
  setNewCategoryName,
  newCategoryType,
  setNewCategoryType,
  handleAddCategory,
  handleDeleteCategory,
  handleSignOut
}: Props) => {
  const { preferences, updatePreferences } = usePreferences();
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-800">{t('settings.title')}</h2>
      </div>

      <div className="space-y-10">
        
        {/* Preferências Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h3 className="font-medium text-gray-800">{t('settings.preferences')}</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.language')}</label>
              <select 
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.currency')}</label>
              <select 
                value={preferences.currency}
                onChange={(e) => updatePreferences({ currency: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm p-3 border outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Categorias Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Tags className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium text-gray-800">{t('settings.manage_categories')}</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input type="radio" checked={newCategoryType === 'expense'} onChange={() => setNewCategoryType('expense')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="ml-2 text-sm text-gray-900">{t('settings.expense')}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" checked={newCategoryType === 'income'} onChange={() => setNewCategoryType('income')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="ml-2 text-sm text-gray-900">{t('settings.income')}</span>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('settings.category_name')}
                  className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3 border outline-none"
                  required
                />
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                  {t('settings.add')}
                </button>
              </div>
            </form>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('settings.your_categories')}</h4>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic">{t('settings.no_categories')}</p>
              ) : (
                <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  {categories.map(cat => (
                    <li key={cat.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)} 
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Fixed Expenses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h3 className="font-medium text-gray-800">{t('settings.fixed_transactions')}</h3>
            </div>
            <button 
              onClick={openFixedModal}
              className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.new_fixed')}</span>
              <span className="sm:hidden">{t('settings.new_short')}</span>
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            {fixedExpenses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">{t('settings.no_fixed')}</p>
            ) : (
              <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                {fixedExpenses.map(expense => (
                  <li key={expense.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{expense.description}</span>
                      <span className="text-xs text-gray-500">
                        {expense.type === 'income' ? 'Receita' : 'Despesa'} • Todo dia {expense.due_day || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${expense.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {formatCurrency(expense.amount, preferences.currency)}
                      </span>
                      <button 
                        onClick={() => handleEditFixedExpense(expense)} 
                        className="text-gray-400 hover:text-indigo-500 p-1 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteFixedExpense(expense.id)} 
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
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

        <hr className="border-gray-100" />

        {/* Conta Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-800">{t('settings.account')}</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-6">
            
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
              <h4 className="text-sm font-medium text-gray-800">{t('settings.change_password')}</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  name="new_password"
                  placeholder={t('settings.new_password_placeholder')}
                  className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3 border outline-none"
                  required
                  minLength={6}
                />
                <button type="submit" className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors">
                  {t('settings.update')}
                </button>
              </div>
            </form>

            <hr className="border-gray-200" />

            <button
              onClick={handleSignOut}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              {t('settings.sign_out')}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

