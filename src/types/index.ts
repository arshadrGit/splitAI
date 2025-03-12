export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: Date;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
  totalExpenses: number;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  date: Date;
  splits: ExpenseSplit[];
  createdBy: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface Activity {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'expense' | 'payment';
  paidTo: string;
  createdAt: Date;
  groupId?: string;
}

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    error: string;
    success: string;
    placeholder: string;
    disabled: string;
  };
} 