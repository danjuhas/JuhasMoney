export type Expense = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  created_at: string;
  is_fixed?: boolean;
  excluded_months?: string[];
  due_day?: number;
  end_month?: string;
  is_paid?: boolean;
  paid_months?: string[];
  type?: 'income' | 'expense';
  group_id?: string;
  category_id?: string;
  credit_card_id?: string | null;
  installments?: {
    current: number;
    total: number;
  };
};

export type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  closing_day: number; // 1-31
  due_day: number; // 1-31
  limit?: number;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: 'INFO' | 'WARNING' | 'ERROR';
  reference_date?: string;
  related_expense_ids?: string[];
  hidden?: boolean;
};

export type InvestmentCategory =
  | 'emergency'
  | 'fixed_income'
  | 'variable_income'
  | 'crypto'
  | 'other';

export type Investment = {
  id: string;
  user_id: string;
  name: string;
  category: InvestmentCategory;
  color: string;
  target_amount?: number | null;
  created_at: string;
};

export type InvestmentTransactionType = 'contribution' | 'withdrawal' | 'yield';

export type InvestmentTransaction = {
  id: string;
  investment_id: string;
  user_id: string;
  type: InvestmentTransactionType;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
};


