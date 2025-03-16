import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  RefreshControl,
  Text,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { fetchExpenses, deleteExpense, recordPayment } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Expense, Balance, Debt } from '../types';
import AddExpenseForm from '../components/AddExpenseForm';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { auth } from '../firebase/firebaseConfig';
import { useIsFocused } from '@react-navigation/native';
import { lightTheme } from '../themes/lightTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

const { width, height } = Dimensions.get('window');

export const GroupDetailScreen = ({ route, navigation }: Props) => {
  const { groupId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const { expenses, loading: expensesLoading } = useSelector((state: RootState) => state.expenses);
  const user = useSelector((state: RootState) => state.auth.user);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'paid' | 'received'>('all');
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [showSettlementHistory, setShowSettlementHistory] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // useEffect(() => {
  //   if (groupId && !showAddExpense) {
  //     dispatch(fetchGroupById(groupId));
  //     dispatch(fetchExpenses(groupId));
  //   }
  // }, [dispatch, groupId, showAddExpense]);

  // Add this effect to refresh expenses when navigating between groups
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (groupId) {
        console.log('Screen focused, refreshing data for group ID:', groupId);
        // Use Promise.all to ensure both requests complete
        Promise.all([
          dispatch(fetchGroupById(groupId)),
          dispatch(fetchExpenses(groupId))
        ]).then(() => {
          console.log('Data refreshed on screen focus');
        }).catch(error => {
          console.error('Error refreshing data:', error);
        });
      }
    });

    return unsubscribe;
  }, [navigation, dispatch, groupId]);

  // Add a debug effect to log expenses
  useEffect(() => {
    if (currentGroup && expenses.length > 0) {
      console.log('Current Group Data:', {
        groupId,
        members: currentGroup.members,
        balances: currentGroup.balances,
      });

      // Debug expenses data
      console.log('All Expenses:', expenses.map(e => ({
        id: e.id,
        description: e.description,
        groupId: e.groupId,
        amount: e.amount,
        type: e.type,
        payeeId: e.payeeId,
        createdAt: e.createdAt
      })));

      // Debug filtered expenses
      const groupExpenses = expenses.filter(e => e.groupId === groupId);
      console.log('Filtered Expenses for this group:', groupExpenses.length);

      // Debug payment transactions
      const paymentTransactions = expenses.filter(e => e.type === 'payment' && e.groupId === groupId);
      console.log('Payment Transactions:', paymentTransactions.length, paymentTransactions);
    }
  }, [currentGroup, expenses, groupId]);

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await dispatch(deleteExpense({ expenseId, groupId })).unwrap();
      Alert.alert('Success', 'Expense deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const renderRightActions = (expenseId: string) => {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: theme.colors.error }]}
        onPress={() => handleDeleteExpense(expenseId)}
      >
        <Icon name="delete" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  const onRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    setRefreshing(true);

    Promise.all([
      dispatch(fetchGroupById(groupId)),
      dispatch(fetchExpenses(groupId))
    ]).then(() => {
      console.log('Data refreshed successfully');
      setRefreshing(false);
    }).catch(error => {
      console.error('Error refreshing data:', error);
      setRefreshing(false);
    });
  }, [dispatch, groupId]);

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const createdAt = new Date(item.createdAt);
    const formattedDate = `${createdAt.getMonth() + 1}/${createdAt.getDate()}/${createdAt.getFullYear()}`;

    // Handle payment transactions differently
    if (item.type === 'payment') {
      const isPayer = item.paidBy === user?.id;
      const isPayee = item.payeeId === user?.id;

      // Get display names for users
      const getDisplayName = (userId: string) => {
        if (userId === user?.id) return 'You';
        return userId; // In a real app, you'd look up the user's display name
      };

      const payerName = getDisplayName(item.paidBy);
      const payeeName = getDisplayName(item.payeeId || '');

      return (
        <Card style={[styles.expenseCard, { borderLeftColor: theme.colors.success, borderLeftWidth: 4 }]}>
          <View style={styles.expenseHeader}>
            <ThemeText variant="title">Payment Settlement</ThemeText>
            <ThemeText variant="caption">{formattedDate}</ThemeText>
          </View>
          <View style={styles.expenseDetails}>
            <View>
              <ThemeText variant="body">${item.amount.toFixed(2)}</ThemeText>
              <ThemeText variant="caption">
                {`${payerName} paid ${payeeName}`}
              </ThemeText>
            </View>
            <View style={styles.expenseBalance}>
              <ThemeText
                style={[
                  styles.balanceText,
                  { color: isPayer ? theme.colors.error : isPayee ? theme.colors.success : theme.colors.text }
                ]}
              >
                {isPayer ? 'Paid' : isPayee ? 'Received' : 'Settlement'}
              </ThemeText>
            </View>
          </View>
        </Card>
      );
    }

    // Regular expense handling
    const isPayer = item.paidBy === user?.id;

    // Find the user's split in this expense
    const userSplit = item.splits.find(split => split.userId === user?.id);
    const userAmount = userSplit?.amount || 0;

    // Calculate if the user owes money or is owed money in this expense
    const userBalance = isPayer ? item.amount - userAmount : -userAmount;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <Card style={styles.expenseCard}>
          <View style={styles.expenseHeader}>
            <ThemeText variant="title">{item.description}</ThemeText>
            <ThemeText variant="caption">{formattedDate}</ThemeText>
          </View>
          <View style={styles.expenseDetails}>
            <View>
              <ThemeText variant="body">${item.amount.toFixed(2)}</ThemeText>
              <ThemeText variant="caption">
                {isPayer ? 'You paid' : `Paid by ${item.paidBy}`}
              </ThemeText>
            </View>
            <View style={styles.expenseBalance}>
              <ThemeText
                style={[
                  styles.balanceText,
                  { color: userBalance > 0 ? theme.colors.success : userBalance < 0 ? theme.colors.error : theme.colors.text }
                ]}
              >
                {userBalance > 0
                  ? `You get back $${userBalance.toFixed(2)}`
                  : userBalance < 0
                    ? `You owe $${Math.abs(userBalance).toFixed(2)}`
                    : 'Settled'}
              </ThemeText>
            </View>
          </View>
          {item.splitType !== 'EQUAL' && (
            <View style={styles.splitInfo}>
              <ThemeText variant="caption" style={styles.splitTypeText}>
                {item.splitType === 'EXACT' ? 'Custom split' : 'Percentage split'}
              </ThemeText>
            </View>
          )}
        </Card>
      </Swipeable>
    );
  };

  const renderMemberItem = ({ item: memberId }: { item: string }) => {
    const balances = currentGroup?.balances || [];
    const balance = balances.find(b => b.userId === memberId);
    const isCurrentUser = memberId === user?.id;
    const balanceAmount = balance?.amount || 0;

    // Debug logging
    console.log('Member Balance:', {
      memberId,
      balance,
      balanceAmount,
      allBalances: balances
    });

    const balanceColor = balanceAmount > 0 ? theme.colors.success :
      balanceAmount < 0 ? theme.colors.error :
        theme.colors.text;

    return (
      <Card style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <Icon name="account" size={24} color={theme.colors.text} />
          <ThemeText style={styles.memberName}>
            {isCurrentUser ? 'You' : memberId}
          </ThemeText>
        </View>
        {/* <ThemeText style={[styles.memberBalance, { color: balanceColor }]}>
          {balanceAmount === 0 ? 'All settled' :
            balanceAmount > 0 ? `Gets back $${Math.abs(balanceAmount).toFixed(2)}` :
              `Owes $${Math.abs(balanceAmount).toFixed(2)}`}
        </ThemeText> */}
      </Card>
    );
  };

  const renderSettlementItem = ({ item: debt }: { item: Debt }) => {
    const isDebtor = debt.from === user?.id;
    const isCreditor = debt.to === user?.id;

    if (!isDebtor && !isCreditor) return null;

    // Get display names for users
    const getDisplayName = (userId: string) => {
      if (userId === user?.id) return 'You';
      return userId; // In a real app, you'd look up the user's display name
    };

    const fromName = getDisplayName(debt.from);
    const toName = getDisplayName(debt.to);

    return (
      <Card style={styles.settlementCard}>
        <View style={styles.settlementInfo}>
          <Icon
            name={isDebtor ? "arrow-up-circle" : "arrow-down-circle"}
            size={24}
            color={isDebtor ? theme.colors.error : theme.colors.success}
          />
          <ThemeText style={styles.settlementText}>
            {isDebtor ?
              `You owe ${toName}` :
              `${fromName} owes you`}
          </ThemeText>
        </View>
        <View style={styles.settlementAmount}>
          <ThemeText style={[styles.settlementValue, {
            color: isDebtor ? theme.colors.error : theme.colors.success
          }]}>
            ${debt.amount.toFixed(2)}
          </ThemeText>
          {(isDebtor || isCreditor) && (
            <CustomButton
              title="Settle"
              onPress={() => handleSettleUp(debt)}
              style={styles.settleButton}
              size="small"
              variant="outline"
            />
          )}
        </View>
      </Card>
    );
  };

  // Handle the settle up button press
  const handleSettleUp = (debt: Debt) => {
    setSelectedDebt(debt);
    setSettlementAmount(debt.amount.toFixed(2));
    setShowSettlementModal(true);
  };

  // Handle recording a payment
  const handleRecordPayment = async () => {
    if (!selectedDebt || !user?.id) {
      Alert.alert('Error', 'No debt selected or user not logged in');
      return;
    }

    try {
      // Validate payment amount
      const amount = parseFloat(settlementAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      // Validate amount doesn't exceed debt
      if (amount > selectedDebt.amount) {
        Alert.alert('Error', `The maximum amount you can settle is $${selectedDebt.amount.toFixed(2)}`);
        return;
      }

      // Determine who is paying whom
      const payerId = selectedDebt.from;
      const payeeId = selectedDebt.to;

      // Show loading indicator
      setRefreshing(true);

      console.log('Recording payment:', {
        groupId,
        payerId,
        payeeId,
        amount
      });

      try {
        // Record the payment
        const result = await dispatch(
          recordPayment({
            groupId,
            payerId,
            payeeId,
            amount
          })
        ).unwrap();

        console.log('Payment recorded successfully:', result);

        // Close the modal and reset the state
        setShowSettlementModal(false);
        setSelectedDebt(null);
        setSettlementAmount('');

        // Refresh data
        try {
          await Promise.all([
            dispatch(fetchGroupById(groupId)),
            dispatch(fetchExpenses(groupId))
          ]);
          console.log('Data refreshed after payment');
        } catch (refreshError) {
          console.error('Error refreshing data after payment:',
            typeof refreshError === 'object' ? JSON.stringify(refreshError) : refreshError);
          // Continue even if refresh fails
        }

        // Show success message
        Alert.alert('Success', 'Payment recorded successfully');
      } catch (paymentError) {
        console.error('Error recording payment:',
          typeof paymentError === 'object' ? JSON.stringify(paymentError) : paymentError);
        Alert.alert('Error', 'Failed to record payment. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error in handleRecordPayment:',
        typeof error === 'object' ? JSON.stringify(error) : error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      // Hide loading indicator
      setRefreshing(false);
    }
  };

  const renderAddExpenseModal = () => (
    <Modal
      visible={showAddExpense}
      animationType="slide"
      onRequestClose={() => setShowAddExpense(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Add Expense"
          leftIcon="close"
          onLeftPress={() => setShowAddExpense(false)}
        />
        <AddExpenseForm
          groupId={groupId}
          participants={currentGroup?.members || []}
          onSuccess={() => {
            setShowAddExpense(false);
            dispatch(fetchExpenses(groupId));
            dispatch(fetchGroupById(groupId));
            Alert.alert('Success', 'Expense added successfully');
          }}
          onCancel={() => setShowAddExpense(false)}
        />
      </View>
    </Modal>
  );

  const renderMembersModal = () => (
    <Modal
      visible={showMembers}
      animationType="slide"
      onRequestClose={() => setShowMembers(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Group Members"
          leftIcon="close"
          onLeftPress={() => setShowMembers(false)}
        />
        <FlatList
          data={currentGroup?.members || []}
          renderItem={renderMemberItem}
          keyExtractor={item => item}
          contentContainerStyle={styles.membersList}
        />
      </View>
    </Modal>
  );

  const renderSettleUpModal = () => (
    <Modal
      visible={showSettleUp}
      animationType="slide"
      onRequestClose={() => setShowSettleUp(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Settle Up"
          leftIcon="close"
          onLeftPress={() => setShowSettleUp(false)}
        />

        {/* <View style={styles.settleUpInfo}>
          <ThemeText style={styles.settleUpInfoText}>
            These are the simplified payments that will settle all debts in the group with the minimum number of transactions.
          </ThemeText>

          <Card style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Icon name="information-outline" size={20} color={theme.colors.primary} />
              <ThemeText style={[styles.helpTitle, { color: theme.colors.primary }]}>How Settle Up Works</ThemeText>
            </View>
            <ThemeText style={styles.helpText}>
              1. Each expense is tracked with who paid and how it's split.
            </ThemeText>
            <ThemeText style={styles.helpText}>
              2. Balances are calculated for each person (positive if owed money, negative if owing money).
            </ThemeText>
            <ThemeText style={styles.helpText}>
              3. When you settle up, you record a payment from someone who owes to someone who is owed.
            </ThemeText>
            <ThemeText style={styles.helpText}>
              4. The app simplifies debts to minimize the number of transactions needed to settle everyone up.
            </ThemeText>
          </Card>
        </View> */}

        <FlatList
          data={currentGroup?.simplifiedDebts || []}
          renderItem={renderSettlementItem}
          keyExtractor={(item, index) => `${item.from}-${item.to}-${index}`}
          contentContainerStyle={styles.settlementList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={48} color={theme.colors.success} />
              <ThemeText style={styles.emptyStateText}>
                All settled up!
              </ThemeText>
            </View>
          }
        />
      </View>
    </Modal>
  );

  // Render the settlement modal
  const renderSettlementModal = () => (
    <Modal
      visible={showSettlementModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSettlementModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSettlementModal(false)}
      >
        <View style={[styles.settlementModalContent, { backgroundColor: theme.colors.card }]}>
          <ThemeText variant="title" style={styles.modalTitle}>
            Settle Up
          </ThemeText>

          {selectedDebt && (
            <>
              <View style={styles.settlementDetails}>
                <ThemeText style={styles.settlementLabel}>
                  {selectedDebt.from === user?.id ?
                    `You are paying ${selectedDebt.to}` :
                    `${selectedDebt.from} is paying you`}
                </ThemeText>
                <View style={styles.amountInputContainer}>
                  <ThemeText style={styles.currencySymbol}>$</ThemeText>
                  <TextInput
                    style={[styles.amountInput, { color: theme.colors.text }]}
                    value={settlementAmount}
                    onChangeText={setSettlementAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.placeholder}
                  />
                </View>
                <ThemeText style={styles.maxAmount}>
                  Maximum: ${selectedDebt.amount.toFixed(2)}
                </ThemeText>
              </View>

              <View style={styles.settlementActions}>
                <CustomButton
                  title="Cancel"
                  onPress={() => setShowSettlementModal(false)}
                  variant="outline"
                  style={styles.settlementButton}
                />
                <CustomButton
                  title="Payment"
                  onPress={handleRecordPayment}
                  style={styles.settlementButton}
                />
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSettlementHistory = () => {
    const settlementTransactions = expenses.filter(expense => expense.type === 'payment' && expense.groupId === groupId);

    console.log('Settlement Transactions for history:', settlementTransactions.length);

    if (settlementTransactions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="cash-check" size={48} color={theme.colors.placeholder} />
          <ThemeText style={styles.emptyStateText}>
            No settlement history yet
          </ThemeText>
        </View>
      );
    }

    return (
      <FlatList
        data={settlementTransactions}
        renderItem={({ item }) => {
          const isPayer = item.paidBy === user?.id;
          const isPayee = item.payeeId === user?.id;
          const createdAt = new Date(item.createdAt);
          const formattedDate = `${createdAt.getMonth() + 1}/${createdAt.getDate()}/${createdAt.getFullYear()}`;

          // Get display names for users
          const getDisplayName = (userId: string) => {
            if (userId === user?.id) return 'You';
            return userId; // In a real app, you'd look up the user's display name
          };

          const payerName = getDisplayName(item.paidBy);
          const payeeName = getDisplayName(item.payeeId || '');

          return (
            <Card style={[styles.settlementCard, { borderLeftColor: theme.colors.success, borderLeftWidth: 4 }]}>
              <View style={styles.settlementHeader}>
                <ThemeText variant="title">Payment Settlement</ThemeText>
                <ThemeText variant="caption">{formattedDate}</ThemeText>
              </View>
              <View style={styles.settlementDetailsContainer}>
                <ThemeText variant="body">
                  {`${payerName} paid ${payeeName}`}
                </ThemeText>
                <ThemeText
                  style={[
                    styles.settlementValue,
                    { color: isPayer ? theme.colors.error : isPayee ? theme.colors.success : theme.colors.text }
                  ]}
                >
                  ${item.amount.toFixed(2)}
                </ThemeText>
              </View>
            </Card>
          );
        }}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.settlementList}
      />
    );
  };

  // Add settlement history modal
  const renderSettlementHistoryModal = () => (
    <Modal
      visible={showSettlementHistory}
      animationType="slide"
      onRequestClose={() => setShowSettlementHistory(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Settlement History"
          leftIcon="close"
          onLeftPress={() => setShowSettlementHistory(false)}
          rightIcon="refresh"
          onRightPress={onRefresh}
        />
        {renderSettlementHistory()}
      </View>
    </Modal>
  );

  if (groupLoading || !currentGroup) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Loading..."
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const balances = currentGroup.balances || [];
  const userBalance = balances.find(b => b.userId === user?.id)?.amount || 0;
  const simplifiedDebts = currentGroup.simplifiedDebts || [];
  const members = currentGroup.members || [];

  // Filter expenses based on the selected filter and ensure they belong to the current group
  const filteredExpenses = expenses.filter(expense => {
    const userId = user?.id || '';
    // First, ensure the expense belongs to this group
    if (expense.groupId !== groupId) return false;

    // Then apply the user's filter
    if (expenseFilter === 'all') return true;
    if (expenseFilter === 'paid') return expense.paidBy === userId;
    if (expenseFilter === 'received') return expense.paidBy !== userId && expense.participants.includes(userId);
    return true;
  });

  // Sort expenses by date (most recent first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Limit the number of expenses shown unless showAllExpenses is true
  const displayExpenses = showAllExpenses ? sortedExpenses : sortedExpenses.slice(0, 5);

  // Update the action buttons section
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <View style={styles.actionButtonRow}>
        <CustomButton
          title="Members"
          onPress={() => setShowMembers(true)}
          icon={<Icon name="account-group" size={20} color="#FFFFFF" />}
          style={styles.actionButton}
          size="small"
        />
        <CustomButton
          title="Settle Up"
          onPress={() => setShowSettleUp(true)}
          icon={<Icon name="cash-multiple" size={20} color="#FFFFFF" />}
          style={styles.actionButton}
          size="small"
        />
      </View>
      <View style={styles.actionButtonRow}>
        <CustomButton
          title="Add Expense"
          onPress={() => setShowAddExpense(true)}
          icon={<Icon name="plus" size={20} color="#FFFFFF" />}
          style={styles.actionButton}
          size="small"
        />
        <CustomButton
          title="History"
          onPress={() => setShowSettlementHistory(true)}
          icon={<Icon name="history" size={20} color="#FFFFFF" />}
          style={styles.actionButton}
          size="small"
        />
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title={currentGroup.name || 'Group'}
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionCards}>
            <Card style={styles.actionCard}>
              <View style={{flexDirection:'row'}}>
                <Icon
                  name="chart-timeline-variant"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.actionIcon}
                />
                <ThemeText style={styles.actionTitle}>Total Expenses</ThemeText>
              </View>
              <ThemeText style={[styles.actionAmount, { color: theme.colors.text }]}>
                ${(currentGroup.totalExpenses || 0).toFixed(2)}
              </ThemeText>
              <ThemeText style={styles.actionSubtext}>Group total</ThemeText>
            </Card>

            <Card style={[styles.actionCard, {
              borderLeftWidth: 3,
              borderLeftColor: userBalance > 0 ? theme.colors.success :
                userBalance < 0 ? theme.colors.error :
                  theme.colors.primary
            }]}>
              <View style={{flexDirection:'row'}}>
              <Icon
                name={userBalance > 0 ? "arrow-down-circle" :
                  userBalance < 0 ? "arrow-up-circle" :
                    "check-circle"}
                size={20}
                color={userBalance > 0 ? theme.colors.success :
                  userBalance < 0 ? theme.colors.error :
                    theme.colors.primary}
                style={styles.actionIcon}
              />
              <ThemeText style={styles.actionTitle}>Your Balance</ThemeText>
              </View>
              <ThemeText style={[styles.actionAmount, {
                color: userBalance > 0 ? theme.colors.success :
                  userBalance < 0 ? theme.colors.error :
                    theme.colors.text
              }]}>
                ${Math.abs(userBalance).toFixed(2)}
              </ThemeText>
              <ThemeText style={styles.actionSubtext}>
                {userBalance > 0 ? 'You are owed' :
                  userBalance < 0 ? 'You owe' :
                    'All settled up'}
              </ThemeText>
            </Card>
          </ScrollView>

          {renderActionButtons()}

          <View style={styles.expensesContainer}>
            <View style={styles.expensesHeader}>
              <ThemeText variant="title">Recent Expenses</ThemeText>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    expenseFilter === 'all' && styles.activeFilterButton
                  ]}
                  onPress={() => setExpenseFilter('all')}
                >
                  <ThemeText
                    style={[
                      styles.filterText,
                      expenseFilter === 'all' && styles.activeFilterText
                    ]}
                  >
                    All
                  </ThemeText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    expenseFilter === 'paid' && styles.activeFilterButton
                  ]}
                  onPress={() => setExpenseFilter('paid')}
                >
                  <ThemeText
                    style={[
                      styles.filterText,
                      expenseFilter === 'paid' && styles.activeFilterText
                    ]}
                  >
                    Paid
                  </ThemeText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    expenseFilter === 'received' && styles.activeFilterButton
                  ]}
                  onPress={() => setExpenseFilter('received')}
                >
                  <ThemeText
                    style={[
                      styles.filterText,
                      expenseFilter === 'received' && styles.activeFilterText
                    ]}
                  >
                    Received
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </View>

            {expensesLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <>
                <FlatList
                  data={displayExpenses}
                  renderItem={renderExpenseItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.expensesList}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[theme.colors.primary]}
                      tintColor={theme.colors.primary}
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Icon name="cash-remove" size={48} color={theme.colors.placeholder} />
                      <ThemeText style={styles.emptyStateText}>
                        No expenses yet
                      </ThemeText>
                    </View>
                  }
                />
                {sortedExpenses.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setShowAllExpenses(!showAllExpenses)}
                  >
                    <ThemeText style={styles.viewAllText}>
                      {showAllExpenses ? 'Show Less' : `View All (${sortedExpenses.length})`}
                    </ThemeText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
        {renderAddExpenseModal()}
        {renderMembersModal()}
        {renderSettleUpModal()}
        {renderSettlementModal()}
        {renderSettlementHistoryModal()}
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
  content: {
    flex: 1,
    padding: 16,
  },
  actionCards: {
    flexGrow: 0,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actionCard: {
    padding: 12,
    marginRight: 10,
    width: width * 0.45,
    height: 90,
    // borderRadius: 12,
    // backgroundColor: '#FFFFFF',
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.08,
    // shadowRadius: 8,
    // elevation: 3,
  },
  actionTitle: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  actionAmount: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 11,
    opacity: 0.6,
    textAlign:'right'
  },
  actionIcon: {
    marginBottom: 8,
    fontSize: 18,
    marginRight:10
  },
  expensesContainer: {
    flex: 1,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expensesList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 8,
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
  },
  expenseCard: {
    marginBottom: 10,
    padding: 10,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    marginBottom: 12,
  },
  membersList: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    marginLeft: 12,
  },
  memberBalance: {
    fontWeight: '600',
  },
  settlementList: {
    padding: 16,
  },
  settlementCard: {
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  settlementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementText: {
    marginLeft: 12,
  },
  settlementAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settlementValue: {
    fontWeight: '600',
    marginRight: 12,
  },
  settleButton: {
    minWidth: 80,
  },
  expenseBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontWeight: '600',
    fontSize: 12,
  },
  splitInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  splitTypeText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  filterText: {
    fontSize: 12,
  },
  activeFilterText: {
    fontWeight: 'bold',
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    color: lightTheme.colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settlementModalContent: {
    padding: 24,
    borderRadius: 12,
    width: width * 0.8,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  settlementDetails: {
    marginBottom: 24,
  },
  settlementLabel: {
    fontSize: 16,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  currencySymbol: {
    marginRight: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
  },
  maxAmount: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  settlementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  settlementButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  settleUpInfo: {
    padding: 16,
    marginBottom: 24,
  },
  settleUpInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  helpCard: {
    marginBottom: 16,
    padding: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    marginBottom: 8,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settlementDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    marginBottom: 24,
  },
  actionButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default GroupDetailScreen;