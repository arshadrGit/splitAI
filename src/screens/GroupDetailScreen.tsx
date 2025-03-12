import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { fetchExpenses, addExpense, deleteExpense } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Expense } from '../types';

export const GroupDetailScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{[key: string]: string}>({});
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const { expenses, loading: expensesLoading } = useSelector((state: RootState) => state.expenses);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
      dispatch(fetchExpenses(groupId));
    }
  }, [dispatch, groupId]);

  useEffect(() => {
    // Set the current user as the default payer when the group loads
    if (currentGroup && user && !paidBy) {
      setPaidBy(user.id);
    }
  }, [currentGroup, user]);

  const handleAddExpense = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!currentGroup || !user) return;

    // Calculate splits based on the selected split type
    const totalAmount = parseFloat(amount);
    const splits = [];
    
    if (splitType === 'equal') {
      // Equal split among all members
      const memberCount = currentGroup.members.length;
      const amountPerPerson = totalAmount / memberCount;
      
      for (const memberId of currentGroup.members) {
        splits.push({
          userId: memberId,
          amount: amountPerPerson,
        });
      }
    } else {
      // Custom split
      let totalSplit = 0;
      
      for (const [memberId, splitAmount] of Object.entries(customSplits)) {
        const amount = parseFloat(splitAmount);
        if (!isNaN(amount) && amount > 0) {
          splits.push({
            userId: memberId,
            amount,
          });
          totalSplit += amount;
        }
      }
      
      // Validate that the total split equals the expense amount
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        Alert.alert('Error', 'The sum of splits must equal the total amount');
        return;
      }
    }

    setLoading(true);
    try {
      await dispatch(addExpense({
        groupId,
        description,
        amount: totalAmount,
        paidBy,
        date,
        splits,
        createdBy: user.id,
        createdAt: new Date(),
      })).unwrap();
      
      setDescription('');
      setAmount('');
      setCustomSplits({});
      setShowAddExpense(false);
      Alert.alert('Success', 'Expense added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const initializeCustomSplits = () => {
    if (!currentGroup) return;
    
    const splits: {[key: string]: string} = {};
    currentGroup.members.forEach(memberId => {
      splits[memberId] = '';
    });
    setCustomSplits(splits);
  };

  const handleSplitTypeChange = (type: 'equal' | 'custom') => {
    setSplitType(type);
    if (type === 'custom') {
      initializeCustomSplits();
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteExpense({ expenseId, groupId })).unwrap();
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (expenseId: string) => {
    return (
      <Pressable
        style={[styles.deleteAction, { backgroundColor: theme.colors.error }]}
        onPress={() => handleDeleteExpense(expenseId)}
      >
        <Icon name="delete" size={24} color="#FFFFFF" />
      </Pressable>
    );
  };

  const renderExpenseItem = ({ item }: { item: any }) => {
    const date = new Date(item.date);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
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
            <View style={styles.expenseDetail}>
              <Icon name="calendar" size={16} color={theme.colors.text} />
              <ThemeText variant="caption" style={styles.detailText}>
                {formattedDate}
              </ThemeText>
            </View>
            <View style={styles.expenseDetail}>
              <Icon name="account" size={16} color={theme.colors.text} />
              <ThemeText variant="caption" style={styles.detailText}>
                Paid by {item.paidBy === user?.id ? 'you' : item.paidBy}
              </ThemeText>
            </View>
          </View>
        </Card>
      </Swipeable>
    );
  };

  if (groupLoading || !currentGroup) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header 
          title="Group Details" 
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header 
          title={currentGroup.name} 
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()}
          rightIcon="plus"
          onRightPress={() => navigation.navigate('AddExpense', { groupId })}
        />
        
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemeText variant="caption">Total Expenses</ThemeText>
              <ThemeText variant="title">${currentGroup.totalExpenses.toFixed(2)}</ThemeText>
            </View>
            <View style={styles.summaryItem}>
              <ThemeText variant="caption">Members</ThemeText>
              <ThemeText variant="title">{currentGroup.members.length}</ThemeText>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('SettleUp', { groupId })}
            >
              <Icon name="cash-multiple" size={20} color="#FFFFFF" />
              <ThemeText style={styles.actionButtonText}>Settle Up</ThemeText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
              onPress={() => navigation.navigate('GroupMembers', { groupId })}
            >
              <Icon name="account-group" size={20} color="#FFFFFF" />
              <ThemeText style={styles.actionButtonText}>Members</ThemeText>
            </TouchableOpacity>
          </View>
        </Card>
        
        <View style={styles.expensesContainer}>
          <View style={styles.sectionHeader}>
            <ThemeText variant="subtitle" style={styles.sectionTitle}>Expenses</ThemeText>
            <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { groupId })}>
              <Icon name="plus" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          {expensesLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <FlatList
              data={expenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.expensesList}
              ListEmptyComponent={
                <View style={styles.emptyExpenses}>
                  <Icon name="cash-remove" size={48} color={theme.colors.placeholder} />
                  <ThemeText style={styles.emptyText}>No expenses yet</ThemeText>
                  <CustomButton
                    title="Add an Expense"
                    onPress={() => navigation.navigate('AddExpense', { groupId })}
                    variant="outline"
                    style={styles.addExpenseButton}
                    icon={<Icon name="plus" size={18} color={theme.colors.primary} />}
                  />
                </View>
              }
            />
          )}
        </View>
      </View>
    </GestureHandlerRootView>
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
  summaryCard: {
    margin: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  expensesContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  expensesList: {
    flexGrow: 1,
  },
  expenseCard: {
    marginBottom: 12,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    fontWeight: '600',
  },
  expenseAmount: {
    fontWeight: '600',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  expenseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
  },
  emptyExpenses: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addExpenseButton: {
    minWidth: 150,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    marginBottom: 12,
  },
});

export default GroupDetailScreen;