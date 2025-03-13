import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { fetchExpenses, deleteExpense } from '../redux/expensesSlice';
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

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

const { width } = Dimensions.get('window');

export const GroupDetailScreen = ({ route, navigation }: Props) => {
  const { groupId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const { expenses, loading: expensesLoading } = useSelector((state: RootState) => state.expenses);
  const user = useSelector((state: RootState) => state.auth.user);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
      dispatch(fetchExpenses(groupId));
    }
  }, [dispatch, groupId, expenses.length]);

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

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const createdAt = new Date(item.createdAt);
    const formattedDate = `${createdAt.getMonth() + 1}/${createdAt.getDate()}/${createdAt.getFullYear()}`;
    const isPayer = item.paidBy === user?.id;
    
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
            <ThemeText variant="body">${item.amount.toFixed(2)}</ThemeText>
            <ThemeText variant="caption">
              {isPayer ? 'You paid' : `Paid by ${item.paidBy}`}
            </ThemeText>
          </View>
        </Card>
      </Swipeable>
    );
  };

  const renderMemberItem = ({ item: memberId }: { item: string }) => {
    const balances = currentGroup?.balances || [];
    const balance = balances.find(b => b.userId === memberId);
    const isCurrentUser = memberId === user?.id;
    const balanceAmount = balance?.amount || 0;
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
        <ThemeText style={[styles.memberBalance, { color: balanceColor }]}>
          {balanceAmount === 0 ? 'All settled' :
           balanceAmount > 0 ? `Gets back $${balanceAmount.toFixed(2)}` :
           `Owes $${Math.abs(balanceAmount).toFixed(2)}`}
        </ThemeText>
      </Card>
    );
  };

  const renderSettlementItem = ({ item: debt }: { item: Debt }) => {
    const isDebtor = debt.from === user?.id;
    const isCreditor = debt.to === user?.id;
    
    if (!isDebtor && !isCreditor) return null;

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
              `You owe ${debt.to}` : 
              `${debt.from} owes you`}
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
              onPress={() => {
                // TODO: Implement settlement logic
                Alert.alert('Coming soon', 'Settlement feature is under development');
              }}
              style={styles.settleButton}
              size="small"
              variant="outline"
            />
          )}
        </View>
      </Card>
    );
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
            <Card style={[styles.actionCard, { backgroundColor: theme.colors.primary }]}>
              <ThemeText style={styles.actionTitle}>Total Expenses</ThemeText>
              <ThemeText style={styles.actionAmount}>
                ${(currentGroup.totalExpenses || 0).toFixed(2)}
              </ThemeText>
            </Card>

            <Card style={[styles.actionCard, { 
              backgroundColor: userBalance > 0 ? theme.colors.success : 
                            userBalance < 0 ? theme.colors.error :
                            theme.colors.card
            }]}>
              <ThemeText style={styles.actionTitle}>
                {userBalance > 0 ? 'You are owed' :
                 userBalance < 0 ? 'You owe' :
                 'You are settled up'}
              </ThemeText>
              <ThemeText style={styles.actionAmount}>
                ${Math.abs(userBalance).toFixed(2)}
              </ThemeText>
            </Card>
          </ScrollView>

          <View style={styles.actionButtons}>
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
            <CustomButton
              title="Add Expense"
              onPress={() => setShowAddExpense(true)}
              icon={<Icon name="plus" size={20} color="#FFFFFF" />}
              style={styles.actionButton}
              size="small"
            />
          </View>

          <View style={styles.expensesContainer}>
            <View style={styles.expensesHeader}>
              <ThemeText variant="title">Recent Expenses</ThemeText>
            </View>

            {expensesLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
              <FlatList
                data={expenses}
                renderItem={renderExpenseItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.expensesList}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Icon name="cash-remove" size={48} color={theme.colors.placeholder} />
                    <ThemeText style={styles.emptyStateText}>
                      No expenses yet
                    </ThemeText>
                  </View>
                }
              />
            )}
          </View>
        </View>
        {renderAddExpenseModal()}
        {renderMembersModal()}
        {renderSettleUpModal()}
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
  },
  actionCard: {
    padding: 16,
    marginRight: 12,
    width: width * 0.7,
    minHeight: 100,
    justifyContent: 'center',
  },
  actionTitle: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  actionAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
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
    marginBottom: 12,
    padding: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  settlementValue: {
    fontWeight: '600',
    marginRight: 12,
  },
  settleButton: {
    minWidth: 80,
  },
});

export default GroupDetailScreen;