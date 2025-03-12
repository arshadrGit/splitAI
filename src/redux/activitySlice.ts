import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'settlement';
  description: string;
  amount: number;
  groupId?: string;
  groupName?: string;
  userId: string;
  paidBy: string;
  paidTo?: string;
  createdAt: Date;
  isGroupActivity: boolean;
  balance: number;
}

interface ActivityState {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  activities: [],
  loading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (userId: string) => {
    const db = firestore();
    const activities: ActivityItem[] = [];

    // Fetch personal expenses
    const personalExpensesSnapshot = await db
      .collection('expenses')
      .where('paidBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    // Fetch group expenses
    const groupExpensesSnapshot = await db
      .collection('expenses')
      .where('splits', 'array-contains', { userId: userId })
      .orderBy('createdAt', 'desc')
      .get();

    // Fetch payments
    let paymentsSnapshot;
    try {
      paymentsSnapshot = await db
        .collection('payments')
        .where('payerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (error) {
      console.log('No payments yet:', error);
      paymentsSnapshot = { docs: [] };
    }

    // Process personal expenses
    for (const doc of personalExpensesSnapshot.docs) {
      const expense = doc.data();
      const groupDoc = expense.groupId ? await db.collection('groups').doc(expense.groupId).get() : null;
      
      activities.push({
        id: doc.id,
        type: 'expense',
        description: expense.description,
        amount: expense.amount,
        groupId: expense.groupId,
        groupName: groupDoc?.data()?.name,
        userId: userId,
        paidBy: expense.paidBy,
        createdAt: expense.createdAt.toDate(),
        isGroupActivity: !!expense.groupId,
        balance: expense.amount // Will be adjusted later
      });
    }

    // Process group expenses
    for (const doc of groupExpensesSnapshot.docs) {
      const expense = doc.data();
      const groupDoc = await db.collection('groups').doc(expense.groupId).get();
      const userSplit = expense.splits.find((split: any) => split.userId === userId);
      
      if (userSplit && expense.paidBy !== userId) {
        activities.push({
          id: doc.id,
          type: 'expense',
          description: expense.description,
          amount: userSplit.amount,
          groupId: expense.groupId,
          groupName: groupDoc.data()?.name,
          userId: userId,
          paidBy: expense.paidBy,
          createdAt: expense.createdAt.toDate(),
          isGroupActivity: true,
          balance: -userSplit.amount // Negative because user owes this amount
        });
      }
    }

    // Process payments
    for (const doc of paymentsSnapshot.docs) {
      const payment = doc.data();
      const groupDoc = payment.groupId ? await db.collection('groups').doc(payment.groupId).get() : null;
      
      activities.push({
        id: doc.id,
        type: 'payment',
        description: 'Payment Settlement',
        amount: payment.amount,
        groupId: payment.groupId,
        groupName: groupDoc?.data()?.name,
        userId: userId,
        paidBy: payment.payerId,
        paidTo: payment.payeeId,
        createdAt: payment.createdAt.toDate(),
        isGroupActivity: !!payment.groupId,
        balance: -payment.amount // Negative because it's a payment made
      });
    }

    // Sort all activities by date
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activities;
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activities';
      });
  },
});

export default activitySlice.reducer; 