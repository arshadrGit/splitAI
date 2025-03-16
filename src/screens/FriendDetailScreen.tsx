import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchUserExpenses } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Expense, Friend, Split } from '../types/index';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { formatDate } from '../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendDetail'>;

const FriendDetailScreen = ({ route, navigation }: Props) => {
  const { friendId, friendName } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const { expenses, loading } = useSelector((state: RootState) => state.expenses);
  const [friendExpenses, setFriendExpenses] = useState<Expense[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserExpenses(user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (expenses && expenses.length > 0) {
      // Filter expenses that involve this friend
      const filteredExpenses = expenses.filter(expense => {
        return expense.participants.includes(friendId) || 
               expense.paidBy === friendId;
      });
      
      setFriendExpenses(filteredExpenses);
      
      // Calculate total owed
      let total = 0;
      filteredExpenses.forEach(expense => {
        if (expense.paidBy === friendId) {
          // Friend paid, so we might owe them
          const userSplit = expense.splits.find(split => split.userId === user?.id);
          total -= userSplit?.amount || 0;
        } else if (expense.paidBy === user?.id) {
          // User paid, so friend might owe us
          const friendSplit = expense.splits.find(split => split.userId === friendId);
          total += friendSplit?.amount || 0;
        }
      });
      
      setTotalOwed(total);
    }
  }, [expenses, friendId, user?.id]);

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const isUserPaid = item.paidBy === user?.id;
    const friendSplit = item.splits.find(split => split.userId === friendId);
    const userSplit = item.splits.find(split => split.userId === user?.id);
    
    let amountText = '';
    let amountColor = theme.colors.text;
    
    if (isUserPaid && friendSplit) {
      amountText = `${friendName} owes $${friendSplit.amount.toFixed(2)}`;
      amountColor = theme.colors.success;
    } else if (item.paidBy === friendId && userSplit) {
      amountText = `You owe $${userSplit.amount.toFixed(2)}`;
      amountColor = theme.colors.error;
    }

    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <ThemeText variant="subtitle" style={styles.expenseDescription}>
            {item.description}
          </ThemeText>
          <ThemeText variant="body" style={styles.expenseDate}>
            {formatDate(item.createdAt.toString())}
          </ThemeText>
        </View>
        <View style={styles.expenseDetails}>
          <View style={styles.paidByContainer}>
            <ThemeText variant="body">
              {item.paidBy === user?.id ? 'You paid' : `${friendName} paid`}
            </ThemeText>
            <ThemeText variant="body" style={styles.totalAmount}>
              ${item.amount.toFixed(2)}
            </ThemeText>
          </View>
          <ThemeText variant="body" style={[styles.owedAmount, { color: amountColor }]}>
            {amountText}
          </ThemeText>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaWrapper>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title={friendName}
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()}
          rightIcon="plus"
          onRightPress={() => navigation.navigate('AddExpense', { friendId })}
        />

        <Card style={styles.balanceCard}>
          <ThemeText variant="title" style={styles.balanceTitle}>
            {totalOwed > 0 
              ? `${friendName} owes you` 
              : totalOwed < 0 
                ? `You owe ${friendName}` 
                : 'You are settled up'}
          </ThemeText>
          <ThemeText 
            variant="title" 
            style={[
              styles.balanceAmount,
              { color: totalOwed > 0 ? theme.colors.success : totalOwed < 0 ? theme.colors.error : theme.colors.text }
            ]}
          >
            ${Math.abs(totalOwed).toFixed(2)}
          </ThemeText>
          <TouchableOpacity 
            style={[styles.settleButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              // Navigate to settle up screen
              Alert.alert('Coming Soon', 'Settle up functionality will be available soon!');
            }}
          >
            <Icon name="handshake" size={20} color="#FFFFFF" />
            <ThemeText style={styles.settleButtonText}>Settle Up</ThemeText>
          </TouchableOpacity>
        </Card>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : friendExpenses.length > 0 ? (
          <FlatList
            data={friendExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.expensesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="cash-remove" size={60} color={theme.colors.border} />
            <ThemeText variant="subtitle" style={styles.emptyStateText}>
              No expenses with {friendName} yet
            </ThemeText>
            <TouchableOpacity
              style={[styles.addExpenseButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('AddExpense', { friendId })}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <ThemeText style={styles.addExpenseButtonText}>Add an expense</ThemeText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceCard: {
    padding: 10,
    margin: 16,
    borderRadius: 12,
    // backgroundColor: '#FFFFFF',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    alignItems: 'center',
  },
  balanceTitle: {
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  settleButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  expensesList: {
    padding: 16,
  },
  expenseCard: {
    marginBottom: 12,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expenseDescription: {
    flex: 1,
  },
  expenseDate: {
    color: '#888',
  },
  expenseDetails: {
    marginTop: 8,
  },
  paidByContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalAmount: {
    fontWeight: '600',
  },
  owedAmount: {
    marginTop: 4,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  addExpenseButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default FriendDetailScreen; 