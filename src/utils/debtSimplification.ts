import { Balance, Debt, Split, Expense, SplitType } from '../types';

interface DebtGraph {
  [key: string]: { [key: string]: number };
}

export function simplifyDebts(balances: Balance[]): Debt[] {
  // Create a graph of all debts
  const debtGraph: DebtGraph = {};
  
  // Initialize the graph
  balances.forEach(balance => {
    debtGraph[balance.userId] = {};
    balances.forEach(other => {
      if (balance.userId !== other.userId) {
        debtGraph[balance.userId][other.userId] = 0;
      }
    });
  });

  // Find users who owe money (negative balance) and users who are owed money (positive balance)
  const debtors = balances.filter(b => b.amount < 0)
    .sort((a, b) => a.amount - b.amount); // Sort by most negative first
  const creditors = balances.filter(b => b.amount > 0)
    .sort((a, b) => b.amount - a.amount); // Sort by most positive first

  // Match debtors with creditors to minimize transactions
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const debtAmount = Math.abs(debtor.amount);
    const creditAmount = creditor.amount;
    
    const transferAmount = Math.min(debtAmount, creditAmount);
    
    if (transferAmount > 0.01) { // Only create debt if amount is significant
      // Record the debt in the graph
      debtGraph[debtor.userId][creditor.userId] = Number(transferAmount.toFixed(2));
    }
    
    // Update remaining amounts
    debtor.amount = Number((debtor.amount + transferAmount).toFixed(2));
    creditor.amount = Number((creditor.amount - transferAmount).toFixed(2));
    
    // Move to next debtor/creditor if their balance is settled
    if (Math.abs(debtor.amount) < 0.01) debtorIndex++;
    if (Math.abs(creditor.amount) < 0.01) creditorIndex++;
  }

  // Convert the graph to a list of debts
  const simplifiedDebts: Debt[] = [];
  Object.keys(debtGraph).forEach(from => {
    Object.keys(debtGraph[from]).forEach(to => {
      const amount = debtGraph[from][to];
      if (amount > 0.01) { // Only include significant debts
        simplifiedDebts.push({
          from,
          to,
          amount: Number(amount.toFixed(2))
        });
      }
    });
  });

  return simplifiedDebts;
}

export function calculateBalances(expenses: Expense[], participants: string[]): Balance[] {
  const balances: { [key: string]: number } = {};
  
  // Initialize balances for all participants
  participants.forEach(userId => {
    balances[userId] = 0;
  });

  // Process each expense
  expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const totalAmount = expense.amount;

    // Add the full amount to the payer's balance
    balances[paidBy] = Number((balances[paidBy] + totalAmount).toFixed(2));

    // Calculate and subtract each participant's share
    if (expense.splitType === 'EQUAL') {
      const equalShare = Number((totalAmount / expense.participants.length).toFixed(2));
      expense.participants.forEach(participantId => {
        if (participantId !== paidBy) { // Don't subtract from payer for their own share
          balances[participantId] = Number((balances[participantId] - equalShare).toFixed(2));
        }
      });
    } else {
      // For EXACT and PERCENTAGE splits, use the calculated split amounts
      expense.splits.forEach((split: Split) => {
        if (split.userId !== paidBy) { // Don't subtract from payer for their own share
          balances[split.userId] = Number((balances[split.userId] - split.amount).toFixed(2));
        }
      });
    }
  });

  // Convert balances object to array
  return Object.entries(balances).map(([userId, amount]) => ({
    userId,
    amount: Number(amount.toFixed(2)) // Round to 2 decimal places
  }));
}

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