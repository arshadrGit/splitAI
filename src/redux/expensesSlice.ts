import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Expense, ExpenseSplit, Split, SplitType, Balance } from '../types';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';
import { calculateSplitAmounts, calculateBalances, simplifyDebts } from '../utils/debtSimplification';

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
    try {
      console.log(`Fetching expenses for ${groupId === 'all' ? 'all groups' : `group ${groupId}`}`);
      const db = firestore();
      let expensesSnapshot;
      
      try {
        // If groupId is 'all', fetch all expenses, otherwise filter by groupId
        if (groupId === 'all') {
          expensesSnapshot = await db
            .collection('expenses')
            .get();
        } else {
          expensesSnapshot = await db
            .collection('expenses')
            .where('groupId', '==', groupId)
            .get();
        }
          
        console.log(`Found ${expensesSnapshot.docs.length} expenses`);
      } catch (error) {
        // Log the error details without accessing error.stack
        console.error('Error fetching expenses:', 
          error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
      
      const expenses = expensesSnapshot.docs.map(doc => {
        const data = doc.data();
        const expense = {
          id: doc.id,
          description: data.description || '',
          amount: data.amount || 0,
          paidBy: data.paidBy || '',
          groupId: data.groupId,
          splitType: data.splitType || 'EQUAL',
          splits: data.splits || [],
          participants: data.participants || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          type: data.type || 'expense',
          payeeId: data.payeeId
        } as Expense;
        return expense;
      });
      
      // Sort manually by createdAt
      expenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log(`Processed ${expenses.length} expenses`);
      return expenses;
    } catch (error) {
      // Safely handle the error without accessing stack
      console.error('Error in fetchExpenses:', 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
);

interface AddExpenseParams {
  description: string;
  amount: number;
  paidBy: string;
  groupId?: string | null;
  splitType: SplitType;
  participants: string[];
  splits: Split[];
}

// Add a new expense
export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (params: AddExpenseParams) => {
    try {
      console.log('Adding expense with params:', params);
      
      const expenseData: Omit<Expense, 'id'> = {
        description: params.description,
        amount: params.amount,
        paidBy: params.paidBy,
        groupId: params.groupId || undefined,
        splitType: params.splitType,
        splits: params.splits,
        participants: params.participants,
        createdAt: new Date(),
        type: 'expense'
      };

      const db = firestore();
      const batch = db.batch();

      // Create expense document
      const expenseRef = db.collection('expenses').doc();
      batch.set(expenseRef, {
        ...expenseData,
        createdAt: firestore.Timestamp.fromDate(expenseData.createdAt)
      });

      // Update group balances if it's a group expense
      if (params.groupId) {
        const groupRef = db.collection('groups').doc(params.groupId);
        const groupDoc = await groupRef.get();
        const groupData = groupDoc.data();

        if (groupData) {
          // Get all group expenses including the new one
          const expensesSnapshot = await db
            .collection('expenses')
            .where('groupId', '==', params.groupId)
            .get();

          // Convert all expenses to the correct format with dates
          const allExpenses = [
            ...expensesSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                splits: data.splits || [],
                participants: data.participants || [],
                type: data.type || 'expense'
              } as Expense;
            }),
            { id: expenseRef.id, ...expenseData }
          ];

          // Calculate new balances
          const balances = calculateBalances(params.participants, allExpenses);
          const simplifiedDebts = simplifyDebts(balances);

          console.log('Calculated Balances:', {
            expenses: allExpenses.length,
            balances,
            simplifiedDebts
          });

          // Update group with new balances and total
          batch.update(groupRef, {
            balances: balances.map(b => ({
              userId: b.userId,
              amount: Number(b.amount.toFixed(2))
            })),
            simplifiedDebts: simplifiedDebts.map(d => ({
              from: d.from,
              to: d.to,
              amount: Number(d.amount.toFixed(2))
            })),
            totalExpenses: firestore.FieldValue.increment(params.amount)
          });
        }
      } else {
        // For personal expenses, we don't need to update group balances
        console.log('Adding personal expense');
      }

      await batch.commit();
      console.log('Expense added successfully:', expenseRef.id);
      
      return { id: expenseRef.id, ...expenseData } as Expense;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
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

// // Calculate balances for a group
// export const calculateBalances = createAsyncThunk(
//   'expenses/calculateBalances',
//   async (groupId: string) => {
//     const db = firestore();
//     const balances: { [key: string]: number } = {};

//     // Get all expenses for the group
//     const expensesSnapshot = await db
//       .collection('expenses')
//       .where('groupId', '==', groupId)
//       .orderBy('date', 'desc')
//       .get();

//     // First pass: Calculate raw balances from expenses
//     expensesSnapshot.docs.forEach(doc => {
//       const expense = doc.data();
//       if (expense.type === 'payment') return; // Skip payment records in first pass
      
//       const paidBy = expense.paidBy;
//       const splits = expense.splits as ExpenseSplit[];
      
//       // Add the full amount to the payer's balance (positive means they are owed money)
//       balances[paidBy] = (balances[paidBy] || 0) + expense.amount;
      
//       // Subtract each person's share from their balance
//       splits.forEach(split => {
//         balances[split.userId] = (balances[split.userId] || 0) - split.amount;
//       });
//     });

//     try {
//       // Get all completed payments
//       const paymentsSnapshot = await db
//         .collection('payments')
//         .where('groupId', '==', groupId)
//         .get();

//       // Second pass: Apply payments to adjust balances
//       paymentsSnapshot.docs.forEach(doc => {
//         const payment = doc.data();
//         // When someone pays, their balance increases (they owe less)
//         balances[payment.payerId] = (balances[payment.payerId] || 0) + payment.amount;
//         // The person receiving the payment has their balance decrease (they are owed less)
//         balances[payment.payeeId] = (balances[payment.payeeId] || 0) - payment.amount;
//       });
//     } catch (error) {
//       // If payments collection doesn't exist yet, just continue with expense-based balances
//       console.log('No payments collection yet:', error);
//     }

//     return balances;
//   }
// );

// Record a payment between users
export const recordPayment = createAsyncThunk(
  'expenses/recordPayment',
  async ({ groupId, payerId, payeeId, amount }: { groupId: string; payerId: string; payeeId: string; amount: number }) => {
    try {
      console.log('Recording payment:', { groupId, payerId, payeeId, amount });
      
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
      console.log('Created payment record:', paymentRef.id);

      // Create a virtual expense to represent the payment
      const expenseRef = db.collection('expenses').doc();
      const expenseData = {
        groupId,
        description: 'Payment Settlement',
        amount: amount,
        paidBy: payerId,
        payeeId: payeeId,
        splitType: 'EXACT' as SplitType,
        participants: [payerId, payeeId],
        splits: [
          {
            userId: payeeId,
            amount: amount
          }
        ],
        createdAt: firestore.Timestamp.now(),
        type: 'payment'
      };
      
      batch.set(expenseRef, expenseData);
      console.log('Created payment expense:', expenseRef.id);

      try {
        // Update group balances
        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();
        
        if (groupDoc.exists) {
          const groupData = groupDoc.data();
          
          if (groupData) {
            // Get all expenses including the new payment
            let expensesSnapshot;
            
            try {
              // Try with ordering (requires index)
              expensesSnapshot = await db
                .collection('expenses')
                .where('groupId', '==', groupId)
                .get();
            } catch (indexError) {
              console.warn('Index error in recordPayment, using simple query:', indexError);
              
              // Fallback to simple query without ordering
              expensesSnapshot = await db
                .collection('expenses')
                .where('groupId', '==', groupId)
                .get();
            }
              
            console.log(`Found ${expensesSnapshot.docs.length} existing expenses for group ${groupId}`);
            
            const allExpenses = expensesSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                splits: data.splits || [],
                participants: data.participants || [],
                type: data.type || 'expense',
                payeeId: data.payeeId
              } as Expense;
            });
            
            // Add the new payment expense
            allExpenses.push({
              id: expenseRef.id,
              ...expenseData,
              createdAt: new Date()
            } as unknown as Expense);
            
            console.log('Total expenses for balance calculation:', allExpenses.length);
            
            // Recalculate all balances from scratch
            const members = groupData.members || [];
            const balances = calculateBalances(
              members.map((m: { id: string }) => m.id), 
              allExpenses
            );
            const simplifiedDebts = simplifyDebts(balances);
            
            console.log('Updated balances:', balances.length);
            console.log('Updated simplified debts:', simplifiedDebts.length);
            
            // Update group with new balances and simplified debts
            batch.update(groupRef, {
              balances: balances.map(b => ({
                userId: b.userId,
                amount: Number(b.amount.toFixed(2))
              })),
              simplifiedDebts: simplifiedDebts.map(d => ({
                from: d.from,
                to: d.to,
                amount: Number(d.amount.toFixed(2))
              }))
            });
          }
        }
      } catch (groupUpdateError) {
        console.error('Error updating group balances:', groupUpdateError);
        // Continue with the payment recording even if balance update fails
      }

      // Commit all operations
      await batch.commit();
      console.log('Payment successfully recorded');

      return { success: true, paymentId: expenseRef.id };
    } catch (error) {
      console.error('Error recording payment:', typeof error === 'object' ? JSON.stringify(error) : error);
      throw error;
    }
  }
);

export const fetchGroupExpenses = createAsyncThunk(
  'expenses/fetchGroupExpenses',
  async (groupId: string) => {
    const snapshot = await firestore()
      .collection('expenses')
      .where('groupId', '==', groupId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];
  }
);

export const fetchUserExpenses = createAsyncThunk(
  'expenses/fetchUserExpenses',
  async (userId: string) => {
    const snapshot = await firestore()
      .collection('expenses')
      .where('participants', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];
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
      })
      .addCase(fetchGroupExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchGroupExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      })
      .addCase(fetchUserExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchUserExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      });
  },
});

export default expensesSlice.reducer; 