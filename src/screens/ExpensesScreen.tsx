import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchExpenses } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { Header } from '../components/Header';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const ExpensesScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { expenses, loading } = useSelector((state: RootState) => state.expenses);
  const { user } = useSelector((state: RootState) => state.auth);
  const { friends } = useSelector((state: RootState) => state.friends);
  const { groups } = useSelector((state: RootState) => state.groups);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setRefreshing(true);
      // Fetch all expenses (not filtered by group)
      await dispatch(fetchExpenses('all'));
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDisplayName = (userId: string) => {
    if (userId === user?.id) return 'You';
    
    // Check in friends list
    const friend = friends.find(f => f.friendId === userId);
    if (friend?.displayName) return friend.displayName;
    
    // If not found, just return the ID
    return userId;
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Personal';
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  const renderExpenseItem = ({ item }: { item: any }) => {
    const paidByName = getDisplayName(item.paidBy);
    const isUserPayer = item.paidBy === user?.id;
    const groupName = getGroupName(item.groupId);

    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <ThemeText variant="title" style={styles.expenseDescription}>
            {item.description}
          </ThemeText>
          <ThemeText variant="title" style={styles.expenseAmount}>
            ${item.amount.toFixed(2)}
          </ThemeText>
        </View>
        
        <View style={styles.expenseDetails}>
          <View style={styles.expenseInfo}>
            <ThemeText>
              {isUserPayer ? 'You paid' : `${paidByName} paid`}
            </ThemeText>
            <ThemeText style={styles.groupName}>
              {groupName}
            </ThemeText>
          </View>
          <ThemeText style={styles.expenseDate}>
            {formatDate(item.createdAt)}
          </ThemeText>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Expenses" 
        rightIcon="plus"
        onRightPress={() => navigation.navigate('AddExpense', { groupId: '' })}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={loadExpenses}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="cash-remove" size={64} color={theme.colors.placeholder} />
              <ThemeText style={styles.emptyText}>No expenses yet</ThemeText>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('AddExpense', { groupId: '' })}
              >
                <Icon name="plus" size={24} color="#fff" />
                <ThemeText style={styles.addButtonText}>Add Expense</ThemeText>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddExpense', { groupId: '' })}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
    marginRight: 8,
  },
  expenseAmount: {
    fontWeight: 'bold',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  groupName: {
    opacity: 0.7,
    fontSize: 12,
    marginTop: 4,
  },
  expenseDate: {
    opacity: 0.7,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ExpensesScreen; 