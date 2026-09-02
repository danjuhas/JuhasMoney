import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { LogOut, Plus, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    } else {
      setUserId(session.user.id);
      fetchExpenses(session.user.id);
    }
  };

  const fetchExpenses = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error.message);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !description || !amount) return;

    const newExpense = {
      user_id: userId,
      description,
      amount: parseFloat(amount),
    };

    const { error } = await supabase.from('expenses').insert([newExpense]);

    if (error) {
      console.error('Error adding expense:', error.message);
      alert('Erro ao adicionar gasto');
    } else {
      setDescription('');
      setAmount('');
      fetchExpenses(userId);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Error deleting expense:', error.message);
    } else {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">JuhasMoney</h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Adicionar Gasto Form */}
          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Novo Gasto</h2>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    required
                    placeholder="Ex: Almoço"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    required
                    placeholder="Ex: 25.50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </button>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mt-6">
               <h2 className="text-lg font-medium text-gray-900 mb-2">Total de Gastos</h2>
               <p className="text-3xl font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
               </p>
            </div>
          </div>

          {/* Lista de Gastos */}
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 h-full">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Meus Gastos</h2>
              
              {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Nenhum gasto registrado ainda.
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <li key={expense.id} className="py-4 flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {expense.description}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {new Date(expense.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-sm font-semibold text-gray-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                           </span>
                           <button
                             onClick={() => handleDeleteExpense(expense.id)}
                             className="text-red-500 hover:text-red-700 p-1"
                             title="Excluir"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

