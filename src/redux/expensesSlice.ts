import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';

interface ExpenseSplit {
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

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  expenses: [],
  loading: false,
  error: null,
};

// Fetch expenses for a group
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (groupId: string) => {
    const expensesSnapshot = await firestore()
      .collection('expenses')
      .where('groupId', '==', groupId)
      .orderBy('date', 'desc')
      .get();
    
    return expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as Expense));
  }
);

// Add a new expense
export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expense: Omit<Expense, 'id'>) => {
    const db = firestore();
    
    // Start a batch operation
    const batch = db.batch();
    
    // Add the expense
    const expenseRef = db.collection('expenses').doc();
    batch.set(expenseRef, {
      ...expense,
      date: firestore.Timestamp.fromDate(expense.date),
      createdAt: firestore.Timestamp.fromDate(expense.createdAt),
    });
    
    // Update the group's total expenses
    const groupRef = db.collection('groups').doc(expense.groupId);
    const groupDoc = await groupRef.get();
    
    if (groupDoc.exists) {
      const currentTotal = groupDoc.data()?.totalExpenses || 0;
      batch.update(groupRef, {
        totalExpenses: currentTotal + expense.amount
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    // Get the newly created expense
    const newExpense = await expenseRef.get();
    
    return {
      id: newExpense.id,
      ...newExpense.data(),
      date: newExpense.data()?.date.toDate(),
      createdAt: newExpense.data()?.createdAt.toDate(),
    } as Expense;
  }
);

// Delete an expense
export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async ({ expenseId, groupId }: { expenseId: string; groupId: string }) => {
    const db = firestore();
    
    // Get the expense to be deleted
    const expenseDoc = await db.collection('expenses').doc(expenseId).get();
    
    if (!expenseDoc.exists) {
      throw new Error('Expense not found');
    }
    
    const expenseAmount = expenseDoc.data()?.amount || 0;
    
    // Start a batch operation
    const batch = db.batch();
    
    // Delete the expense
    batch.delete(db.collection('expenses').doc(expenseId));
    
    // Update the group's total expenses
    const groupRef = db.collection('groups').doc(groupId);
    const groupDoc = await groupRef.get();
    
    if (groupDoc.exists) {
      const currentTotal = groupDoc.data()?.totalExpenses || 0;
      batch.update(groupRef, {
        totalExpenses: Math.max(0, currentTotal - expenseAmount)
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    return expenseId;
  }
);

// Calculate balances for a group
export const calculateBalances = createAsyncThunk(
  'expenses/calculateBalances',
  async (groupId: string) => {
    const expensesSnapshot = await firestore()
      .collection('expenses')
      .where('groupId', '==', groupId)
      .get();
    
    const expenses = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Expense));
    
    // Calculate net balance for each user
    const balances: { [userId: string]: number } = {};
    
    expenses.forEach(expense => {
      // Add amount to the person who paid
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;
      
      // Subtract each person's share
      expense.splits.forEach(split => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
    });
    
    return balances;
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      })
      .addCase(addExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = [action.payload, ...state.expenses];
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add expense';
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
      });
  },
});

export default expensesSlice.reducer; 