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

    // Fetch all expenses where the user is involved (either paid or part of splits)
    let expensesSnapshot;
    try {
      // Remove the orderBy clause to avoid requiring a composite index
      expensesSnapshot = await db
        .collection('expenses')
        .where('participants', 'array-contains', userId)
        .get();
      
      console.log(`Found ${expensesSnapshot.docs.length} expenses for user ${userId}`);
    } catch (error) {
      console.error('Error fetching expenses:', 
        error instanceof Error ? error.message : 'Unknown error');
      expensesSnapshot = { docs: [] };
    }
    
    // Fetch all payments where user is either payer or payee
    let paymentsSnapshot;
    try {
      // Remove the orderBy clause to avoid requiring a composite index
      paymentsSnapshot = await db
        .collection('payments')
        .where('participants', 'array-contains', userId)
        .get();
      
      console.log(`Found ${paymentsSnapshot.docs.length} payments for user ${userId}`);
    } catch (error) {
      console.error('Error fetching payments:', 
        error instanceof Error ? error.message : 'Unknown error');
      paymentsSnapshot = { docs: [] };
    }

    // Process expenses
    for (const doc of expensesSnapshot.docs) {
      try {
        const expense = doc.data();
        const groupDoc = expense.groupId ? await db.collection('groups').doc(expense.groupId).get() : null;
        const paidByUser = expense.paidBy === userId;
        const userSplit = expense.splits.find((split: any) => split.userId === userId);

        if (userSplit) {
          let balance = 0;
          if (paidByUser) {
            // If user paid, they are owed the total amount minus their share
            balance = expense.amount - userSplit.amount;
          } else {
            // If user didn't pay, they owe their share
            balance = -userSplit.amount;
          }

          // Get payer's display name
          let payerName = 'Unknown User';
          try {
            const payerDoc = await db.collection('users').doc(expense.paidBy).get();
            payerName = payerDoc.exists ? (payerDoc.data()?.displayName || 'Unknown User') : 'Unknown User';
          } catch (userError) {
            console.warn(`Could not fetch user ${expense.paidBy}:`, userError);
          }

          activities.push({
            id: doc.id,
            type: 'expense',
            description: expense.description,
            amount: expense.amount,
            groupId: expense.groupId,
            groupName: groupDoc?.data()?.name,
            userId: userId,
            paidBy: paidByUser ? 'You' : payerName,
            createdAt: expense.createdAt?.toDate() || new Date(),
            isGroupActivity: !!expense.groupId,
            balance: balance
          });
        }
      } catch (expenseError) {
        console.error('Error processing expense:', expenseError);
      }
    }

    // Process payments
    for (const doc of paymentsSnapshot.docs) {
      try {
        const payment = doc.data();
        const groupDoc = payment.groupId ? await db.collection('groups').doc(payment.groupId).get() : null;
        const isPayer = payment.payerId === userId;

        // Get the other party's name
        let otherPartyName = 'Unknown User';
        try {
          const otherPartyId = isPayer ? payment.payeeId : payment.payerId;
          const otherPartyDoc = await db.collection('users').doc(otherPartyId).get();
          otherPartyName = otherPartyDoc.exists ? (otherPartyDoc.data()?.displayName || 'Unknown User') : 'Unknown User';
        } catch (userError) {
          console.warn('Could not fetch other party:', userError);
        }

        activities.push({
          id: doc.id,
          type: 'payment',
          description: 'Payment Settlement',
          amount: payment.amount,
          groupId: payment.groupId,
          groupName: groupDoc?.data()?.name,
          userId: userId,
          paidBy: isPayer ? 'You' : otherPartyName,
          paidTo: isPayer ? otherPartyName : 'You',
          createdAt: payment.createdAt?.toDate() || new Date(),
          isGroupActivity: !!payment.groupId,
          balance: isPayer ? -payment.amount : payment.amount
        });
      } catch (paymentError) {
        console.error('Error processing payment:', paymentError);
      }
    }

    // Sort all activities by date manually
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`Returning ${activities.length} total activities`);
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