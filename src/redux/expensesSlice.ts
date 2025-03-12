import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Expense, ExpenseSplit } from '../types';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';

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
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    } as Expense));
  }
);

// Add a new expense
export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expense: Omit<Expense, 'id'>) => {
    const db = firestore();
    const expensesCollection = db.collection('expenses');
    
    // Add the expense
    const docRef = await expensesCollection.add({
      ...expense,
      date: firestore.Timestamp.fromDate(expense.date),
      createdAt: firestore.Timestamp.fromDate(expense.createdAt),
    });
    
    // Update group total
    const groupRef = db.collection('groups').doc(expense.groupId);
    await db.runTransaction(async (transaction) => {
      const groupDoc = await transaction.get(groupRef);
      if (!groupDoc.exists) {
        throw new Error('Group not found');
      }
      
      const currentTotal = groupDoc.data()?.totalExpenses || 0;
      transaction.update(groupRef, {
        totalExpenses: currentTotal + expense.amount
      });
    });
    
    const newExpense = await docRef.get();
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
    const db = firestore();
    const balances: { [key: string]: number } = {};

    // Get all expenses for the group
    const expensesSnapshot = await db
      .collection('expenses')
      .where('groupId', '==', groupId)
      .orderBy('date', 'desc')
      .get();

    // First pass: Calculate raw balances from expenses
    expensesSnapshot.docs.forEach(doc => {
      const expense = doc.data();
      if (expense.type === 'payment') return; // Skip payment records in first pass
      
      const paidBy = expense.paidBy;
      const splits = expense.splits as ExpenseSplit[];
      
      // Add the full amount to the payer's balance (positive means they are owed money)
      balances[paidBy] = (balances[paidBy] || 0) + expense.amount;
      
      // Subtract each person's share from their balance
      splits.forEach(split => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
    });

    try {
      // Get all completed payments
      const paymentsSnapshot = await db
        .collection('payments')
        .where('groupId', '==', groupId)
        .get();

      // Second pass: Apply payments to adjust balances
      paymentsSnapshot.docs.forEach(doc => {
        const payment = doc.data();
        // When someone pays, their balance increases (they owe less)
        balances[payment.payerId] = (balances[payment.payerId] || 0) + payment.amount;
        // The person receiving the payment has their balance decrease (they are owed less)
        balances[payment.payeeId] = (balances[payment.payeeId] || 0) - payment.amount;
      });
    } catch (error) {
      // If payments collection doesn't exist yet, just continue with expense-based balances
      console.log('No payments collection yet:', error);
    }

    return balances;
  }
);

// Record a payment between users
export const recordPayment = createAsyncThunk(
  'expenses/recordPayment',
  async ({ groupId, payerId, payeeId, amount }: { groupId: string; payerId: string; payeeId: string; amount: number }, { dispatch }) => {
    try {
      const db = firestore();
      
      // Start a batch operation
      const batch = db.batch();
      
      // Add the payment record
      const paymentRef = db.collection('payments').doc();
      const paymentData = {
        groupId,
        payerId,
        payeeId,
        amount,
        createdAt: firestore.Timestamp.now(),
        status: 'completed'
      };
      
      batch.set(paymentRef, paymentData);

      // Create a virtual expense to represent the payment
      const expenseRef = db.collection('expenses').doc();
      const expenseData = {
        groupId,
        description: 'Payment Settlement',
        amount: amount,
        paidBy: payerId,
        date: firestore.Timestamp.now(),
        splits: [
          {
            userId: payeeId,
            amount: amount
          }
        ],
        createdBy: payerId,
        createdAt: firestore.Timestamp.now(),
        type: 'payment'
      };
      
      batch.set(expenseRef, expenseData);

      // Commit both operations
      await batch.commit();

      // After recording the payment, recalculate balances
      const balances = await dispatch(calculateBalances(groupId)).unwrap();
      return balances;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
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
        state.expenses.unshift(action.payload);
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add expense';
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
      })
      .addCase(recordPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordPayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to record payment';
      });
  },
});

export default expensesSlice.reducer; 