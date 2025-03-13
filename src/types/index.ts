export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  friends: string[];
  groups: string[];
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
  balances: Balance[];
  simplifiedDebts: Debt[];
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';

export interface Split {
  userId: string;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  groupId?: string;
  splitType: SplitType;
  splits: Split[];
  participants: string[];
  createdAt: Date;
  category?: string;
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

export interface Balance {
  userId: string;
  amount: number;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
} 