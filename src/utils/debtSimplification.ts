import { Balance, Debt, Split, Expense, SplitType } from '../types';

interface DebtGraph {
  [key: string]: { [key: string]: number };
}

export const simplifyDebts = (balances: Balance[]): Debt[] => {
  try {
    console.log('Simplifying debts for', balances.length, 'balances');
    
    // Filter out zero balances
    const nonZeroBalances = balances.filter(balance => Math.abs(balance.amount) > 0.01);
    
    if (nonZeroBalances.length === 0) {
      console.log('No non-zero balances to simplify');
      return [];
    }
    
    // Separate positive (creditors) and negative (debtors) balances
    const creditors = nonZeroBalances
      .filter(balance => balance.amount > 0)
      .sort((a, b) => b.amount - a.amount); // Sort descending
      
    const debtors = nonZeroBalances
      .filter(balance => balance.amount < 0)
      .sort((a, b) => a.amount - b.amount); // Sort ascending (most negative first)
    
    console.log(`Found ${creditors.length} creditors and ${debtors.length} debtors`);
    
    const debts: Debt[] = [];
    
    // Create simplified debts
    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];
      
      // Calculate the amount to transfer
      const transferAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
      
      if (transferAmount > 0.01) { // Only create debts for non-trivial amounts
        debts.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Number(transferAmount.toFixed(2))
        });
      }
      
      // Update balances
      creditor.amount = Number((creditor.amount - transferAmount).toFixed(2));
      debtor.amount = Number((debtor.amount + transferAmount).toFixed(2));
      
      // Remove users with zero balance
      if (Math.abs(creditor.amount) < 0.01) {
        creditors.shift();
      }
      
      if (Math.abs(debtor.amount) < 0.01) {
        debtors.shift();
      }
    }
    
    console.log(`Created ${debts.length} simplified debts`);
    return debts;
  } catch (error) {
    console.error('Error in simplifyDebts:', typeof error === 'object' ? JSON.stringify(error) : error);
    return [];
  }
};

export const calculateBalances = (participants: string[], expenses: Expense[]): Balance[] => {
  try {
    console.log(`Calculating balances for ${participants.length} participants and ${expenses.length} expenses`);
    
    // Initialize balances for all participants
    const balances: Record<string, number> = {};
    participants.forEach(userId => {
      balances[userId] = 0;
    });

    // Process each expense
    expenses.forEach((expense, index) => {
      try {
        // Skip expenses without required data
        if (!expense.paidBy || !expense.amount || !expense.splits || expense.splits.length === 0) {
          console.warn(`Skipping expense #${index} due to missing data:`, 
            JSON.stringify({
              id: expense.id,
              paidBy: expense.paidBy,
              amount: expense.amount,
              splits: expense.splits?.length
            }));
          return;
        }

        const paidBy = expense.paidBy;
        const amount = expense.amount;
        
        // Ensure payer exists in balances
        if (!balances.hasOwnProperty(paidBy)) {
          console.warn(`Adding missing payer ${paidBy} to balances`);
          balances[paidBy] = 0;
        }
        
        // Handle payment type expenses differently
        if (expense.type === 'payment') {
          if (!expense.payeeId) {
            console.warn(`Payment expense #${index} (${expense.id}) missing payeeId, skipping`);
            return;
          }
          
          // Ensure payee exists in balances
          if (!balances.hasOwnProperty(expense.payeeId)) {
            console.warn(`Adding missing payee ${expense.payeeId} to balances`);
            balances[expense.payeeId] = 0;
          }
          
          console.log(`Processing payment: ${paidBy} paid ${expense.payeeId} $${amount}`);
          
          // For payments, the payer's balance increases (they are owed more)
          balances[paidBy] += amount;
          
          // The payee's balance decreases (they owe more)
          balances[expense.payeeId] -= amount;
          
          return;
        }
        
        // For regular expenses, the payer's balance increases by the full amount
        balances[paidBy] += amount;
        
        // Process each split
        expense.splits.forEach(split => {
          try {
            const userId = split.userId;
            const splitAmount = split.amount;
            
            // Ensure participant exists in balances
            if (!balances.hasOwnProperty(userId)) {
              console.warn(`Adding missing participant ${userId} to balances`);
              balances[userId] = 0;
            }
            
            // Participant's balance decreases by their split amount
            balances[userId] -= splitAmount;
          } catch (splitError) {
            console.error(`Error processing split for user ${split.userId} in expense #${index}:`, 
              typeof splitError === 'object' ? JSON.stringify(splitError) : splitError);
          }
        });
      } catch (expenseError) {
        console.error(`Error processing expense #${index}:`, 
          typeof expenseError === 'object' ? JSON.stringify(expenseError) : expenseError);
      }
    });

    // Convert balances object to array format
    const balanceArray: Balance[] = Object.entries(balances).map(([userId, amount]) => ({
      userId,
      amount: Number(amount.toFixed(2))
    }));

    console.log('Final balances:', balanceArray.map(b => `${b.userId}: ${b.amount}`).join(', '));
    return balanceArray;
  } catch (error) {
    console.error('Error in calculateBalances:', typeof error === 'object' ? JSON.stringify(error) : error);
    // Return empty balances array in case of error
    return participants.map(userId => ({ userId, amount: 0 }));
  }
};

export function calculateSplitAmounts(
  totalAmount: number,
  splitType: SplitType,
  participants: string[],
  customSplits?: Split[]
): Split[] {
  switch (splitType) {
    case 'EQUAL': {
      const equalShare = Number((totalAmount / participants.length).toFixed(2));
      // Adjust the last share to account for rounding
      const shares = participants.map((userId, index) => {
        if (index === participants.length - 1) {
          const sumOtherShares = equalShare * (participants.length - 1);
          return {
            userId,
            amount: Number((totalAmount - sumOtherShares).toFixed(2))
          };
        }
        return {
          userId,
          amount: equalShare
        };
      });
      return shares;
    }

    case 'EXACT': {
      if (!customSplits) throw new Error('Custom splits required for EXACT split type');
      const total = customSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(total - totalAmount) > 0.01) {
        throw new Error('Sum of exact amounts must equal total amount');
      }
      return customSplits.map(split => ({
        userId: split.userId,
        amount: Number(split.amount.toFixed(2))
      }));
    }

    case 'PERCENTAGE': {
      if (!customSplits) throw new Error('Custom splits required for PERCENTAGE split type');
      const total = customSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new Error('Sum of percentages must equal 100');
      }
      return customSplits.map(split => ({
        userId: split.userId,
        amount: Number(((split.percentage || 0) * totalAmount / 100).toFixed(2)),
        percentage: split.percentage
      }));
    }

    default:
      throw new Error('Invalid split type');
  }
} 