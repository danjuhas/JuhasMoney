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
  category_id?: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
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
};

