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
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { fetchExpenses, addExpense } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  
  const dispatch = useDispatch();
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

  const renderExpenseItem = ({ item }: { item: any }) => {
    const date = new Date(item.date);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title={currentGroup.name} 
        leftIcon="arrow-left"
        onLeftPress={() => navigation.goBack()}
        rightIcon="plus"
        onRightPress={() => setShowAddExpense(true)}
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
          <TouchableOpacity onPress={() => setShowAddExpense(true)}>
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
                  onPress={() => setShowAddExpense(true)}
                  variant="outline"
                  style={styles.addExpenseButton}
                />
              </View>
            }
          />
        )}
      </View>
      
      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpense}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddExpense(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemeText variant="title">Add an Expense</ThemeText>
              <TouchableOpacity onPress={() => setShowAddExpense(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <View style={styles.formGroup}>
                <ThemeText style={styles.label}>Description</ThemeText>
                <TextInput
                  style={[styles.input, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background
                  }]}
                  placeholder="e.g., Dinner, Groceries"
                  placeholderTextColor={theme.colors.placeholder}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
              
              <View style={styles.formGroup}>
                <ThemeText style={styles.label}>Amount</ThemeText>
                <TextInput
                  style={[styles.input, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background
                  }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <ThemeText style={styles.label}>Date</ThemeText>
                <TouchableOpacity 
                  style={[styles.dateInput, { 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemeText>
                    {date.toLocaleDateString()}
                  </ThemeText>
                  <Icon name="calendar" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
              
              <View style={styles.formGroup}>
                <ThemeText style={styles.label}>Paid by</ThemeText>
                <View style={[styles.selectContainer, { 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background
                }]}>
                  {currentGroup.members.map(memberId => (
                    <TouchableOpacity
                      key={memberId}
                      style={[
                        styles.selectOption,
                        paidBy === memberId && { 
                          backgroundColor: theme.colors.primary,
                        }
                      ]}
                      onPress={() => setPaidBy(memberId)}
                    >
                      <ThemeText style={[
                        styles.selectOptionText,
                        paidBy === memberId && { color: '#FFFFFF' }
                      ]}>
                        {memberId === user?.id ? 'You' : memberId}
                      </ThemeText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <ThemeText style={styles.label}>Split Type</ThemeText>
                <View style={styles.splitTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.splitTypeOption,
                      splitType === 'equal' && { 
                        backgroundColor: theme.colors.primary,
                      }
                    ]}
                    onPress={() => handleSplitTypeChange('equal')}
                  >
                    <Icon 
                      name="equal" 
                      size={20} 
                      color={splitType === 'equal' ? '#FFFFFF' : theme.colors.text} 
                    />
                    <ThemeText style={[
                      styles.splitTypeText,
                      splitType === 'equal' && { color: '#FFFFFF' }
                    ]}>
                      Equal
                    </ThemeText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.splitTypeOption,
                      splitType === 'custom' && { 
                        backgroundColor: theme.colors.primary,
                      }
                    ]}
                    onPress={() => handleSplitTypeChange('custom')}
                  >
                    <Icon 
                      name="cash-multiple" 
                      size={20} 
                      color={splitType === 'custom' ? '#FFFFFF' : theme.colors.text} 
                    />
                    <ThemeText style={[
                      styles.splitTypeText,
                      splitType === 'custom' && { color: '#FFFFFF' }
                    ]}>
                      Custom
                    </ThemeText>
                  </TouchableOpacity>
                </View>
              </View>
              
              {splitType === 'custom' && (
                <View style={styles.formGroup}>
                  <ThemeText style={styles.label}>Custom Split</ThemeText>
                  {currentGroup.members.map(memberId => (
                    <View key={memberId} style={styles.customSplitRow}>
                      <ThemeText style={styles.memberName}>
                        {memberId === user?.id ? 'You' : memberId}
                      </ThemeText>
                      <TextInput
                        style={[styles.splitInput, { 
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                          backgroundColor: theme.colors.background
                        }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.colors.placeholder}
                        value={customSplits[memberId] || ''}
                        onChangeText={(value) => {
                          setCustomSplits({
                            ...customSplits,
                            [memberId]: value
                          });
                        }}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
                </View>
              )}
              
              <CustomButton
                title="Add Expense"
                onPress={handleAddExpense}
                loading={loading}
                style={styles.addButton}
                icon={<Icon name="check" size={20} color="#FFFFFF" />}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
  },
  selectContainer: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  selectOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  selectOptionText: {
    fontWeight: '500',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  splitTypeText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  customSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
    flex: 1,
  },
  splitInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'right',
  },
  addButton: {
    marginTop: 20,
  },
});

export default GroupDetailScreen;