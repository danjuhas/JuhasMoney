import { Settings, LogOut, Tags, Trash2, Calendar, Edit2, Plus } from 'lucide-react';
import type { Category, Expense } from '../types';

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
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-800">Ajustes</h2>
      </div>

      <div className="space-y-10">
        
        {/* Categorias Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Tags className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium text-gray-800">Gerenciar Categorias</h3>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input type="radio" checked={newCategoryType === 'expense'} onChange={() => setNewCategoryType('expense')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="ml-2 text-sm text-gray-900">Despesa</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input type="radio" checked={newCategoryType === 'income'} onChange={() => setNewCategoryType('income')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="ml-2 text-sm text-gray-900">Receita</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da categoria"
                  className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3 border outline-none"
                  required
                />
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                  Adicionar
                </button>
              </div>
            </form>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Suas Categorias</h4>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhuma categoria criada.</p>
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
              <h3 className="font-medium text-gray-800">Receitas e Despesas Fixas</h3>
            </div>
            <button 
              onClick={openFixedModal}
              className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Fixo</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            {fixedExpenses.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhuma assinatura ou conta fixa cadastrada.</p>
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
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
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
            <LogOut className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-gray-800">Conta</h3>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
          >
            Sair da Conta
          </button>
        </section>

      </div>
    </div>
  );
};

