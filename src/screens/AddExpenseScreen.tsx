import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { addExpense } from '../redux/expensesSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{[key: string]: string}>({});
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
    }
  }, [dispatch, groupId]);

  useEffect(() => {
    // Set the current user as the default payer when the group loads
    if (currentGroup && user && !paidBy) {
      setPaidBy(user.id);
    }
    
    // Initialize custom splits with zero amounts
    if (currentGroup && currentGroup.members.length > 0 && Object.keys(customSplits).length === 0) {
      const initialSplits = {};
      currentGroup.members.forEach(memberId => {
        initialSplits[memberId] = '0';
      });
      setCustomSplits(initialSplits);
    }
  }, [currentGroup, user, paidBy]);

  const getMemberName = (memberId) => {
    if (memberId === user?.id) return 'You';
    
    // In a real app, you would look up the member's name from your friends list
    // For now, we'll just use the ID
    return memberId;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSplitTypeChange = (type: 'equal' | 'custom') => {
    setSplitType(type);
    
    if (type === 'equal' && currentGroup) {
      // Reset custom splits
      const equalSplits = {};
      const totalAmount = parseFloat(amount) || 0;
      const perPersonAmount = totalAmount / currentGroup.members.length;
      
      currentGroup.members.forEach(memberId => {
        equalSplits[memberId] = perPersonAmount.toFixed(2);
      });
      
      setCustomSplits(equalSplits);
    }
  };

  const handleAddExpense = async () => {
    // Validate inputs
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!paidBy) {
      Alert.alert('Error', 'Please select who paid');
      return;
    }
    
    if (!currentGroup) return;
    
    // Calculate splits
    const totalAmount = parseFloat(amount);
    let splits = [];
    
    if (splitType === 'equal') {
      // Equal split
      const perPersonAmount = totalAmount / currentGroup.members.length;
      splits = currentGroup.members.map(memberId => ({
        userId: memberId,
        amount: perPersonAmount
      }));
    } else {
      // Custom split
      const customSplitTotal = Object.values(customSplits)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      
      if (Math.abs(customSplitTotal - totalAmount) > 0.01) {
        Alert.alert('Error', 'The sum of splits must equal the total amount');
        return;
      }
      
      splits = Object.entries(customSplits).map(([memberId, amount]) => ({
        userId: memberId,
        amount: parseFloat(amount) || 0
      }));
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
      
      Alert.alert('Success', 'Expense added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (groupLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Add Expense" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Add Expense" showBackButton onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <ThemeText style={styles.label}>Description</ThemeText>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Dinner, Groceries"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemeText style={styles.label}>Amount</ThemeText>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card
            }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>
        
        <View style={styles.formGroup}>
          <ThemeText style={styles.label}>Date</ThemeText>
          <TouchableOpacity
            style={[styles.dateInput, { 
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <ThemeText style={{ color: theme.colors.text }}>
              {formatDate(date)}
            </ThemeText>
            <Icon name="calendar" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>
        
        <View style={styles.formGroup}>
          <ThemeText style={styles.label}>Paid by</ThemeText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.selectContainer, { 
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card
            }]}
          >
            {currentGroup?.members.map(memberId => (
              <TouchableOpacity
                key={memberId}
                style={[
                  styles.selectOption,
                  { 
                    borderColor: theme.colors.border,
                    backgroundColor: paidBy === memberId ? theme.colors.primary : 'transparent',
                    marginRight: 8
                  }
                ]}
                onPress={() => setPaidBy(memberId)}
              >
                <ThemeText style={[
                  styles.selectOptionText,
                  { color: paidBy === memberId ? '#FFFFFF' : theme.colors.text }
                ]}>
                  {getMemberName(memberId)}
                </ThemeText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.formGroup}>
          <ThemeText style={styles.label}>Split Type</ThemeText>
          <View style={styles.splitTypeContainer}>
            <TouchableOpacity
              style={[
                styles.splitTypeOption,
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: splitType === 'equal' ? theme.colors.primary : theme.colors.card
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
                { color: splitType === 'equal' ? '#FFFFFF' : theme.colors.text }
              ]}>
                Equal
              </ThemeText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.splitTypeOption,
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: splitType === 'custom' ? theme.colors.primary : theme.colors.card
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
                { color: splitType === 'custom' ? '#FFFFFF' : theme.colors.text }
              ]}>
                Custom
              </ThemeText>
            </TouchableOpacity>
          </View>
        </View>
        
        {splitType === 'custom' && (
          <View style={styles.formGroup}>
            <ThemeText style={styles.label}>Custom Split</ThemeText>
            {currentGroup?.members.map(memberId => (
              <View key={memberId} style={styles.customSplitRow}>
                <ThemeText style={styles.memberName}>
                  {getMemberName(memberId)}
                </ThemeText>
                <TextInput
                  style={[styles.splitInput, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.card
                  }]}
                  value={customSplits[memberId] || ''}
                  onChangeText={(value) => {
                    setCustomSplits({
                      ...customSplits,
                      [memberId]: value
                    });
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
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
    padding: 16,
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
  selectContainer: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  selectOption: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
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
    marginBottom: 40,
  },
});

export default AddExpenseScreen; 