import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import type { Expense, Category } from '../types';", "import type { Expense } from '../types';")
if "import { useTransactions }" not in content:
    content = content.replace("import { DeleteConfirmModal } from '../components/DeleteConfirmModal';", "import { DeleteConfirmModal } from '../components/DeleteConfirmModal';\nimport { useTransactions } from '../hooks/useTransactions';")

# 2. State
state_old = """export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);"""

state_new = """export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  
  const { 
    expenses, 
    categories, 
    loading, 
    saveExpenses, 
    addCategory, 
    deleteCategory, 
    deleteExpense, 
    togglePaid 
  } = useTransactions(userId);"""
content = content.replace(state_old, state_new)

# 3. Remove loading and userId from original spot
content = re.sub(r"  const \[loading, setLoading\] = useState\(true\);\n  const \[userId, setUserId\] = useState<string \| null>\(null\);\n", "", content)

# 4. checkUser & fetchExpenses
check_user_old = """  const checkUser = async () => {
    const mockUser = localStorage.getItem('juhas_mock_user');
    if (!mockUser) {
      navigate('/login');
    } else {
      setUserId(mockUser);
      fetchExpenses(mockUser);
    }
  };

  const fetchExpenses = async (uid: string) => {
    setLoading(true);
    // Mock fetching from local storage
    const localData = localStorage.getItem(`juhas_expenses_${uid}`);
    if (localData) {
      setExpenses(JSON.parse(localData));
    } else {
      setExpenses([]);
    }
    
    const localCategories = localStorage.getItem(`juhas_categories_${uid}`);
    if (localCategories) {
      setCategories(JSON.parse(localCategories));
    } else {
      setCategories([]);
    }
    setLoading(false);
  };"""

check_user_new = """  const checkUser = async () => {
    const mockUser = localStorage.getItem('juhas_mock_user');
    if (!mockUser) {
      navigate('/login');
    } else {
      setUserId(mockUser);
    }
  };"""
content = content.replace(check_user_old, check_user_new)

# 5. handleAddCategory
add_cat_old = """  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newCategoryName.trim()) return;

    const newCat: Category = {
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      name: newCategoryName.trim(),
      type: newCategoryType,
    };

    const newCategories = [...categories, newCat];
    setCategories(newCategories);
    localStorage.setItem(`juhas_categories_${userId}`, JSON.stringify(newCategories));
    setNewCategoryName('');
  };"""

add_cat_new = """  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newCategoryName.trim()) return;

    addCategory({
      id: Math.random().toString(36).substring(7),
      user_id: userId,
      name: newCategoryName.trim(),
      type: newCategoryType,
    });
    setNewCategoryName('');
  };"""
content = content.replace(add_cat_old, add_cat_new)

# 6. handleDeleteCategory
del_cat_old = """  const handleDeleteCategory = (id: string) => {
    if (!userId) return;
    const newCategories = categories.filter(c => c.id !== id);
    setCategories(newCategories);
    localStorage.setItem(`juhas_categories_${userId}`, JSON.stringify(newCategories));
    if (categoryId === id) setCategoryId('');
  };"""

del_cat_new = """  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    if (categoryId === id) setCategoryId('');
  };"""
content = content.replace(del_cat_old, del_cat_new)

# 7. saveExpenses in handleAddExpense
content = content.replace("""    setExpenses(newExpenses);
    localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));""", "    saveExpenses(newExpenses);")

# 8. handleDeleteExpense & handleTogglePaid
del_exp_old = """  const handleDeleteExpense = async (id: string) => {
    let newExpenses;
    const expenseToDelete = expenses.find(e => e.id === id);
    const isDifferentMonth = expenseToDelete && !expenseToDelete.created_at.startsWith(selectedMonth);

    if (expenseToDelete && expenseToDelete.is_fixed && isDifferentMonth) {
      const updated = {
        ...expenseToDelete,
        excluded_months: [...(expenseToDelete.excluded_months || []), selectedMonth]
      };
      newExpenses = expenses.map(e => e.id === id ? updated : e);
    } else {
      newExpenses = expenses.filter(e => e.id !== id);
    }
    setExpenses(newExpenses);
    if (userId) {
      localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));
    }
  };
  const handleTogglePaid = (expense: Expense) => {
    const newExpenses = expenses.map(e => {
      if (e.id === expense.id) {
        if (e.is_fixed) {
          const paidMonths = e.paid_months || [];
          const isPaid = paidMonths.includes(selectedMonth);
          return {
            ...e,
            paid_months: isPaid
              ? paidMonths.filter(m => m !== selectedMonth)
              : [...paidMonths, selectedMonth]
          };
        } else {
          return { ...e, is_paid: !e.is_paid };
        }
      }
      return e;
    });
    setExpenses(newExpenses);
    if (userId) {
      localStorage.setItem(`juhas_expenses_${userId}`, JSON.stringify(newExpenses));
    }
  };"""

del_exp_new = """  const handleDeleteExpense = (id: string) => {
    deleteExpense(id, selectedMonth);
  };

  const handleTogglePaid = (expense: Expense) => {
    togglePaid(expense, selectedMonth);
  };"""
content = content.replace(del_exp_old, del_exp_new)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
