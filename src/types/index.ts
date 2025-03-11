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
  status: 'pending' | 'accepted';
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
  totalExpenses: number;
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